// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import { Card, Button, Checkbox, Select, Input, Progress, Tabs, Avatar, Space, Row, Col, Statistic, message, Form, DatePicker, InputNumber, Modal, Tag, Descriptions, Divider } from "antd";
import { UserOutlined, HistoryOutlined, KeyOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, DownloadOutlined, MedicineBoxOutlined, ExperimentOutlined, SearchOutlined, SendOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import ReactECharts from 'echarts-for-react';
import * as Setting from "../Setting";
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

class PythonSrPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      searchHashId: '',
      patientRecords: [],
      hospitalOptions: [],
      isLoading: false,
      authorizationForm: {
        selectedHospitals: [],
        validityPeriod: 30,
        dataTimeRange: null,
        applicationNote: ''
      },
      isSubmittingRequest: false,
      // 患者授权请求相关状态
      patientAuthorizationRequests: [],
      isLoadingRequests: false,
      selectedRequest: null,
      showRequestModal: false,
      rejectReason: '',
      // 历史记录相关状态
      doctorHistoryRequests: [],
      patientHistoryRequests: [],
      isLoadingDoctorHistory: false,
      isLoadingPatientHistory: false,
      // 已授权患者记录
      authorizedPatientRecords: [],
      isLoadingAuthorizedRecords: false,
    };
    this.chartRef = React.createRef();
    this.formRef = React.createRef();
  }

  getChartOption = () => {
    const { hospitalOptions } = this.state;

    // 根据搜索结果动态生成数据，如果没有数据则使用默认数据
    let chartData;
    if (hospitalOptions.length > 0) {
      chartData = hospitalOptions.map(hospital => ({
        value: hospital.count,
        name: hospital.name,
        itemStyle: { color: this.getHospitalColor(hospital.name) }
      }));
    } else {
      chartData = [
        { value: 4, name: '广东省人民医院', itemStyle: { color: '#165DFF' } },
        { value: 3, name: '江苏省人民医院', itemStyle: { color: '#36BFFA' } },
        { value: 1, name: '医大一院', itemStyle: { color: '#0FC6C2' } }
      ];
    }

    return {
      title: {
        text: '就诊次数分布',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        itemWidth: 12,
        itemGap: 15
      },
      series: [
        {
          name: '就诊次数',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 0,
            borderColor: '#fff',
            borderWidth: 0
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    };
  }

  renderUserInfoCard = () => {
    const { account } = this.props;
    const userTag = account?.tag || '';

    // 根据tag确定卡片标题
    let cardTitle = "患者信息";
    let buttonText = "编辑患者信息";

    if (userTag === 'admin') {
      cardTitle = "管理员信息";
      buttonText = "编辑管理员信息";
    } else if (userTag === 'doctor') {
      cardTitle = "医生信息";
      buttonText = "编辑医生信息";
    }

    return (
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: '#165DFF' }} />
            {cardTitle}
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {/* 用户基本信息 */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          {userTag !== 'admin' && (
            <Avatar size={96} src={account?.avatar || "https://picsum.photos/id/237/100/100"} style={{ marginBottom: '12px' }} />
          )}
          <h4 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>
            {account?.displayName || account?.name || '未知用户'}
          </h4>
          <p style={{ color: '#86909C', margin: '4px 0 0 0' }}>
            ID: {account?.id || account?.name || 'N/A'}
          </p>
        </div>

        {/* 详细信息 */}
        <Space direction="vertical" style={{ width: '100%' }}>
          {userTag === 'admin' ? (
            // 管理员只显示编辑按钮
            null
          ) : (
            // 医生和用户显示详细信息
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909C' }}>性别</span>
                <span>{account?.gender || '未设置'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909C' }}>年龄</span>
                <span>{account?.birthday ? this.calculateAge(account.birthday) : '未设置'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#86909C' }}>联系方式</span>
                <span>{account?.phone || account?.email || '未设置'}</span>
              </div>
            </>
          )}
        </Space>

        {/* 编辑按钮 */}
        <Button
          type="primary"
          style={{ width: '100%', marginTop: '20px' }}
          onClick={() => Setting.openLink(Setting.getMyProfileUrl(account))}
        >
          {buttonText}
        </Button>
      </Card>
    );
  }

  calculateAge = (birthday) => {
    if (!birthday) return '未设置';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}岁`;
  }

  // 搜索患者记录
  searchPatientRecords = async () => {
    const { searchHashId } = this.state;
    if (!searchHashId.trim()) {
      message.warning('请输入患者HashID');
      return;
    }

    // 查询前清空数据
    this.setState({
      isLoading: true,
      patientRecords: [],
      hospitalOptions: []
    });

    try {
      console.log('开始搜索患者就诊记录，HashID:', searchHashId, '过滤条件: requestUri=/api/add-outpatient');

      const response = await fetch(`${Setting.ServerUrl}/api/get-patient-by-hash-id?hashId=${encodeURIComponent(searchHashId)}`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const res = await response.json();
      console.log('API响应数据:', res);

      if (res.status === 'ok') {
        const records = res.data || [];
        console.log('获取到的就诊记录数量:', records.length);

        if (records.length === 0) {
          message.warning('未找到该患者的就诊记录');
          this.setState({ patientRecords: [], hospitalOptions: [] });
          return;
        }

        // 解析记录中的医院信息
        const hospitals = this.extractHospitalsFromRecords(records);
        console.log('解析出的医院信息:', hospitals);

        if (hospitals.length === 0) {
          message.warning('找到记录但无法解析医院信息，请检查数据格式');
          this.setState({ patientRecords: records, hospitalOptions: [] });
          return;
        }

        this.setState({
          patientRecords: records,
          hospitalOptions: hospitals
        });

        message.success(`找到 ${records.length} 条就诊记录，涉及 ${hospitals.length} 家医院`);

        // 搜索成功后，更新医生的历史申请记录（只显示该患者的申请）
        const { account } = this.props;
        const userTag = account?.tag || '';
        if (userTag === 'doctor') {
          this.fetchDoctorHistoryRequests(searchHashId);
        }
      } else {
        console.error('API返回错误:', res);
        const errorMsg = res.msg || '查询失败';
        message.error(`查询失败: ${errorMsg}`);
        this.setState({ patientRecords: [], hospitalOptions: [] });
      }
    } catch (error) {
      console.error('搜索患者记录时发生错误:', error);

      let errorMessage = '查询失败，请稍后重试';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接';
      } else if (error.message.includes('HTTP错误')) {
        errorMessage = `服务器错误: ${error.message}`;
      } else if (error.message.includes('JSON')) {
        errorMessage = '服务器响应格式错误';
      }

      message.error(errorMessage);
      this.setState({ patientRecords: [], hospitalOptions: [] });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // 从记录中提取医院信息
  extractHospitalsFromRecords = (records) => {
    const hospitalMap = new Map();
    let parseErrorCount = 0;
    let validRecordCount = 0;

    console.log('开始解析记录，总数:', records.length);

    records.forEach((record, index) => {
      try {
        if (!record.object || record.object.trim() === '') {
          console.warn(`记录 ${index} 的object字段为空`);
          return;
        }

        console.log(`记录 ${index} 的原始object内容:`, record.object);
        console.log(`记录 ${index} 的object类型:`, typeof record.object);
        console.log(`记录 ${index} 的object长度:`, record.object.length);

        // 尝试清理可能的转义字符
        let cleanObject = record.object;
        if (typeof cleanObject === 'string') {
          // 移除可能的双重转义
          cleanObject = cleanObject.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        console.log(`记录 ${index} 清理后的object内容:`, cleanObject);

        const objectData = JSON.parse(cleanObject);
        validRecordCount++;
        console.log(`记录 ${index} 解析后的数据:`, objectData);

        // 检查所有可能的医院名称字段（根据实际数据结构调整）
        const hospitalName = objectData.admHosName || objectData.section || objectData.hospitalName || objectData.hosName || objectData.admHos;

        if (hospitalName) {
          console.log(`记录 ${index} 找到医院: ${hospitalName}`);

          if (hospitalMap.has(hospitalName)) {
            hospitalMap.set(hospitalName, hospitalMap.get(hospitalName) + 1);
          } else {
            hospitalMap.set(hospitalName, 1);
          }
        } else {
          console.warn(`记录 ${index} 没有找到医院名称字段，可用字段:`, Object.keys(objectData));
          console.warn(`记录 ${index} 完整数据:`, objectData);
        }
      } catch (error) {
        parseErrorCount++;
        console.error(`解析记录 ${index} 时发生错误:`, error);
        console.error('问题记录内容:', record);
        console.error('问题记录的object字段:', record.object);

        // 尝试手动解析（如果JSON.parse失败）
        try {
          const manualParse = this.manualParseObject(record.object);
          if (manualParse && manualParse.admHosName) {
            console.log(`记录 ${index} 手动解析成功，医院: ${manualParse.admHosName}`);
            const hospitalName = manualParse.admHosName;
            if (hospitalMap.has(hospitalName)) {
              hospitalMap.set(hospitalName, hospitalMap.get(hospitalName) + 1);
            } else {
              hospitalMap.set(hospitalName, 1);
            }
            validRecordCount++;
            parseErrorCount--;
          }
        } catch (manualError) {
          console.error(`记录 ${index} 手动解析也失败:`, manualError);
        }
      }
    });

    console.log(`解析完成 - 有效记录: ${validRecordCount}, 解析错误: ${parseErrorCount}, 找到医院: ${hospitalMap.size}家`);

    const result = Array.from(hospitalMap.entries()).map(([name, count]) => ({
      name,
      count
    }));

    console.log('最终医院统计结果:', result);
    return result;
  }

  // 手动解析object字段（备用方法）
  manualParseObject = (objectString) => {
    try {
      // 尝试提取医院名称字段（优先section，然后是admHosName）
      const sectionMatch = objectString.match(/"section"\s*:\s*"([^"]+)"/);
      const admHosNameMatch = objectString.match(/"admHosName"\s*:\s*"([^"]+)"/);

      if (sectionMatch) {
        return {
          admHosName: sectionMatch[1] // 使用section作为医院名称
        };
      } else if (admHosNameMatch) {
        return {
          admHosName: admHosNameMatch[1]
        };
      }
      return null;
    } catch (error) {
      console.error('手动解析失败:', error);
      return null;
    }
  }


  // 获取医院颜色
  getHospitalColor = (hospitalName) => {
    const colors = ['#165DFF', '#36BFFA', '#0FC6C2', '#FF7D00', '#F53F3F', '#00B42A'];
    const index = hospitalName.length % colors.length;
    return colors[index];
  }

  // 发送授权请求
  submitAuthorizationRequest = async () => {
    const { account } = this.props;
    const { searchHashId, authorizationForm } = this.state;

    if (!searchHashId.trim()) {
      message.warning('请先搜索患者HashID');
      return;
    }

    if (authorizationForm.selectedHospitals.length === 0) {
      message.warning('请选择至少一家医院');
      return;
    }

    if (authorizationForm.validityPeriod <= 0) {
      message.warning('授权有效期必须大于0天');
      return;
    }

    this.setState({ isSubmittingRequest: true });

    try {
      const requestData = {
        doctorName: account?.displayName || account?.name || '未知医生',
        doctorId: account?.id || account?.name || '',
        doctorContact: account?.phone || account?.email || '',
        patientHashId: searchHashId,
        hospitals: JSON.stringify(authorizationForm.selectedHospitals),
        validityPeriod: authorizationForm.validityPeriod,
        dataTimeRangeStart: authorizationForm.dataTimeRange ? authorizationForm.dataTimeRange[0]?.format('YYYY-MM-DD HH:mm:ss') : null,
        dataTimeRangeEnd: authorizationForm.dataTimeRange ? authorizationForm.dataTimeRange[1]?.format('YYYY-MM-DD HH:mm:ss') : null,
        applicationNote: authorizationForm.applicationNote || ''
      };

      console.log('发送授权请求:', requestData);

      const response = await fetch(`${Setting.ServerUrl}/api/create-authorization-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      const res = await response.json();

      if (res.status === 'ok') {
        message.success('授权请求已发送成功！');
        // 重置表单
        this.setState({
          authorizationForm: {
            selectedHospitals: [],
            validityPeriod: 30,
            dataTimeRange: null,
            applicationNote: ''
          }
        });
        if (this.formRef.current) {
          this.formRef.current.resetFields();
        }
      } else {
        message.error(res.msg || '发送授权请求失败');
      }
    } catch (error) {
      console.error('发送授权请求时发生错误:', error);
      message.error('发送失败，请稍后重试');
    } finally {
      this.setState({ isSubmittingRequest: false });
    }
  }

  // 获取患者授权请求
  fetchPatientAuthorizationRequests = async () => {
    const { account } = this.props;
    if (!account?.idCard) {
      message.warning('无法获取患者身份信息');
      return;
    }

    this.setState({ isLoadingRequests: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-patient-authorization-requests?patientId=${encodeURIComponent(account.idCard)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const requests = res.data || [];
        this.setState({ patientAuthorizationRequests: requests });
        console.log('获取到授权请求:', requests);
      } else {
        message.error(res.msg || '获取授权请求失败');
        this.setState({ patientAuthorizationRequests: [] });
      }
    } catch (error) {
      console.error('获取授权请求时发生错误:', error);
      message.error('获取失败，请稍后重试');
      this.setState({ patientAuthorizationRequests: [] });
    } finally {
      this.setState({ isLoadingRequests: false });
    }
  }

  // 处理授权请求（同意或拒绝）
  processAuthorizationRequest = async (requestId, action, reason = '') => {
    try {
      const response = await fetch(`${Setting.ServerUrl}/api/process-authorization-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          action,
          reason
        })
      });

      const res = await response.json();

      if (res.status === 'ok') {
        message.success(action === 'approve' ? '已同意授权请求' : '已拒绝授权请求');
        // 重新获取请求列表
        this.fetchPatientAuthorizationRequests();
        // 关闭模态框
        this.setState({ showRequestModal: false, selectedRequest: null });
      } else {
        message.error(res.msg || '处理失败');
      }
    } catch (error) {
      console.error('处理授权请求时发生错误:', error);
      message.error('处理失败，请稍后重试');
    }
  }

  // 显示请求详情
  showRequestDetails = (request) => {
    this.setState({
      selectedRequest: request,
      showRequestModal: true,
      rejectReason: ''
    });
  }

  // 同意请求
  approveRequest = () => {
    const { selectedRequest } = this.state;
    if (selectedRequest) {
      this.processAuthorizationRequest(selectedRequest.requestId, 'approve');
    }
  }

  // 获取进度百分比
  getProgressPercent = (status) => {
    switch (status) {
      case 'pending':
        return 33; // 已发起
      case 'approved':
        return 100; // 已完成
      case 'rejected':
        return 66; // 患者确认但被拒绝
      default:
        return 0;
    }
  }

  // 获取进度条颜色
  getProgressColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff7d00'; // 橙色
      case 'approved':
        return '#00B42A'; // 绿色
      case 'rejected':
        return '#ff4d4f'; // 红色
      default:
        return '#86909C'; // 灰色
    }
  }

  // 获取已授权患者的就诊记录
  fetchAuthorizedPatientRecords = async () => {
    const { account } = this.props;
    if (!account?.id) {
      message.warning('无法获取医生身份信息');
      return;
    }

    this.setState({ isLoadingAuthorizedRecords: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-authorized-patient-records?doctorId=${encodeURIComponent(account.id)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const records = res.data || [];
        this.setState({ authorizedPatientRecords: records });
        console.log('获取到已授权患者的就诊记录:', records);
      } else {
        message.error(res.msg || '获取已授权患者记录失败');
        this.setState({ authorizedPatientRecords: [] });
      }
    } catch (error) {
      console.error('获取已授权患者记录时发生错误:', error);
      message.error('获取失败，请稍后重试');
      this.setState({ authorizedPatientRecords: [] });
    } finally {
      this.setState({ isLoadingAuthorizedRecords: false });
    }
  }

  // 获取医生历史申请记录（基于搜索的患者HashID）
  fetchDoctorHistoryRequests = async (patientHashId = null) => {
    const { account } = this.props;
    if (!account?.id) {
      message.warning('无法获取医生身份信息');
      return;
    }

    this.setState({ isLoadingDoctorHistory: true });

    try {
      let url = `${Setting.ServerUrl}/api/get-doctor-authorization-requests?doctorId=${encodeURIComponent(account.id)}`;
      if (patientHashId) {
        url += `&patientHashId=${encodeURIComponent(patientHashId)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const requests = res.data || [];
        this.setState({ doctorHistoryRequests: requests });
        console.log('获取到医生历史申请记录:', requests);
      } else {
        message.error(res.msg || '获取历史申请记录失败');
        this.setState({ doctorHistoryRequests: [] });
      }
    } catch (error) {
      console.error('获取医生历史申请记录时发生错误:', error);
      message.error('获取失败，请稍后重试');
      this.setState({ doctorHistoryRequests: [] });
    } finally {
      this.setState({ isLoadingDoctorHistory: false });
    }
  }

  // 获取患者历史授权记录
  fetchPatientHistoryRequests = async () => {
    const { account } = this.props;
    console.log('获取患者历史授权记录，account:', account);

    if (!account?.idCard) {
      message.warning('无法获取患者身份信息');
      return;
    }

    console.log('使用患者IDCard作为patientId:', account.idCard);
    this.setState({ isLoadingPatientHistory: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-patient-authorization-history?patientId=${encodeURIComponent(account.idCard)}`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('API响应状态:', response.status, response.statusText);
      const res = await response.json();
      console.log('API响应数据:', res);

      if (res.status === 'ok') {
        const requests = res.data || [];
        console.log('获取到患者历史授权记录:', requests);
        this.setState({ patientHistoryRequests: requests });
      } else {
        message.error(res.msg || '获取历史授权记录失败');
        this.setState({ patientHistoryRequests: [] });
      }
    } catch (error) {
      console.error('获取患者历史授权记录时发生错误:', error);
      message.error('获取失败，请稍后重试');
      this.setState({ patientHistoryRequests: [] });
    } finally {
      this.setState({ isLoadingPatientHistory: false });
    }
  }

  // 组件挂载时获取数据
  componentDidMount() {
    const { account } = this.props;
    const userTag = account?.tag || '';
    if (userTag === 'user') {
      this.fetchPatientAuthorizationRequests();
      this.fetchPatientOwnRecords();
      this.fetchPatientHistoryRequests();
    } else if (userTag === 'doctor') {
      this.fetchDoctorHistoryRequests();
      this.fetchAuthorizedPatientRecords();
    }
  }

  // 获取患者自己的就诊记录
  fetchPatientOwnRecords = async () => {
    const { account } = this.props;
    if (!account?.idCard) {
      return;
    }

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-patient-by-hash-id?hashId=${encodeURIComponent(account.idCard)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const records = res.data || [];
        console.log('获取到患者自己的就诊记录:', records);

        // 解析记录中的医院信息
        const hospitals = this.extractHospitalsFromRecords(records);

        this.setState({
          patientRecords: records,
          hospitalOptions: hospitals
        });
      } else {
        console.log('获取患者就诊记录失败:', res.msg);
      }
    } catch (error) {
      console.error('获取患者就诊记录时发生错误:', error);
    }
  }

  render() {
    const { account } = this.props;
    const userTag = account?.tag || '';
    const isDoctor = userTag === 'doctor';
    const isPatient = userTag === 'user';

    return (
      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'bold', margin: 0 }}>协同诊疗</h2>
          <p style={{ color: '#86909C', margin: '4px 0 0 0' }}>跨院就诊记录授权与查看平台</p>
        </div>

        <Row gutter={24}>
          {/* 左侧：用户信息和就诊历史统计 */}
          <Col xs={24} lg={8}>
            {this.renderUserInfoCard()}

            {/* 就诊历史统计 */}
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color: '#165DFF' }} />
                  我的就诊历史统计
                </Space>
              }
            >
              {isPatient ? (
                this.state.hospitalOptions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#86909C' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>暂无就诊记录</div>
                    <div style={{ fontSize: '12px' }}>您的就诊记录将在这里显示</div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <ReactECharts
                        ref={this.chartRef}
                        option={this.getChartOption()}
                        style={{ height: '200px' }}
                        notMerge={true}
                      />
                    </div>

                    <Row gutter={12}>
                      <Col span={12}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f2f3f5' }}>
                          <Statistic
                            title="就诊医院"
                            value={this.state.hospitalOptions.length}
                            suffix="家"
                            valueStyle={{ fontSize: '20px', fontWeight: 600 }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f2f3f5' }}>
                          <Statistic
                            title="就诊次数"
                            value={this.state.hospitalOptions.reduce((sum, hospital) => sum + hospital.count, 0)}
                            suffix="次"
                            valueStyle={{ fontSize: '20px', fontWeight: 600 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </>
                )
              ) : isDoctor && this.state.hospitalOptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#86909C' }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>暂无就诊记录</div>
                  <div style={{ fontSize: '12px' }}>请先搜索患者HashID获取就诊记录</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <ReactECharts
                      ref={this.chartRef}
                      option={this.getChartOption()}
                      style={{ height: '200px' }}
                      notMerge={true}
                    />
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f2f3f5' }}>
                        <Statistic
                          title="就诊医院"
                          value={this.state.hospitalOptions.length > 0 ? this.state.hospitalOptions.length : (isDoctor ? 0 : 3)}
                          suffix="家"
                          valueStyle={{ fontSize: '20px', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f2f3f5' }}>
                        <Statistic
                          title="就诊次数"
                          value={this.state.hospitalOptions.length > 0 ? this.state.hospitalOptions.reduce((sum, hospital) => sum + hospital.count, 0) : (isDoctor ? 0 : 8)}
                          suffix="次"
                          valueStyle={{ fontSize: '20px', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </Card>
          </Col>

          {/* 右侧：功能区 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 患者界面：授权请求审批 */}
              {isPatient ? (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 待审批授权请求 */}
                  <Card
                    title={
                      <Space>
                        <KeyOutlined style={{ color: '#165DFF' }} />
                        待审批授权请求
                      </Space>
                    }
                    extra={
                      <Button
                        onClick={this.fetchPatientAuthorizationRequests}
                        loading={this.state.isLoadingRequests}
                      >
                        刷新
                      </Button>
                    }
                  >
                    {this.state.isLoadingRequests ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Progress type="circle" />
                      </div>
                    ) : this.state.patientAuthorizationRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: '#86909C' }}>
                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无待审批的授权请求</div>
                        <div style={{ fontSize: '14px' }}>当有医生申请查看您的就诊记录时，请求将显示在这里</div>
                      </div>
                    ) : (
                      <Row gutter={[16, 16]}>
                        {this.state.patientAuthorizationRequests.map((request, index) => (
                          <Col xs={24} md={12} key={request.requestId}>
                            <Card
                              hoverable
                              style={{ height: '100%' }}
                              actions={[
                                <Button
                                  type="link"
                                  icon={<EyeOutlined />}
                                  onClick={() => this.showRequestDetails(request)}
                                >
                                  查看详情
                                </Button>
                              ]}
                            >
                              <div style={{ marginBottom: '12px' }}>
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                  {request.doctorName}
                                </Tag>
                                <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                  {request.status === 'pending' ? '待审批' : request.status}
                                </Tag>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请时间</div>
                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>授权有效期</div>
                                <div style={{ fontSize: '14px' }}>{request.validityPeriod}天</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请医院</div>
                                <div style={{ fontSize: '12px' }}>
                                  {JSON.parse(request.hospitals || '[]').slice(0, 2).map((hospital, idx) => (
                                    <Tag key={idx} size="small" color="green" style={{ marginBottom: '2px' }}>
                                      {hospital}
                                    </Tag>
                                  ))}
                                  {JSON.parse(request.hospitals || '[]').length > 2 && (
                                    <Tag size="small" color="default">
                                      +{JSON.parse(request.hospitals || '[]').length - 2}家
                                    </Tag>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>

                  {/* 患者历史授权记录 */}
                  <Card
                    title={
                      <Space>
                        <HistoryOutlined style={{ color: '#165DFF' }} />
                        历史授权记录
                      </Space>
                    }
                    extra={
                      <Button
                        onClick={this.fetchPatientHistoryRequests}
                        loading={this.state.isLoadingPatientHistory}
                      >
                        刷新
                      </Button>
                    }
                  >
                    {this.state.isLoadingPatientHistory ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Progress type="circle" />
                      </div>
                    ) : this.state.patientHistoryRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                        <div style={{ fontSize: '14px' }}>暂无历史授权记录</div>
                      </div>
                    ) : (
                      <Row gutter={[16, 16]}>
                        {this.state.patientHistoryRequests.map((request, index) => (
                          <Col xs={24} md={12} key={request.requestId}>
                            <Card
                              hoverable
                              style={{ height: '100%' }}
                              actions={[
                                <Button
                                  type="link"
                                  icon={<EyeOutlined />}
                                  onClick={() => this.showRequestDetails(request)}
                                >
                                  查看详情
                                </Button>
                              ]}
                            >
                              <div style={{ marginBottom: '12px' }}>
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                  {request.doctorName}
                                </Tag>
                                <Tag
                                  color={request.status === 'approved' ? 'green' : 'red'}
                                  style={{ fontSize: '14px', padding: '4px 8px' }}
                                >
                                  {request.status === 'approved' ? '已授权' : '已拒绝'}
                                </Tag>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请时间</div>
                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>处理时间</div>
                                <div style={{ fontSize: '14px' }}>
                                  {request.processedTime ? moment(request.processedTime).format('YYYY-MM-DD HH:mm') : '未处理'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请医院</div>
                                <div style={{ fontSize: '12px' }}>
                                  {JSON.parse(request.hospitals || '[]').slice(0, 2).map((hospital, idx) => (
                                    <Tag key={idx} size="small" color="green" style={{ marginBottom: '2px' }}>
                                      {hospital}
                                    </Tag>
                                  ))}
                                  {JSON.parse(request.hospitals || '[]').length > 2 && (
                                    <Tag size="small" color="default">
                                      +{JSON.parse(request.hospitals || '[]').length - 2}家
                                    </Tag>
                                  )}
                                </div>
                              </div>
                              {request.status === 'rejected' && request.rejectReason && (
                                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                                  <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: '4px' }}>拒绝原因</div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>{request.rejectReason}</div>
                                </div>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>
                </Space>
              ) : (
                // 医生界面：发起授权请求
                <Card
                  title={
                    <Space>
                      <KeyOutlined style={{ color: '#165DFF' }} />
                      发起授权请求
                    </Space>
                  }
                >
                  {/* 医生界面添加搜索栏 */}
                  {isDoctor && (
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                        根据患者HashID查询就诊记录
                      </label>
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="请输入患者HashID"
                          value={this.state.searchHashId}
                          onChange={(e) => this.setState({ searchHashId: e.target.value })}
                          onPressEnter={this.searchPatientRecords}
                        />
                        <Button
                          type="primary"
                          icon={<SearchOutlined />}
                          loading={this.state.isLoading}
                          onClick={this.searchPatientRecords}
                        >
                          查询
                        </Button>
                      </Space.Compact>
                    </div>
                  )}

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>选择既往就诊医院</label>
                        <Space direction="vertical">
                          {this.state.hospitalOptions.length > 0 ? (
                            this.state.hospitalOptions.map((hospital, index) => (
                              <Checkbox
                                key={index}
                                checked={this.state.authorizationForm.selectedHospitals.includes(hospital.name)}
                                onChange={(e) => {
                                  const selectedHospitals = [...this.state.authorizationForm.selectedHospitals];
                                  if (e.target.checked) {
                                    selectedHospitals.push(hospital.name);
                                  } else {
                                    const index = selectedHospitals.indexOf(hospital.name);
                                    if (index > -1) {
                                      selectedHospitals.splice(index, 1);
                                    }
                                  }
                                  this.setState({
                                    authorizationForm: {
                                      ...this.state.authorizationForm,
                                      selectedHospitals
                                    }
                                  });
                                }}
                              >
                                {hospital.name} ({hospital.count}次)
                              </Checkbox>
                            ))
                          ) : (
                            isDoctor ? (
                              <div style={{ color: '#86909C', fontSize: '12px', padding: '8px 0' }}>
                                请先搜索患者HashID获取就诊记录
                              </div>
                            ) : (
                              <>
                                <Checkbox defaultChecked>广东省人民医院</Checkbox>
                                <Checkbox defaultChecked>江苏省人民医院</Checkbox>
                                <Checkbox>医大一院</Checkbox>
                              </>
                            )
                          )}
                        </Space>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>可查看的数据范围</label>
                        <Space direction="vertical">
                          <Checkbox defaultChecked>门诊病历</Checkbox>
                          <Checkbox defaultChecked>检查报告</Checkbox>
                          <Checkbox defaultChecked>用药记录</Checkbox>
                          <Checkbox>住院记录</Checkbox>
                        </Space>
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>授权有效期</label>
                        <InputNumber
                          min={1}
                          max={365}
                          value={this.state.authorizationForm.validityPeriod}
                          onChange={(value) => {
                            this.setState({
                              authorizationForm: {
                                ...this.state.authorizationForm,
                                validityPeriod: value || 30
                              }
                            });
                          }}
                          addonAfter="天"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>数据时间范围</label>
                        <DatePicker.RangePicker
                          value={this.state.authorizationForm.dataTimeRange}
                          onChange={(dates) => {
                            this.setState({
                              authorizationForm: {
                                ...this.state.authorizationForm,
                                dataTimeRange: dates
                              }
                            });
                          }}
                          style={{ width: '100%' }}
                          placeholder={['开始时间', '结束时间']}
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                        />
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>申请说明（可选）</label>
                    <TextArea
                      rows={3}
                      placeholder="请说明申请授权的目的和用途..."
                      value={this.state.authorizationForm.applicationNote}
                      onChange={(e) => {
                        this.setState({
                          authorizationForm: {
                            ...this.state.authorizationForm,
                            applicationNote: e.target.value
                          }
                        });
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      loading={this.state.isSubmittingRequest}
                      onClick={this.submitAuthorizationRequest}
                      disabled={this.state.hospitalOptions.length === 0}
                    >
                      发送授权请求
                    </Button>
                  </div>
                </Card>
              )}

              {/* 医生历史申请记录 */}
              {isDoctor && (
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#165DFF' }} />
                      历史申请记录
                    </Space>
                  }
                  extra={
                    <Button
                      onClick={this.fetchDoctorHistoryRequests}
                      loading={this.state.isLoadingDoctorHistory}
                    >
                      刷新
                    </Button>
                  }
                >
                  {this.state.isLoadingDoctorHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Progress type="circle" />
                    </div>
                  ) : this.state.doctorHistoryRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                      <div style={{ fontSize: '14px' }}>暂无历史申请记录</div>
                    </div>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {this.state.doctorHistoryRequests.map((request, index) => (
                        <Col xs={24} md={12} key={request.requestId}>
                          <Card
                            hoverable
                            style={{ height: '100%' }}
                            actions={[
                              <Button
                                type="link"
                                icon={<EyeOutlined />}
                                onClick={() => this.showRequestDetails(request)}
                              >
                                查看详情
                              </Button>
                            ]}
                          >
                            <div style={{ marginBottom: '12px' }}>
                              <Tag
                                color={
                                  request.status === 'approved' ? 'green' :
                                    request.status === 'rejected' ? 'red' :
                                      'orange'
                                }
                                style={{ fontSize: '14px', padding: '4px 8px' }}
                              >
                                {request.status === 'approved' ? '已同意' :
                                  request.status === 'rejected' ? '已拒绝' :
                                    '待审批'}
                              </Tag>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请时间</div>
                              <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者HashID</div>
                              <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                {request.patientHashId.substring(0, 16)}...
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>申请医院</div>
                              <div style={{ fontSize: '12px' }}>
                                {JSON.parse(request.hospitals || '[]').slice(0, 2).map((hospital, idx) => (
                                  <Tag key={idx} size="small" color="blue" style={{ marginBottom: '2px' }}>
                                    {hospital}
                                  </Tag>
                                ))}
                                {JSON.parse(request.hospitals || '[]').length > 2 && (
                                  <Tag size="small" color="default">
                                    +{JSON.parse(request.hospitals || '[]').length - 2}家
                                  </Tag>
                                )}
                              </div>
                            </div>
                            {request.status === 'rejected' && request.rejectReason && (
                              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                                <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: '4px' }}>拒绝原因</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{request.rejectReason}</div>
                              </div>
                            )}
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              )}

              {/* 授权进度跟踪 */}
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#165DFF' }} />
                    授权进度跟踪
                  </Space>
                }
              >
                {this.state.doctorHistoryRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                    <div style={{ fontSize: '14px' }}>暂无授权请求</div>
                    <div style={{ fontSize: '12px' }}>发送授权请求后，进度将在这里显示</div>
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {this.state.doctorHistoryRequests.slice(0, 3).map((request, index) => (
                      <div key={request.requestId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <Space>
                            <span style={{ fontWeight: 500 }}>
                              {JSON.parse(request.hospitals || '[]').slice(0, 2).join('、')}
                              {JSON.parse(request.hospitals || '[]').length > 2 && `等${JSON.parse(request.hospitals || '[]').length}家医院`}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: request.status === 'approved' ? '#f6ffed' : request.status === 'rejected' ? '#fff2f0' : '#fff7e6',
                              color: request.status === 'approved' ? '#52c41a' : request.status === 'rejected' ? '#ff4d4f' : '#ff7d00',
                              fontSize: '12px',
                              borderRadius: '12px'
                            }}>
                              {request.status === 'approved' ? '已授权' : request.status === 'rejected' ? '已拒绝' : '待审批'}
                            </span>
                          </Space>
                          <span style={{ fontSize: '12px', color: '#86909C' }}>
                            发起于 {moment(request.createdTime).format('MM-DD HH:mm')}
                          </span>
                        </div>

                        <Progress
                          percent={this.getProgressPercent(request.status)}
                          strokeColor={this.getProgressColor(request.status)}
                          showInfo={false}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                          <Space direction="vertical" align="center" size="small">
                            <CheckCircleOutlined style={{ color: '#00B42A' }} />
                            <span style={{ fontSize: '12px' }}>已发起</span>
                          </Space>
                          <Space direction="vertical" align="center" size="small">
                            {request.status === 'pending' ? (
                              <ClockCircleOutlined style={{ color: '#ff7d00' }} />
                            ) : (
                              <CheckCircleOutlined style={{ color: '#00B42A' }} />
                            )}
                            <span style={{ fontSize: '12px' }}>患者确认</span>
                          </Space>
                          <Space direction="vertical" align="center" size="small">
                            {request.status === 'approved' ? (
                              <CheckCircleOutlined style={{ color: '#00B42A' }} />
                            ) : request.status === 'rejected' ? (
                              <CloseOutlined style={{ color: '#ff4d4f' }} />
                            ) : (
                              <LockOutlined style={{ color: '#86909C' }} />
                            )}
                            <span style={{ fontSize: '12px' }}>可查看</span>
                          </Space>
                        </div>
                        {request.status === 'rejected' && request.rejectReason && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                            <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: '4px' }}>拒绝原因</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{request.rejectReason}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Space>
                )}
              </Card>

              {/* 授权后记录查看 */}
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#165DFF' }} />
                    授权通过的历史记录
                  </Space>
                }
                extra={
                  <Button
                    onClick={this.fetchAuthorizedPatientRecords}
                    loading={this.state.isLoadingAuthorizedRecords}
                  >
                    刷新
                  </Button>
                }
              >
                {this.state.isLoadingAuthorizedRecords ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Progress type="circle" />
                  </div>
                ) : this.state.authorizedPatientRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                    <div style={{ fontSize: '14px' }}>暂无已授权的患者记录</div>
                    <div style={{ fontSize: '12px' }}>当患者同意您的授权请求后，记录将在这里显示</div>
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {this.state.authorizedPatientRecords.map((record, index) => {
                      try {
                        const recordData = JSON.parse(record.object || '{}');
                        return (
                          <Card key={record.id} size="small" hoverable>
                            <div style={{ backgroundColor: '#f2f3f5', padding: '12px 16px', margin: '-12px -16px 12px -16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space>
                                <MedicineBoxOutlined style={{ color: '#165DFF' }} />
                                <span style={{ fontWeight: 500 }}>
                                  {recordData.consultationTime ? moment(recordData.consultationTime).format('YYYY年MM月DD日') : '未知时间'} - {recordData.unit || '未知科室'}
                                </span>
                              </Space>
                              <Button type="text" icon={<DownloadOutlined />} />
                            </div>
                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>患者姓名</p>
                                  <p style={{ margin: 0 }}>{recordData.patientName || recordData.name || '未知'}</p>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>身份证号</p>
                                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '11px' }}>
                                    {recordData.idCardNo ? recordData.idCardNo.substring(0, 16) + '...' : '未知'}
                                  </p>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>就诊类型</p>
                                  <p style={{ margin: 0 }}>{recordData.admType || '门诊'}</p>
                                </div>
                              </Col>
                              <Col xs={24} md={12}>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>医院名称</p>
                                  <p style={{ margin: 0 }}>{recordData.section || recordData.admHosName || '未知医院'}</p>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>就诊科室</p>
                                  <p style={{ margin: 0 }}>{recordData.unit || recordData.admDepartment || '未知科室'}</p>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>就诊ID</p>
                                  <p style={{ margin: 0, fontFamily: 'monospace' }}>{recordData.localDBIndex || recordData.admId || '未知'}</p>
                                </div>
                              </Col>
                            </Row>
                            <div style={{ marginTop: '12px' }}>
                              <p style={{ fontSize: '12px', color: '#86909C', margin: '0 0 4px 0' }}>就诊时间</p>
                              <p style={{ fontSize: '12px', margin: 0 }}>
                                {recordData.consultationTime ? moment(recordData.consultationTime).format('YYYY-MM-DD HH:mm:ss') : '未知时间'}
                              </p>
                            </div>
                            <Button type="link" style={{ padding: 0, marginTop: '12px' }}>
                              查看完整记录 →
                            </Button>
                          </Card>
                        );
                      } catch (error) {
                        console.error('解析记录数据失败:', error, record);
                        return (
                          <Card key={record.id} size="small" hoverable>
                            <div style={{ padding: '20px', textAlign: 'center', color: '#86909C' }}>
                              <div style={{ fontSize: '14px' }}>记录数据解析失败</div>
                              <div style={{ fontSize: '12px' }}>记录ID: {record.id}</div>
                            </div>
                          </Card>
                        );
                      }
                    })}
                  </Space>
                )}
              </Card>
            </Space>
          </Col>
        </Row>

        {/* 授权请求详情模态框 */}
        <Modal
          title="授权请求详情"
          open={this.state.showRequestModal}
          onCancel={() => this.setState({ showRequestModal: false, selectedRequest: null })}
          footer={null}
          width={600}
        >
          {this.state.selectedRequest && (
            <div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="医生姓名">{this.state.selectedRequest.doctorName}</Descriptions.Item>
                <Descriptions.Item label="医生ID">{this.state.selectedRequest.doctorId}</Descriptions.Item>
                <Descriptions.Item label="联系方式">{this.state.selectedRequest.doctorContact || '未提供'}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{moment(this.state.selectedRequest.createdTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                <Descriptions.Item label="授权有效期">{this.state.selectedRequest.validityPeriod}天</Descriptions.Item>
                <Descriptions.Item label="数据时间范围">
                  {this.state.selectedRequest.dataTimeRangeStart && this.state.selectedRequest.dataTimeRangeEnd
                    ? `${moment(this.state.selectedRequest.dataTimeRangeStart).format('YYYY-MM-DD')} 至 ${moment(this.state.selectedRequest.dataTimeRangeEnd).format('YYYY-MM-DD')}`
                    : '全部时间'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="申请医院">
                  {JSON.parse(this.state.selectedRequest.hospitals || '[]').map((hospital, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>{hospital}</Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="申请说明">
                  {this.state.selectedRequest.applicationNote || '无'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                  拒绝原因（如拒绝请填写）
                </label>
                <TextArea
                  rows={3}
                  placeholder="请说明拒绝的原因..."
                  value={this.state.rejectReason}
                  onChange={(e) => this.setState({ rejectReason: e.target.value })}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => this.setState({ showRequestModal: false, selectedRequest: null })}>
                    取消
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={this.rejectRequest}
                  >
                    拒绝
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={this.approveRequest}
                  >
                    同意
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default PythonSrPage;

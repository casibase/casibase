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
import { Card, Button, Checkbox, Select, Input, Progress, Tabs, Avatar, Space, Row, Col, Statistic, message, Form, DatePicker, InputNumber, Modal, Tag, Descriptions, Divider, Table, Collapse, Upload } from "antd";
import { UserOutlined, HistoryOutlined, FileTextOutlined, MedicineBoxOutlined, SearchOutlined, SendOutlined, CheckOutlined, CloseOutlined, EyeOutlined, EditOutlined, UploadOutlined, FilePdfOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactECharts from 'echarts-for-react';
import * as Setting from "../Setting";
import moment from 'moment';
import sm3 from 'sm-crypto/src/sm3';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

class PythonSrPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      searchIdentityNumber: '',
      patientRecords: [],
      hospitalOptions: [],
      isLoading: false,

      // 协同诊疗相关状态
      collaborationForm: {
        selectedHospitals: [],
        selectedDoctors: [], // [{hospitalName: 'xxx', doctorId: 'owner/name', doctorName: 'xxx'}, ...]
        description: '',
        pdfFile: null, // 上传的PDF文件
        pdfFileUrl: null // PDF文件的URL（上传后返回）
      },
      isSubmittingCollaboration: false,
      isUploadingPdf: false,
      // 医院医生映射：{hospitalName: [doctors]}
      hospitalDoctorsMap: {},
      isLoadingDoctors: false,

      // 医生发起的协同诊疗请求
      myCollaborationRequests: [],
      isLoadingMyRequests: false,

      // 针对本医院的协同诊疗请求
      hospitalCollaborationRequests: [],
      isLoadingHospitalRequests: false,
      // 针对当前医生的协同诊疗请求
      doctorCollaborationRequests: [],
      isLoadingDoctorRequests: false,

      // 当前查询患者的基本信息
      currentPatientInfo: null,

      // 诊疗意见相关
      selectedRequest: null,
      showRequestModal: false,
      showOpinionModal: false,
      diagnosisOpinion: {
        opinion: '',
        diagnosis: '',
        treatmentSuggestion: ''
      },
      isSubmittingOpinion: false,

      // 查看诊疗意见
      selectedRequestForOpinions: null,
      showOpinionsModal: false,
      diagnosisOpinions: [],
      isLoadingOpinions: false,

      // 关闭请求相关
      showCloseModal: false,
      isClosingRequest: false,
      requestToClose: null,
      closeOpinion: {
        opinion: '',
        diagnosis: '',
        treatmentSuggestion: ''
      },

      // 当前请求对应的就诊记录详情
      selectedRequestRecords: [],
      isLoadingRequestRecords: false,
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
        { value: 6, name: '广东省人民医院', itemStyle: { color: '#165DFF' } },
        { value: 4, name: '中国医科大学附属第一医院', itemStyle: { color: '#36BFFA' } },
        { value: 5, name: '中国医科大学附属第一医院互联网医院', itemStyle: { color: '#47D782' } },
        { value: 2, name: '中国医科大学附属第一医院浑南院区', itemStyle: { color: '#F6BD16' } },
        { value: 3, name: '江苏省人民医院', itemStyle: { color: '#FF6F61' } },
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
    const originalUserTag = account?.tag || "";
    const normalizedUserTag = originalUserTag.toLowerCase();

    // 根据tag确定卡片标题
    let cardTitle = "医生信息";
    let buttonText = "编辑医生信息";

    if (normalizedUserTag === "admin") {
      cardTitle = "管理员信息";
      buttonText = "编辑管理员信息";
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
          {normalizedUserTag !== "admin" && (
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
          {normalizedUserTag === "admin" ? (
            null
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909C' }}>性别</span>
                <span>{account?.gender || '未设置'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909C' }}>工作单位</span>
                <span>{account?.affiliation || '未设置'}</span>
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
        {["doctor", "admin"].includes(normalizedUserTag) && (
          <Button
            style={{ width: "100%", marginTop: "12px" }}
            onClick={() => this.props.history.push("/med-records")}
          >
            病例数据录入
          </Button>
        )}
      </Card>
    );
  }

  // 获取PDF下载链接
  getPdfDownloadUrl = (url) => {
    if (!url) return '';
    // 如果是旧的静态链接，转换为API下载链接
    if (url.includes('/files/collaboration_pdf/')) {
      const fileName = url.split('/files/collaboration_pdf/').pop();
      return `${Setting.ServerUrl}/api/get-collaboration-pdf?name=${fileName}`;
    }
    return url;
  }

  // 进行s3哈希处理（sm3）
  s3HashCorrelationId = (correlationId) => {
    if (!correlationId) {
      return '';
    }
    try {
      return sm3(correlationId);
    } catch (error) {
      console.error('哈希身份证号码时发生错误:', error);
      return '';
    }
  };

  // 搜索患者记录
  searchPatientRecords = async () => {
    const { searchIdentityNumber } = this.state;
    const trimmedIdentityNumber = (searchIdentityNumber || '').trim();

    if (!trimmedIdentityNumber) {
      message.warning('请输入患者身份证号');
      return;
    }

    const hashedIdentity = this.s3HashCorrelationId(trimmedIdentityNumber);
    if (!hashedIdentity) {
      message.error('身份证号哈希失败，请检查后重试');
      return;
    }

    this.setState({
      isLoading: true,
      patientRecords: [],
      hospitalOptions: [],
      currentPatientInfo: null
    });

    try {
      console.log('开始搜索患者就诊记录，身份证号:', trimmedIdentityNumber);
      console.log('对应的HashID:', hashedIdentity);

      const response = await fetch(`${Setting.ServerUrl}/api/get-patient-by-hash-id?hashId=${encodeURIComponent(hashedIdentity)}`, {
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

        const hospitals = this.extractHospitalsFromRecords(records);
        console.log('解析出的医院信息:', hospitals);

        if (hospitals.length === 0) {
          message.warning('找到记录但无法解析医院信息，请检查数据格式');
          this.setState({ patientRecords: records, hospitalOptions: [] });
          return;
        }

        const patientInfo = this.derivePatientInfoFromRecords(records);

        this.setState({
          patientRecords: records,
          hospitalOptions: hospitals,
          currentPatientInfo: {
            identityNumber: trimmedIdentityNumber,
            name: patientInfo?.patientName || ''
          }
        });

        message.success(`找到 ${records.length} 条就诊记录，涉及 ${hospitals.length} 家医院`);
      } else {
        console.error('API返回错误:', res);
        const errorMsg = res.msg || '查询失败';
        message.error(`查询失败: ${errorMsg}`);
        this.setState({ patientRecords: [], hospitalOptions: [], currentPatientInfo: null });
      }
    } catch (error) {
      console.error('搜索患者记录时发生错误:', error);
      message.error('查询失败，请稍后重试');
      this.setState({ patientRecords: [], hospitalOptions: [], currentPatientInfo: null });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // 从记录中提取患者基本信息
  derivePatientInfoFromRecords = (records = []) => {
    for (const record of records) {
      const objectData = this.safeParseRecordObject(record?.object);
      if (!objectData) {
        continue;
      }

      const patientName = objectData.patientName || objectData.name || objectData.fullName || '';
      if (patientName) {
        return {
          patientName
        };
      }
    }
    return {
      patientName: ''
    };
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

        const objectData = this.safeParseRecordObject(record.object);
        if (!objectData) {
          return;
        }
        validRecordCount++;

        const hospitalName = objectData.admHosName || objectData.section || objectData.hospitalName || objectData.hosName || objectData.admHos;

        if (hospitalName) {
          if (hospitalMap.has(hospitalName)) {
            hospitalMap.set(hospitalName, hospitalMap.get(hospitalName) + 1);
          } else {
            hospitalMap.set(hospitalName, 1);
          }
        }
      } catch (error) {
        parseErrorCount++;
        console.error(`解析记录 ${index} 时发生错误:`, error);
      }
    });

    console.log(`解析完成 - 有效记录: ${validRecordCount}, 解析错误: ${parseErrorCount}, 找到医院: ${hospitalMap.size}家`);

    const result = Array.from(hospitalMap.entries()).map(([name, count]) => ({
      name,
      count
    }));

    return result;
  }

  // 安全解析就诊记录的object字段
  safeParseRecordObject = (objectStr) => {
    if (!objectStr || typeof objectStr !== 'string') {
      return null;
    }

    try {
      const normalized = objectStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      return JSON.parse(normalized);
    } catch (error) {
      console.error('解析就诊记录object字段失败:', error);
      return null;
    }
  }

  getDisplayPatientName = (request) => {
    if (!request) {
      return '未知患者';
    }
    const name = (request.patientName || '').trim();
    return name || '未知患者';
  }

  getDisplayPatientIdentity = (request) => {
    if (!request) {
      return '未知';
    }

    const identity = (request.patientIdentityNumber || '').trim();
    if (identity) {
      return identity;
    }

    const hash = request.patientHashId || '';
    if (!hash) {
      return '未知';
    }

    if (hash.length <= 16) {
      return hash;
    }

    return `${hash.substring(0, 16)}...`;
  }

  // 获取医院颜色
  getHospitalColor = (hospitalName) => {
    const colors = ['#165DFF', '#36BFFA', '#0FC6C2', '#FF7D00', '#F53F3F', '#00B42A'];
    const index = hospitalName.length % colors.length;
    return colors[index];
  }

  // 获取医院的医生列表
  fetchDoctorsByHospital = async (hospitalName) => {
    if (!hospitalName) {
      return [];
    }

    // 如果已经加载过，直接返回
    if (this.state.hospitalDoctorsMap[hospitalName]) {
      return this.state.hospitalDoctorsMap[hospitalName];
    }

    this.setState({ isLoadingDoctors: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-doctors-by-hospital?hospitalName=${encodeURIComponent(hospitalName)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器返回的不是JSON:', text.substring(0, 200));
        throw new Error('服务器返回格式错误，请检查API路由是否正确配置');
      }

      const res = await response.json();

      if (res.status === 'ok') {
        const doctors = res.data || [];
        console.log(`获取到 ${hospitalName} 的医生列表:`, doctors);
        this.setState(prevState => ({
          hospitalDoctorsMap: {
            ...prevState.hospitalDoctorsMap,
            [hospitalName]: doctors
          }
        }));
        return doctors;
      } else {
        message.error(res.msg || '获取医生列表失败');
        return [];
      }
    } catch (error) {
      console.error('获取医生列表时发生错误:', error);
      message.error('获取医生列表失败，请稍后重试');
      return [];
    } finally {
      this.setState({ isLoadingDoctors: false });
    }
  }

  // 上传PDF文件
  uploadPdfFile = async (file) => {
    this.setState({ isUploadingPdf: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${Setting.ServerUrl}/api/upload-collaboration-pdf`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const pdfUrl = res.data?.url || res.data?.fileUrl || '';
        this.setState({
          collaborationForm: {
            ...this.state.collaborationForm,
            pdfFile: file,
            pdfFileUrl: pdfUrl
          }
        });
        message.success('PDF文件上传成功');
        return pdfUrl;
      } else {
        message.error(res.msg || 'PDF文件上传失败');
        return null;
      }
    } catch (error) {
      console.error('上传PDF文件时发生错误:', error);
      message.error('上传失败，请稍后重试');
      return null;
    } finally {
      this.setState({ isUploadingPdf: false });
    }
  }

  // 删除PDF文件
  removePdfFile = () => {
    this.setState({
      collaborationForm: {
        ...this.state.collaborationForm,
        pdfFile: null,
        pdfFileUrl: null
      }
    });
  }

  // 发起协同诊疗请求
  submitCollaborationRequest = async () => {
    const { account } = this.props;
    const { searchIdentityNumber, collaborationForm, currentPatientInfo, patientRecords } = this.state;
    const trimmedIdentityNumber = (searchIdentityNumber || '').trim();
    const patientHashId = this.s3HashCorrelationId(trimmedIdentityNumber);

    if (!trimmedIdentityNumber) {
      message.warning('请先输入患者身份证号');
      return;
    }

    if (!patientHashId) {
      message.error('身份证号哈希失败，请稍后重试');
      return;
    }

    if (collaborationForm.selectedDoctors.length === 0) {
      message.warning('请至少选择一位医生');
      return;
    }

    // 验证：不能选择自己
    const currentDoctorIdRaw = account?.id || account?.name || '';
    const currentDoctorId = currentDoctorIdRaw.includes('/')
      ? currentDoctorIdRaw
      : `${account?.owner || 'casibase'}/${currentDoctorIdRaw}`;

    const selectedDoctorIds = collaborationForm.selectedDoctors.map(item => item.doctorId);
    if (selectedDoctorIds.includes(currentDoctorId)) {
      message.warning('不能向自己发起协同诊疗请求，请重新选择其他医生');
      return;
    }

    this.setState({ isSubmittingCollaboration: true });

    try {
      // 如果有PDF文件但还没有上传URL，先上传PDF
      let pdfFileUrl = collaborationForm.pdfFileUrl;
      if (collaborationForm.pdfFile && !pdfFileUrl) {
        pdfFileUrl = await this.uploadPdfFile(collaborationForm.pdfFile);
        if (!pdfFileUrl) {
          this.setState({ isSubmittingCollaboration: false });
          return;
        }
      }

      const fallbackPatientInfo = this.derivePatientInfoFromRecords(patientRecords);

      // 提取医院列表（去重）
      const hospitals = [...new Set(collaborationForm.selectedDoctors.map(item => item.hospitalName))];
      // 提取医生ID列表
      const doctorIds = collaborationForm.selectedDoctors.map(item => item.doctorId);

      const requestData = {
        initiatorDoctorId: account?.id || account?.name || '',
        initiatorDoctorName: account?.displayName || account?.name || '未知医生',
        initiatorHospital: account?.affiliation || '未知医院',
        patientHashId: patientHashId,
        patientIdentityNumber: trimmedIdentityNumber,
        patientName: (currentPatientInfo?.name || fallbackPatientInfo?.patientName || '').trim(),
        targetHospitals: JSON.stringify(hospitals),
        targetDoctors: JSON.stringify(doctorIds),
        description: collaborationForm.description || '',
        pdfFileUrl: pdfFileUrl || ''
      };

      console.log('发送协同诊疗请求:', requestData);

      const response = await fetch(`${Setting.ServerUrl}/api/create-collaboration-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      const res = await response.json();

      if (res.status === 'ok') {
        message.success('协同诊疗请求已发送成功！');
        this.setState({
          collaborationForm: {
            selectedHospitals: [],
            selectedDoctors: [],
            description: '',
            pdfFile: null,
            pdfFileUrl: null
          }
        });
        if (this.formRef.current) {
          this.formRef.current.resetFields();
        }
        // 刷新我的请求列表
        this.fetchMyCollaborationRequests();
      } else {
        message.error(res.msg || '发送协同诊疗请求失败');
      }
    } catch (error) {
      console.error('发送协同诊疗请求时发生错误:', error);
      message.error('发送失败，请稍后重试');
    } finally {
      this.setState({ isSubmittingCollaboration: false });
    }
  }

  // 获取医生发起的协同诊疗请求
  fetchMyCollaborationRequests = async () => {
    const { account } = this.props;
    if (!account?.id) {
      return;
    }

    this.setState({ isLoadingMyRequests: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-requests-by-doctor?doctorId=${encodeURIComponent(account.id)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const requests = res.data || [];
        this.setState({ myCollaborationRequests: requests });
        console.log('获取到我的协同诊疗请求:', requests);
      } else {
        message.error(res.msg || '获取协同诊疗请求失败');
        this.setState({ myCollaborationRequests: [] });
      }
    } catch (error) {
      console.error('获取协同诊疗请求时发生错误:', error);
      this.setState({ myCollaborationRequests: [] });
    } finally {
      this.setState({ isLoadingMyRequests: false });
    }
  }

  // 获取针对本医院的协同诊疗请求
  fetchHospitalCollaborationRequests = async () => {
    const { account } = this.props;
    const hospitalName = account?.affiliation;
    const currentDoctorId = account?.id || account?.name || '';

    if (!hospitalName) {
      return;
    }

    this.setState({ isLoadingHospitalRequests: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-requests-by-hospital?hospitalName=${encodeURIComponent(hospitalName)}&excludeDoctorId=${encodeURIComponent(currentDoctorId)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const requests = res.data || [];
        this.setState({ hospitalCollaborationRequests: requests });
        console.log('获取到针对本医院的协同诊疗请求:', requests);
      } else {
        message.error(res.msg || '获取协同诊疗请求失败');
        this.setState({ hospitalCollaborationRequests: [] });
      }
    } catch (error) {
      console.error('获取协同诊疗请求时发生错误:', error);
      this.setState({ hospitalCollaborationRequests: [] });
    } finally {
      this.setState({ isLoadingHospitalRequests: false });
    }
  }

  // 获取针对当前医生的协同诊疗请求
  fetchDoctorCollaborationRequests = async () => {
    const { account } = this.props;
    const doctorId = account?.id || account?.name;

    if (!doctorId) {
      return;
    }

    this.setState({ isLoadingDoctorRequests: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-requests-by-target-doctor?doctorId=${encodeURIComponent(doctorId)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const requests = res.data || [];
        this.setState({ doctorCollaborationRequests: requests });
        console.log('获取到针对当前医生的协同诊疗请求:', requests);
      } else {
        message.error(res.msg || '获取协同诊疗请求失败');
        this.setState({ doctorCollaborationRequests: [] });
      }
    } catch (error) {
      console.error('获取协同诊疗请求时发生错误:', error);
      this.setState({ doctorCollaborationRequests: [] });
    } finally {
      this.setState({ isLoadingDoctorRequests: false });
    }
  }

  // 显示请求详情
  showRequestDetails = async (request) => {
    this.setState({
      selectedRequest: request,
      showRequestModal: true,
      selectedRequestRecords: [],
      isLoadingRequestRecords: true
    });

    // 查询该患者对应的就诊记录
    if (request && request.patientHashId) {
      try {
        const response = await fetch(`${Setting.ServerUrl}/api/get-patient-by-hash-id?hashId=${encodeURIComponent(request.patientHashId)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const res = await response.json();
          if (res.status === 'ok') {
            const records = res.data || [];
            this.setState({ selectedRequestRecords: records });
          }
        }
      } catch (error) {
        console.error('获取就诊记录详情时发生错误:', error);
      } finally {
        this.setState({ isLoadingRequestRecords: false });
      }
    } else {
      this.setState({ isLoadingRequestRecords: false });
    }
  }

  // 显示诊疗意见填写界面
  showOpinionForm = (request) => {
    // 每次打开都是新的意见表单（允许医生提交多条意见）
    this.setState({
      selectedRequest: request,
      showOpinionModal: true,
      showRequestModal: false,
      diagnosisOpinion: {
        opinion: '',
        diagnosis: '',
        treatmentSuggestion: ''
      }
    });
  }

  // 提交诊疗意见
  submitDiagnosisOpinion = async () => {
    const { account } = this.props;
    const { selectedRequest, diagnosisOpinion } = this.state;

    if (!selectedRequest) {
      message.error('请求信息不完整');
      return;
    }

    // 检查请求状态
    if (selectedRequest.status !== 'active') {
      message.warning('该协同诊疗请求已关闭或已完成，无法提交新的诊疗意见');
      return;
    }

    if (!diagnosisOpinion.opinion.trim()) {
      message.warning('请填写诊疗意见');
      return;
    }

    this.setState({ isSubmittingOpinion: true });

    try {
      const opinionData = {
        collaborationReqId: selectedRequest.requestId,
        doctorId: account?.id || account?.name || '',
        doctorName: account?.displayName || account?.name || '未知医生',
        hospitalName: account?.affiliation || '未知医院',
        department: account?.department || '',
        opinion: diagnosisOpinion.opinion,
        diagnosis: diagnosisOpinion.diagnosis,
        treatmentSuggestion: diagnosisOpinion.treatmentSuggestion
      };

      console.log('提交诊疗意见:', opinionData);

      const response = await fetch(`${Setting.ServerUrl}/api/submit-diagnosis-opinion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(opinionData)
      });

      const res = await response.json();

      if (res.status === 'ok') {
        message.success('诊疗意见已提交成功！');
        this.setState({
          showOpinionModal: false,
          diagnosisOpinion: {
            opinion: '',
            diagnosis: '',
            treatmentSuggestion: ''
          }
        });
        // 刷新列表
        this.fetchHospitalCollaborationRequests();
      } else {
        message.error(res.msg || '提交诊疗意见失败');
      }
    } catch (error) {
      console.error('提交诊疗意见时发生错误:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      this.setState({ isSubmittingOpinion: false });
    }
  }

  // 关闭协同诊疗请求（弹出模态框）
  closeCollaborationRequest = (request) => {
    if (!request || !request.requestId) {
      message.error('请求信息不完整');
      return;
    }

    this.setState({
      requestToClose: request,
      showCloseModal: true,
      closeOpinion: {
        opinion: '',
        diagnosis: '',
        treatmentSuggestion: ''
      }
    });
  }

  // 提交关闭请求（包含最终意见）
  submitCloseRequest = async () => {
    const { account } = this.props;
    const { requestToClose, closeOpinion } = this.state;

    if (!requestToClose) {
      message.error('请求信息不完整');
      return;
    }

    if (!closeOpinion.opinion.trim()) {
      message.warning('请填写最终诊疗意见');
      return;
    }

    this.setState({ isClosingRequest: true });

    try {
      // 1. 提交最终诊疗意见
      const opinionData = {
        collaborationReqId: requestToClose.requestId,
        doctorId: account?.id || account?.name || '',
        doctorName: account?.displayName || account?.name || '未知医生',
        hospitalName: account?.affiliation || '未知医院',
        department: account?.department || '',
        opinion: `[最终意见] ${closeOpinion.opinion}`,
        diagnosis: closeOpinion.diagnosis,
        treatmentSuggestion: closeOpinion.treatmentSuggestion
      };

      const opinionResponse = await fetch(`${Setting.ServerUrl}/api/submit-diagnosis-opinion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(opinionData)
      });

      const opinionRes = await opinionResponse.json();
      if (opinionRes.status !== 'ok') {
        throw new Error(opinionRes.msg || '提交最终意见失败');
      }

      // 2. 更新请求状态为已完成（completed）
      const statusResponse = await fetch(`${Setting.ServerUrl}/api/update-collaboration-request-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: requestToClose.requestId,
          status: 'completed'
        })
      });

      const statusRes = await statusResponse.json();
      if (statusRes.status !== 'ok') {
        throw new Error(statusRes.msg || '更新请求状态失败');
      }

      message.success('协同诊疗请求已完成并关闭');
      this.setState({ showCloseModal: false });

      // 刷新请求列表
      this.fetchMyCollaborationRequests();
      this.fetchHospitalCollaborationRequests();
      this.fetchDoctorCollaborationRequests();

    } catch (error) {
      console.error('关闭协同诊疗请求时发生错误:', error);
      message.error(`关闭失败: ${error.message}`);
    } finally {
      this.setState({ isClosingRequest: false });
    }
  }

  // 查看诊疗意见
  showOpinions = async (request) => {
    this.setState({
      selectedRequestForOpinions: request,
      showOpinionsModal: true,
      isLoadingOpinions: true
    });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-diagnosis-opinions-by-request?requestId=${encodeURIComponent(request.requestId)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const res = await response.json();

      if (res.status === 'ok') {
        const opinions = res.data || [];
        this.setState({ diagnosisOpinions: opinions });
      } else {
        message.error(res.msg || '获取诊疗意见失败');
        this.setState({ diagnosisOpinions: [] });
      }
    } catch (error) {
      console.error('获取诊疗意见时发生错误:', error);
      this.setState({ diagnosisOpinions: [] });
    } finally {
      this.setState({ isLoadingOpinions: false });
    }
  }

  // 组件挂载时获取数据
  componentDidMount() {
    const { account } = this.props;
    const userTag = account?.tag || '';
    if (userTag === 'doctor') {
      this.fetchMyCollaborationRequests();
      this.fetchHospitalCollaborationRequests();
      this.fetchDoctorCollaborationRequests();
    }
  }

  render() {
    const { account } = this.props;
    const userTag = account?.tag || '';
    const isDoctor = userTag === 'doctor' || userTag === 'admin';

    // 定义可选医院列表
    const availableHospitals = ['广东省人民医院', '中国医科大学附属第一医院', '江苏省人民医院'];

    return (
      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'bold', margin: 0 }}>协同诊疗</h2>
          <p style={{ color: '#86909C', margin: '4px 0 0 0' }}>跨院协同诊疗平台 - 医生协作查看患者信息并提供诊疗意见</p>
        </div>

        <Row gutter={24}>
          {/* 左侧：用户信息和就诊历史统计 */}
          <Col xs={24} lg={8}>
            {this.renderUserInfoCard()}

            {/* 就诊历史统计 */}
            {this.state.patientRecords.length > 0 && (
              <Card
                title={
                  <Space>
                    <HistoryOutlined style={{ color: '#165DFF' }} />
                    患者就诊历史统计
                  </Space>
                }
              >
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
              </Card>
            )}
          </Col>

          {/* 右侧：功能区 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 医生界面：搜索患者和发起协同诊疗 */}
              {isDoctor && (
                <>
                  <Card
                    title={
                      <Space>
                        <SearchOutlined style={{ color: '#165DFF' }} />
                        患者信息查询与协同诊疗
                      </Space>
                    }
                  >
                    {/* 搜索栏 */}
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                        根据患者身份证号查询就诊记录
                      </label>
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="请输入患者身份证号"
                          value={this.state.searchIdentityNumber}
                          onChange={(e) => this.setState({ searchIdentityNumber: e.target.value })}
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

                    {/* 显示患者记录 */}
                    {this.state.patientRecords.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <Divider orientation="left">患者就诊记录（{this.state.patientRecords.length}条）</Divider>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                          <Collapse defaultActiveKey={[]} style={{ marginTop: '8px' }}>
                            {this.state.patientRecords.map((record, index) => {
                              const objectData = this.safeParseRecordObject(record?.object);
                              if (!objectData) {
                                return null;
                              }

                              const hospitalName = objectData.section || objectData.admHosName || objectData.hospitalName || objectData.hosName || objectData.admHos || '未知医院';
                              const consultationTime = objectData.consultationTime ? moment(objectData.consultationTime).format('YYYY-MM-DD HH:mm:ss') : '未知时间';
                              const unit = objectData.unit || '未知科室';

                              return (
                                <Panel
                                  header={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <Space>
                                        <MedicineBoxOutlined style={{ color: '#165DFF' }} />
                                        <span style={{ fontWeight: 500 }}>{hospitalName}</span>
                                        <span style={{ color: '#86909C', fontSize: '12px' }}>{consultationTime}</span>
                                      </Space>
                                      <Tag color="blue">{unit}</Tag>
                                    </div>
                                  }
                                  key={index}
                                >
                                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '4px' }}>
                                    <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500, color: '#165DFF' }}>
                                      就诊记录详细信息
                                    </div>
                                    <pre style={{
                                      margin: 0,
                                      fontSize: '12px',
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      maxHeight: '400px',
                                      overflowY: 'auto'
                                    }}>
                                      {JSON.stringify(objectData, null, 2)}
                                    </pre>
                                  </div>
                                </Panel>
                              );
                            })}
                          </Collapse>
                        </div>
                      </div>
                    )}

                    {/* 发起协同诊疗请求 */}
                    {this.state.patientRecords.length > 0 && (
                      <>
                        <Divider orientation="left">发起协同诊疗请求</Divider>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                            选择协作医院及医生（先选择医院，再选择该医院的医生）
                          </label>
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {availableHospitals.map((hospital, index) => {
                              const isHospitalSelected = this.state.collaborationForm.selectedHospitals.includes(hospital);
                              const hospitalDoctors = this.state.hospitalDoctorsMap[hospital] || [];
                              // 统一格式：确保 currentDoctorId 是 owner/name 格式
                              const currentDoctorIdRaw = account?.id || account?.name || '';
                              const currentDoctorId = currentDoctorIdRaw.includes('/')
                                ? currentDoctorIdRaw
                                : `${account?.owner || 'casibase'}/${currentDoctorIdRaw}`;

                              return (
                                <Card key={index} size="small" style={{ border: isHospitalSelected ? '2px solid #165DFF' : '1px solid #d9d9d9' }}>
                                  <div style={{ marginBottom: '8px' }}>
                                    <Checkbox
                                      checked={isHospitalSelected}
                                      onChange={async (e) => {
                                        const selectedHospitals = [...this.state.collaborationForm.selectedHospitals];
                                        let selectedDoctors = [...this.state.collaborationForm.selectedDoctors];

                                        if (e.target.checked) {
                                          selectedHospitals.push(hospital);
                                          // 加载该医院的医生列表
                                          await this.fetchDoctorsByHospital(hospital);
                                        } else {
                                          const index = selectedHospitals.indexOf(hospital);
                                          if (index > -1) {
                                            selectedHospitals.splice(index, 1);
                                          }
                                          // 移除该医院的所有医生选择
                                          selectedDoctors = selectedDoctors.filter(item => item.hospitalName !== hospital);
                                        }

                                        this.setState({
                                          collaborationForm: {
                                            ...this.state.collaborationForm,
                                            selectedHospitals,
                                            selectedDoctors
                                          }
                                        });
                                      }}
                                    >
                                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{hospital}</span>
                                    </Checkbox>
                                  </div>

                                  {isHospitalSelected && (
                                    <div style={{ marginLeft: '24px', marginTop: '8px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                      {this.state.isLoadingDoctors && hospitalDoctors.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '8px' }}>
                                          <Progress type="circle" size="small" />
                                        </div>
                                      ) : hospitalDoctors.length === 0 ? (
                                        <div style={{ color: '#86909C', fontSize: '12px' }}>该医院暂无医生</div>
                                      ) : (() => {
                                        // 过滤掉当前医生自己
                                        const availableDoctors = hospitalDoctors.filter(doctor => {
                                          const doctorId = `${doctor.owner}/${doctor.name}`;
                                          return doctorId !== currentDoctorId;
                                        });

                                        // 如果过滤后没有可用医生（只有当前医生自己）
                                        if (availableDoctors.length === 0) {
                                          return (
                                            <div style={{ color: '#86909C', fontSize: '12px' }}>
                                              该医院暂无其他医生（已排除您自己）
                                            </div>
                                          );
                                        }

                                        // 获取已选中的该医院的医生ID列表
                                        const selectedDoctorIds = this.state.collaborationForm.selectedDoctors
                                          .filter(item => item.hospitalName === hospital)
                                          .map(item => item.doctorId);

                                        return (
                                          <Select
                                            mode="multiple"
                                            placeholder="请选择该医院的医生（可多选）"
                                            value={selectedDoctorIds}
                                            style={{ width: '100%' }}
                                            onChange={(selectedIds) => {
                                              // 验证：不能选择自己
                                              const currentDoctorIdRaw = account?.id || account?.name || '';
                                              const currentDoctorId = currentDoctorIdRaw.includes('/')
                                                ? currentDoctorIdRaw
                                                : `${account?.owner || 'casibase'}/${currentDoctorIdRaw}`;

                                              // 过滤掉当前医生（防止通过其他方式选择自己）
                                              const validSelectedIds = selectedIds.filter(id => id !== currentDoctorId);

                                              if (selectedIds.length !== validSelectedIds.length) {
                                                message.warning('不能选择自己作为协作医生');
                                              }

                                              // 先移除该医院的所有医生选择
                                              let selectedDoctors = this.state.collaborationForm.selectedDoctors.filter(
                                                item => item.hospitalName !== hospital
                                              );

                                              // 添加新选中的医生
                                              validSelectedIds.forEach(doctorId => {
                                                const doctor = availableDoctors.find(d => `${d.owner}/${d.name}` === doctorId);
                                                if (doctor) {
                                                  selectedDoctors.push({
                                                    hospitalName: hospital,
                                                    doctorId: doctorId,
                                                    doctorName: doctor.displayName || doctor.name
                                                  });
                                                }
                                              });

                                              this.setState({
                                                collaborationForm: {
                                                  ...this.state.collaborationForm,
                                                  selectedDoctors
                                                }
                                              });
                                            }}
                                            optionLabelProp="label"
                                            showSearch
                                            filterOption={(input, option) => {
                                              const label = option?.label || '';
                                              return label.toLowerCase().includes(input.toLowerCase());
                                            }}
                                          >
                                            {availableDoctors.map((doctor) => {
                                              const doctorId = `${doctor.owner}/${doctor.name}`;
                                              const label = `${doctor.displayName || doctor.name}${doctor.department ? ` (${doctor.department})` : ''}`;
                                              return (
                                                <Option key={doctorId} value={doctorId} label={label}>
                                                  <div>
                                                    <span style={{ fontWeight: 500 }}>{doctor.displayName || doctor.name}</span>
                                                    {doctor.department && (
                                                      <span style={{ color: '#86909C', marginLeft: '8px' }}>({doctor.department})</span>
                                                    )}
                                                  </div>
                                                </Option>
                                              );
                                            })}
                                          </Select>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </Space>

                          {this.state.collaborationForm.selectedDoctors.length > 0 && (
                            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                              <div style={{ fontSize: '13px', color: '#0050b3', marginBottom: '8px', fontWeight: 500 }}>
                                已选择 {this.state.collaborationForm.selectedDoctors.length} 位医生：
                              </div>
                              <Space wrap>
                                {this.state.collaborationForm.selectedDoctors.map((item, idx) => (
                                  <Tag key={idx} color="blue">
                                    {item.hospitalName} - {item.doctorName}
                                  </Tag>
                                ))}
                              </Space>
                            </div>
                          )}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                            协同诊疗说明（可选）
                          </label>
                          <TextArea
                            rows={3}
                            placeholder="请说明需要协同诊疗的原因和关注点..."
                            value={this.state.collaborationForm.description}
                            onChange={(e) => {
                              this.setState({
                                collaborationForm: {
                                  ...this.state.collaborationForm,
                                  description: e.target.value
                                }
                              });
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                            上传患者信息PDF（可选）
                          </label>
                          {this.state.collaborationForm.pdfFileUrl || this.state.collaborationForm.pdfFile ? (
                            <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                              <Space>
                                <FilePdfOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                                <span style={{ fontSize: '14px' }}>
                                  {this.state.collaborationForm.pdfFile?.name || 'PDF文件已上传'}
                                </span>
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={this.removePdfFile}
                                >
                                  删除
                                </Button>
                              </Space>
                            </div>
                          ) : (
                            <Upload
                              accept=".pdf"
                              maxCount={1}
                              beforeUpload={(file) => {
                                // 检查文件类型
                                const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                                if (!isPdf) {
                                  message.error('只能上传PDF文件！');
                                  return Upload.LIST_IGNORE;
                                }
                                // 检查文件大小（限制为50MB）
                                const isLt50M = file.size / 1024 / 1024 < 50;
                                if (!isLt50M) {
                                  message.error('PDF文件大小不能超过50MB！');
                                  return Upload.LIST_IGNORE;
                                }
                                // 自动上传
                                this.uploadPdfFile(file);
                                return false; // 阻止自动上传，我们手动处理
                              }}
                              fileList={this.state.collaborationForm.pdfFile ? [{
                                uid: '-1',
                                name: this.state.collaborationForm.pdfFile.name,
                                status: this.state.isUploadingPdf ? 'uploading' : 'done',
                                percent: this.state.isUploadingPdf ? 50 : 100
                              }] : []}
                              onRemove={() => {
                                this.removePdfFile();
                                return true;
                              }}
                            >
                              <Button icon={<UploadOutlined />} loading={this.state.isUploadingPdf}>
                                选择PDF文件
                              </Button>
                            </Upload>
                          )}
                          <div style={{ fontSize: '12px', color: '#86909C', marginTop: '8px' }}>
                            支持上传患者病历、检查报告等PDF文件，最大50MB
                          </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<SendOutlined />}
                            loading={this.state.isSubmittingCollaboration}
                            onClick={this.submitCollaborationRequest}
                            disabled={this.state.collaborationForm.selectedDoctors.length === 0}
                          >
                            发起协同诊疗请求并上链
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>

                  {/* 我发起的协同诊疗请求 */}
                  <Card
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: '#165DFF' }} />
                        我发起的协同诊疗请求
                      </Space>
                    }
                    extra={
                      <Button
                        onClick={this.fetchMyCollaborationRequests}
                        loading={this.state.isLoadingMyRequests}
                      >
                        刷新
                      </Button>
                    }
                  >
                    {this.state.isLoadingMyRequests ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Progress type="circle" />
                      </div>
                    ) : this.state.myCollaborationRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                        <div style={{ fontSize: '14px' }}>暂无协同诊疗请求</div>
                      </div>
                    ) : (
                      <Row gutter={[16, 16]}>
                        {this.state.myCollaborationRequests.map((request, index) => (
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
                                </Button>,
                                <Button
                                  type="link"
                                  icon={<FileTextOutlined />}
                                  onClick={() => this.showOpinions(request)}
                                >
                                  查看意见
                                </Button>,
                                request.status === 'active' && (
                                  <Button
                                    type="link"
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => this.closeCollaborationRequest(request)}
                                  >
                                    关闭请求
                                  </Button>
                                )
                              ].filter(Boolean)}
                            >
                              <div style={{ marginBottom: '12px' }}>
                                <Tag color={request.status === 'active' ? 'green' : request.status === 'completed' ? 'blue' : 'default'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                                  {request.status === 'active' ? '进行中' : request.status === 'completed' ? '已完成' : request.status === 'cancelled' ? '已关闭' : '未知状态'}
                                </Tag>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者姓名</div>
                                <div style={{ fontSize: '14px' }}>{this.getDisplayPatientName(request)}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者身份证号</div>
                                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                  {this.getDisplayPatientIdentity(request)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>协作医院</div>
                                <div style={{ fontSize: '12px' }}>
                                  {JSON.parse(request.targetHospitals || '[]').map((hospital, idx) => (
                                    <Tag key={idx} size="small" color="blue" style={{ marginBottom: '2px' }}>
                                      {hospital}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>

                  {/* 待我处理的协同诊疗请求 */}
                  <Card
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: '#165DFF' }} />
                        待我处理的协同诊疗请求
                      </Space>
                    }
                    extra={
                      <Button
                        onClick={() => {
                          this.fetchHospitalCollaborationRequests();
                          this.fetchDoctorCollaborationRequests();
                        }}
                        loading={this.state.isLoadingHospitalRequests || this.state.isLoadingDoctorRequests}
                      >
                        刷新
                      </Button>
                    }
                  >
                    {this.state.isLoadingHospitalRequests || this.state.isLoadingDoctorRequests ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Progress type="circle" />
                      </div>
                    ) : (() => {
                      // 合并医院和医生的请求，去重
                      const allRequests = [...this.state.hospitalCollaborationRequests, ...this.state.doctorCollaborationRequests];
                      const uniqueRequests = allRequests.filter((request, index, self) =>
                        index === self.findIndex(r => r.requestId === request.requestId)
                      );

                      return uniqueRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                          <div style={{ fontSize: '14px' }}>暂无待处理的协同诊疗请求</div>
                        </div>
                      ) : (
                        <Row gutter={[16, 16]}>
                          {uniqueRequests.map((request, index) => {
                            const targetDoctors = JSON.parse(request.targetDoctors || '[]');
                            const currentDoctorId = account?.id || account?.name || '';
                            const isTargetDoctor = targetDoctors.includes(currentDoctorId);
                            const isActive = request.status === 'active';

                            return (
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
                                    </Button>,
                                    <Button
                                      type="link"
                                      icon={<EditOutlined />}
                                      onClick={() => this.showOpinionForm(request)}
                                      disabled={!isActive}
                                    >
                                      {isActive ? '填写意见' : '已关闭'}
                                    </Button>
                                  ]}
                                >
                                  <div style={{ marginBottom: '12px' }}>
                                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                      {request.initiatorDoctorName}
                                    </Tag>
                                    <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                      {request.initiatorHospital}
                                    </Tag>
                                    {isTargetDoctor && (
                                      <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                        指定医生
                                      </Tag>
                                    )}
                                    {!isActive && (
                                      <Tag color="default" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                        {request.status === 'cancelled' ? '已关闭' : request.status === 'completed' ? '已完成' : '未知状态'}
                                      </Tag>
                                    )}
                                  </div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                    <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                                  </div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者姓名</div>
                                    <div style={{ fontSize: '14px' }}>{this.getDisplayPatientName(request)}</div>
                                  </div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者身份证号</div>
                                    <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                      {this.getDisplayPatientIdentity(request)}
                                    </div>
                                  </div>
                                  {targetDoctors.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>指定医生</div>
                                      <div style={{ fontSize: '12px' }}>
                                        {targetDoctors.map((doctorId, idx) => (
                                          <Tag key={idx} size="small" color="green" style={{ marginBottom: '2px' }}>
                                            {doctorId}
                                          </Tag>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {request.description && (
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>说明</div>
                                      <div style={{ fontSize: '12px' }}>{request.description}</div>
                                    </div>
                                  )}
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      );
                    })()}
                  </Card>
                </>
              )}
            </Space>
          </Col>
        </Row>

        {/* 请求详情模态框 */}
        <Modal
          title="协同诊疗请求详情"
          open={this.state.showRequestModal}
          onCancel={() => this.setState({ showRequestModal: false, selectedRequest: null, selectedRequestRecords: [] })}
          footer={[
            <Button key="close" onClick={() => this.setState({ showRequestModal: false, selectedRequest: null, selectedRequestRecords: [] })}>
              关闭
            </Button>
          ]}
          width={900}
        >
          {this.state.selectedRequest && (
            <>
              <Descriptions column={1} size="small" style={{ marginBottom: '24px' }}>
                <Descriptions.Item label="发起医生">{this.state.selectedRequest.initiatorDoctorName}</Descriptions.Item>
                <Descriptions.Item label="发起医院">{this.state.selectedRequest.initiatorHospital}</Descriptions.Item>
                <Descriptions.Item label="患者姓名">{this.getDisplayPatientName(this.state.selectedRequest)}</Descriptions.Item>
                <Descriptions.Item label="患者身份证号">
                  {this.getDisplayPatientIdentity(this.state.selectedRequest)}
                </Descriptions.Item>
                <Descriptions.Item label="患者HashID">{this.state.selectedRequest.patientHashId}</Descriptions.Item>
                <Descriptions.Item label="发起时间">{moment(this.state.selectedRequest.createdTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={this.state.selectedRequest.status === 'active' ? 'green' : this.state.selectedRequest.status === 'completed' ? 'blue' : 'default'}>
                    {this.state.selectedRequest.status === 'active' ? '进行中' : this.state.selectedRequest.status === 'completed' ? '已完成' : this.state.selectedRequest.status === 'cancelled' ? '已关闭' : '未知状态'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="协作医院">
                  {JSON.parse(this.state.selectedRequest.targetHospitals || '[]').map((hospital, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>{hospital}</Tag>
                  ))}
                </Descriptions.Item>
                {this.state.selectedRequest.targetDoctors && (
                  <Descriptions.Item label="指定医生">
                    {JSON.parse(this.state.selectedRequest.targetDoctors || '[]').map((doctorId, index) => (
                      <Tag key={index} color="green" style={{ marginBottom: '4px' }}>{doctorId}</Tag>
                    ))}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="说明">
                  {this.state.selectedRequest.description || '无'}
                </Descriptions.Item>
                {this.state.selectedRequest.pdfFileUrl && (
                  <Descriptions.Item label="患者信息PDF">
                    <Button
                      type="link"
                      icon={<FilePdfOutlined />}
                      onClick={() => {
                        const downloadUrl = this.getPdfDownloadUrl(this.state.selectedRequest.pdfFileUrl);
                        window.open(downloadUrl, '_blank');
                      }}
                    >
                      下载PDF文件
                    </Button>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider>就诊记录详情</Divider>

              {this.state.isLoadingRequestRecords ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Progress type="circle" />
                </div>
              ) : this.state.selectedRequestRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#86909C' }}>
                  <div style={{ fontSize: '14px' }}>暂无就诊记录</div>
                </div>
              ) : (
                <Collapse defaultActiveKey={['0']} style={{ marginTop: '16px' }}>
                  {this.state.selectedRequestRecords.map((record, index) => {
                    const objectData = this.safeParseRecordObject(record?.object);
                    const hospitalName = objectData?.admHosName || objectData?.section || objectData?.hospitalName || objectData?.hosName || objectData?.admHos || '未知医院';
                    const consultationTime = objectData?.consultationTime ? moment(objectData.consultationTime).format('YYYY-MM-DD HH:mm:ss') : '未知时间';
                    const unit = objectData?.unit || '未知科室';

                    return (
                      <Panel
                        header={
                          <Space>
                            <MedicineBoxOutlined style={{ color: '#165DFF' }} />
                            <span style={{ fontWeight: 500 }}>{hospitalName}</span>
                            <span style={{ color: '#86909C', fontSize: '12px' }}>{consultationTime}</span>
                            <Tag color="blue">{unit}</Tag>
                          </Space>
                        }
                        key={index}
                      >
                        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '4px', maxHeight: '500px', overflowY: 'auto' }}>
                          <pre style={{
                            margin: 0,
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {JSON.stringify(objectData || {}, null, 2)}
                          </pre>
                        </div>
                      </Panel>
                    );
                  })}
                </Collapse>
              )}
            </>
          )}
        </Modal>

        {/* 诊疗意见填写模态框 */}
        <Modal
          title="提交新的诊疗意见"
          open={this.state.showOpinionModal}
          onCancel={() => this.setState({ showOpinionModal: false, selectedRequest: null, diagnosisOpinion: { opinion: '', diagnosis: '', treatmentSuggestion: '' } })}
          footer={[
            <Button key="cancel" onClick={() => this.setState({ showOpinionModal: false, selectedRequest: null, diagnosisOpinion: { opinion: '', diagnosis: '', treatmentSuggestion: '' } })}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<CheckOutlined />}
              loading={this.state.isSubmittingOpinion}
              onClick={this.submitDiagnosisOpinion}
            >
              提交并上链
            </Button>
          ]}
          width={700}
        >
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderLeft: '4px solid #1890ff', borderRadius: '4px' }}>
            <div style={{ fontSize: '14px', color: '#0050b3' }}>
              提示：您可以对同一个协同诊疗请求提交多条意见，每条意见都会记录在区块链上。
            </div>
          </div>
          {this.state.selectedRequest?.pdfFileUrl && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
              <Space>
                <FilePdfOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>患者信息PDF：</span>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    const downloadUrl = this.getPdfDownloadUrl(this.state.selectedRequest.pdfFileUrl);
                    window.open(downloadUrl, '_blank');
                  }}
                >
                  下载PDF文件
                </Button>
              </Space>
            </div>
          )}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                诊疗意见 <span style={{ color: 'red' }}>*</span>
              </label>
              <TextArea
                rows={4}
                placeholder="请输入您的诊疗意见..."
                value={this.state.diagnosisOpinion.opinion}
                onChange={(e) => this.setState({
                  diagnosisOpinion: {
                    ...this.state.diagnosisOpinion,
                    opinion: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                诊断结果（可选）
              </label>
              <TextArea
                rows={3}
                placeholder="请输入诊断结果..."
                value={this.state.diagnosisOpinion.diagnosis}
                onChange={(e) => this.setState({
                  diagnosisOpinion: {
                    ...this.state.diagnosisOpinion,
                    diagnosis: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                治疗建议（可选）
              </label>
              <TextArea
                rows={3}
                placeholder="请输入治疗建议..."
                value={this.state.diagnosisOpinion.treatmentSuggestion}
                onChange={(e) => this.setState({
                  diagnosisOpinion: {
                    ...this.state.diagnosisOpinion,
                    treatmentSuggestion: e.target.value
                  }
                })}
              />
            </div>
          </Space>
        </Modal>

        {/* 查看诊疗意见模态框 */}
        <Modal
          title="诊疗意见汇总"
          open={this.state.showOpinionsModal}
          onCancel={() => this.setState({ showOpinionsModal: false, selectedRequestForOpinions: null, diagnosisOpinions: [] })}
          footer={[
            <Button key="close" onClick={() => this.setState({ showOpinionsModal: false, selectedRequestForOpinions: null, diagnosisOpinions: [] })}>
              关闭
            </Button>
          ]}
          width={900}
        >
          {this.state.isLoadingOpinions ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Progress type="circle" />
            </div>
          ) : this.state.diagnosisOpinions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
              <div style={{ fontSize: '14px' }}>暂无诊疗意见</div>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {this.state.diagnosisOpinions.map((opinion, index) => (
                <Card key={opinion.opinionId} size="small">
                  <div style={{ marginBottom: '12px' }}>
                    <Space>
                      <Tag color="blue">{opinion.doctorName}</Tag>
                      <Tag color="green">{opinion.hospitalName}</Tag>
                      {opinion.department && <Tag>{opinion.department}</Tag>}
                      <span style={{ fontSize: '12px', color: '#86909C' }}>
                        {moment(opinion.createdTime).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </Space>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>诊疗意见</div>
                    <div style={{ fontSize: '14px' }}>{opinion.opinion}</div>
                  </div>
                  {opinion.diagnosis && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>诊断结果</div>
                      <div style={{ fontSize: '14px' }}>{opinion.diagnosis}</div>
                    </div>
                  )}
                  {opinion.treatmentSuggestion && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>治疗建议</div>
                      <div style={{ fontSize: '14px' }}>{opinion.treatmentSuggestion}</div>
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          )}
        </Modal>

        {/* 关闭请求模态框 */}
        <Modal
          title="关闭协同诊疗请求"
          open={this.state.showCloseModal}
          onCancel={() => this.setState({ showCloseModal: false, requestToClose: null })}
          footer={[
            <Button key="cancel" onClick={() => this.setState({ showCloseModal: false, requestToClose: null })}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger
              loading={this.state.isClosingRequest}
              onClick={this.submitCloseRequest}
            >
              确认关闭并归档
            </Button>
          ]}
          width={700}
        >
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff1f0', borderLeft: '4px solid #ff4d4f', borderRadius: '4px' }}>
            <div style={{ fontSize: '14px', color: '#cf1322' }}>
              请填写最终诊疗意见。此操作将结束本次协同诊疗流程，并将状态更新为“已完成”。
            </div>
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                最终诊疗意见 <span style={{ color: 'red' }}>*</span>
              </label>
              <TextArea
                rows={4}
                placeholder="请输入最终的综合诊疗意见..."
                value={this.state.closeOpinion.opinion}
                onChange={(e) => this.setState({
                  closeOpinion: {
                    ...this.state.closeOpinion,
                    opinion: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                最终诊断结果（可选）
              </label>
              <TextArea
                rows={3}
                placeholder="请输入最终诊断结果..."
                value={this.state.closeOpinion.diagnosis}
                onChange={(e) => this.setState({
                  closeOpinion: {
                    ...this.state.closeOpinion,
                    diagnosis: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                最终治疗建议（可选）
              </label>
              <TextArea
                rows={3}
                placeholder="请输入最终治疗建议..."
                value={this.state.closeOpinion.treatmentSuggestion}
                onChange={(e) => this.setState({
                  closeOpinion: {
                    ...this.state.closeOpinion,
                    treatmentSuggestion: e.target.value
                  }
                })}
              />
            </div>
          </Space>
        </Modal>
      </div>
    );
  }
}

export default PythonSrPage;



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
import { Card, Button, Checkbox, Select, Input, Progress, Tabs, Avatar, Space, Row, Col, Statistic, message, Form, DatePicker, InputNumber, Modal, Tag, Descriptions, Divider, Table } from "antd";
import { UserOutlined, HistoryOutlined, FileTextOutlined, MedicineBoxOutlined, SearchOutlined, SendOutlined, CheckOutlined, CloseOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
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

      // 协同诊疗相关状态
      collaborationForm: {
        selectedHospitals: [],
        description: ''
      },
      isSubmittingCollaboration: false,

      // 医生发起的协同诊疗请求
      myCollaborationRequests: [],
      isLoadingMyRequests: false,

      // 针对本医院的协同诊疗请求
      hospitalCollaborationRequests: [],
      isLoadingHospitalRequests: false,

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
        { value: 3, name: '中国医科大学第一附属医院', itemStyle: { color: '#36BFFA' } }
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
    let cardTitle = "医生信息";
    let buttonText = "编辑医生信息";

    if (userTag === 'admin') {
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
      </Card>
    );
  }

  // 搜索患者记录
  searchPatientRecords = async () => {
    const { searchHashId } = this.state;
    if (!searchHashId.trim()) {
      message.warning('请输入患者HashID');
      return;
    }

    this.setState({
      isLoading: true,
      patientRecords: [],
      hospitalOptions: []
    });

    try {
      console.log('开始搜索患者就诊记录，HashID:', searchHashId);

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
      } else {
        console.error('API返回错误:', res);
        const errorMsg = res.msg || '查询失败';
        message.error(`查询失败: ${errorMsg}`);
        this.setState({ patientRecords: [], hospitalOptions: [] });
      }
    } catch (error) {
      console.error('搜索患者记录时发生错误:', error);
      message.error('查询失败，请稍后重试');
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

        let cleanObject = record.object;
        if (typeof cleanObject === 'string') {
          cleanObject = cleanObject.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        const objectData = JSON.parse(cleanObject);
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

  // 获取医院颜色
  getHospitalColor = (hospitalName) => {
    const colors = ['#165DFF', '#36BFFA', '#0FC6C2', '#FF7D00', '#F53F3F', '#00B42A'];
    const index = hospitalName.length % colors.length;
    return colors[index];
  }

  // 发起协同诊疗请求
  submitCollaborationRequest = async () => {
    const { account } = this.props;
    const { searchHashId, collaborationForm } = this.state;

    if (!searchHashId.trim()) {
      message.warning('请先搜索患者HashID');
      return;
    }

    if (collaborationForm.selectedHospitals.length === 0) {
      message.warning('请选择至少一家医院');
      return;
    }

    this.setState({ isSubmittingCollaboration: true });

    try {
      const requestData = {
        initiatorDoctorId: account?.id || account?.name || '',
        initiatorDoctorName: account?.displayName || account?.name || '未知医生',
        initiatorHospital: account?.affiliation || '未知医院',
        patientHashId: searchHashId,
        targetHospitals: JSON.stringify(collaborationForm.selectedHospitals),
        description: collaborationForm.description || ''
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
            description: ''
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

    if (!hospitalName) {
      return;
    }

    this.setState({ isLoadingHospitalRequests: true });

    try {
      const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-requests-by-hospital?hospitalName=${encodeURIComponent(hospitalName)}`, {
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

  // 显示请求详情
  showRequestDetails = (request) => {
    this.setState({
      selectedRequest: request,
      showRequestModal: true
    });
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
    }
  }

  render() {
    const { account } = this.props;
    const userTag = account?.tag || '';
    const isDoctor = userTag === 'doctor';

    // 定义可选医院列表
    const availableHospitals = ['广东省人民医院', '中国医科大学第一附属医院'];

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

                    {/* 显示患者记录 */}
                    {this.state.patientRecords.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <Divider orientation="left">患者就诊记录（{this.state.patientRecords.length}条）</Divider>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {this.state.patientRecords.slice(0, 5).map((record, index) => {
                              try {
                                const recordData = JSON.parse(record.object || '{}');
                                return (
                                  <Card key={record.id} size="small" hoverable>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Space>
                                        <MedicineBoxOutlined style={{ color: '#165DFF' }} />
                                        <span style={{ fontWeight: 500 }}>
                                          {recordData.section || recordData.admHosName || '未知医院'}
                                        </span>
                                        <span style={{ color: '#86909C', fontSize: '12px' }}>
                                          {recordData.consultationTime ? moment(recordData.consultationTime).format('YYYY-MM-DD') : '未知时间'}
                                        </span>
                                      </Space>
                                      <Tag color="blue">{recordData.unit || '未知科室'}</Tag>
                                    </div>
                                  </Card>
                                );
                              } catch (error) {
                                return null;
                              }
                            })}
                          </Space>
                        </div>
                      </div>
                    )}

                    {/* 发起协同诊疗请求 */}
                    {this.state.patientRecords.length > 0 && (
                      <>
                        <Divider orientation="left">发起协同诊疗请求</Divider>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                            选择协作医院（可选择多家）
                          </label>
                          <Space direction="vertical">
                            {availableHospitals.map((hospital, index) => (
                              <Checkbox
                                key={index}
                                checked={this.state.collaborationForm.selectedHospitals.includes(hospital)}
                                onChange={(e) => {
                                  const selectedHospitals = [...this.state.collaborationForm.selectedHospitals];
                                  if (e.target.checked) {
                                    selectedHospitals.push(hospital);
                                  } else {
                                    const index = selectedHospitals.indexOf(hospital);
                                    if (index > -1) {
                                      selectedHospitals.splice(index, 1);
                                    }
                                  }
                                  this.setState({
                                    collaborationForm: {
                                      ...this.state.collaborationForm,
                                      selectedHospitals
                                    }
                                  });
                                }}
                              >
                                {hospital}
                              </Checkbox>
                            ))}
                          </Space>
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

                        <div style={{ textAlign: 'center' }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<SendOutlined />}
                            loading={this.state.isSubmittingCollaboration}
                            onClick={this.submitCollaborationRequest}
                            disabled={this.state.collaborationForm.selectedHospitals.length === 0}
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
                                </Button>
                              ]}
                            >
                              <div style={{ marginBottom: '12px' }}>
                                <Tag color={request.status === 'active' ? 'green' : 'default'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                                  {request.status === 'active' ? '进行中' : request.status === 'completed' ? '已完成' : '已取消'}
                                </Tag>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者HashID</div>
                                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                  {request.patientHashId.substring(0, 16)}...
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
                        onClick={this.fetchHospitalCollaborationRequests}
                        loading={this.state.isLoadingHospitalRequests}
                      >
                        刷新
                      </Button>
                    }
                  >
                    {this.state.isLoadingHospitalRequests ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Progress type="circle" />
                      </div>
                    ) : this.state.hospitalCollaborationRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                        <div style={{ fontSize: '14px' }}>暂无待处理的协同诊疗请求</div>
                      </div>
                    ) : (
                      <Row gutter={[16, 16]}>
                        {this.state.hospitalCollaborationRequests.map((request, index) => (
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
                                >
                                  填写意见
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
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>患者HashID</div>
                                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                  {request.patientHashId.substring(0, 16)}...
                                </div>
                              </div>
                              {request.description && (
                                <div>
                                  <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>说明</div>
                                  <div style={{ fontSize: '12px' }}>{request.description}</div>
                                </div>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
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
          onCancel={() => this.setState({ showRequestModal: false, selectedRequest: null })}
          footer={[
            <Button key="close" onClick={() => this.setState({ showRequestModal: false, selectedRequest: null })}>
              关闭
            </Button>
          ]}
          width={600}
        >
          {this.state.selectedRequest && (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="发起医生">{this.state.selectedRequest.initiatorDoctorName}</Descriptions.Item>
              <Descriptions.Item label="发起医院">{this.state.selectedRequest.initiatorHospital}</Descriptions.Item>
              <Descriptions.Item label="患者HashID">{this.state.selectedRequest.patientHashId}</Descriptions.Item>
              <Descriptions.Item label="发起时间">{moment(this.state.selectedRequest.createdTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="协作医院">
                {JSON.parse(this.state.selectedRequest.targetHospitals || '[]').map((hospital, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>{hospital}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="说明">
                {this.state.selectedRequest.description || '无'}
              </Descriptions.Item>
            </Descriptions>
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
      </div>
    );
  }
}

export default PythonSrPage;



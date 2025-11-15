// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import React, { Component } from "react";
import { Card, Row, Col, Typography, Statistic, Tag, Button } from "antd";
import { BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import ReactEcharts from "echarts-for-react";
import * as DashboardBackend from "../backend/DashboardBackend.js"
import hospitalBg from "./hospital_back_bg.jpg";

const { Title, Text } = Typography;
const { CheckableTag } = Tag;


class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hospitals: [],
      diseases: [],
      hospitalSubmissions: {
        names: [],
        values: []
      },
      totalRecords: 0,
      loading: true,
      selectedHospitals: []
    };

    this.hospitalLinkRules = [
      {
        keywords: ["江苏省人民医院"],
        url: "https://www.jsph.org.cn/sy.htm"
      },
      {
        keywords: ["中国医科大学附属第一医院"],
        url: "https://www.cmu1h.com/home"
      },
      {
        keywords: ["广东省人民医院"],
        url: "https://www.gdghospital.org.cn/"
      },
      {
        keywords: ["深圳市中医院"],
        url: "https://www.szszyy.cn/"
      }
    ];
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  // 处理数据的辅助方法
  processData = (data) => {
    console.log("Processing data:", data); // 调试日志

    // 安全地获取最后一天的数据
    const lastDaySection = data.section && data.section.length > 0 ? data.section[data.section.length - 1] : null;
    const lastDayDiseaseCategory = data.diseaseCategory && data.diseaseCategory.length > 0 ? data.diseaseCategory[data.diseaseCategory.length - 1] : null;

    // 处理医院记录数（section）
    const hospitals = [];
    if (lastDaySection?.FieldCount) {
      Object.entries(lastDaySection.FieldCount).forEach(([name, value]) => {
        hospitals.push({ name, value });
      });
    }

    // 处理病种记录
    const diseases = [];
    if (lastDayDiseaseCategory?.FieldCount) {
      Object.entries(lastDayDiseaseCategory.FieldCount).forEach(([name, value]) => {
        diseases.push({ name, value });
      });
    }

    // 处理医院提交量
    const hospitalNames = hospitals.map(item => item.name);
    const hospitalValues = hospitals.map(item => item.value);

    // 计算总记录数
    const totalRecords = hospitalValues.reduce((sum, value) => sum + value, 0);

    const prevSelected = this.state.selectedHospitals || [];
    const selectedHospitals = prevSelected.filter(name => hospitalNames.includes(name));
    const nextSelectedHospitals = selectedHospitals.length > 0 ? selectedHospitals : hospitalNames;

    this.setState({
      hospitals,
      diseases,
      hospitalSubmissions: {
        names: hospitalNames,
        values: hospitalValues
      },
      totalRecords,
      loading: false,
      selectedHospitals: nextSelectedHospitals
    });
  }

  resolveHospitalUrl = (name = "") => {
    const sanitized = (name || "").trim();
    for (const rule of this.hospitalLinkRules) {
      if (rule.keywords.some(keyword => sanitized.includes(keyword))) {
        return rule.url;
      }
    }
    return null;
  };

  handleHospitalLegendToggle = (hospitalName, checked) => {
    this.setState(prevState => {
      const allHospitalNames = prevState.hospitals.map(item => item.name);
      const nextSelection = new Set(prevState.selectedHospitals);

      if (checked) {
        nextSelection.add(hospitalName);
      } else {
        nextSelection.delete(hospitalName);
      }

      if (nextSelection.size === 0) {
        allHospitalNames.forEach(name => nextSelection.add(name));
      }

      return { selectedHospitals: Array.from(nextSelection) };
    });
  };

  renderHospitalLegend() {
    const { hospitals, selectedHospitals } = this.state;
    if (!hospitals || hospitals.length === 0) {
      return null;
    }

    // return (
    //   <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

    //     {hospitals.map(hospital => (
    //       <CheckableTag
    //         key={hospital.name}
    //         checked={selectedHospitals.includes(hospital.name)}
    //         onChange={checked => this.handleHospitalLegendToggle(hospital.name, checked)}
    //       >
    //         {hospital.name}
    //       </CheckableTag>
    //     ))}
    //   </div>
    // );
  }

  fetchDashboardData = async () => {
    try {
      console.log("正在获取真实数据...");
      const response = await DashboardBackend.getDashBoardData("100", "All", "section,diseaseCategory");

      console.log("API响应:", response);

      if (response.status === "ok" && response.data) {
        console.log("使用真实数据");
        this.processData(response.data);
      } else {
        console.error("API返回数据格式异常:", response);
        this.setState({
          loading: false,
          hospitals: [],
          diseases: [],
          hospitalSubmissions: { names: [], values: [] },
          totalRecords: 0
        });
      }
    } catch (error) {
      console.error("API调用失败:", error);
      this.setState({
        loading: false,
        hospitals: [],
        diseases: [],
        hospitalSubmissions: { names: [], values: [] },
        totalRecords: 0
      });
    }
  }

  renderHospitalPieChart() {
    const { hospitals } = this.state;
    const option = {
      title: {
        text: "各家医院数据量占比",
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: hospitals.map(item => item.name)
      },
      series: [
        {
          name: '医院数据量',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: hospitals
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  renderDiseasePieChart() {
    const { diseases } = this.state;
    const option = {
      title: {
        text: "专病种数据分布",
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: diseases.map(item => item.name)
      },
      series: [
        {
          name: '病种数据量',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: diseases
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  renderHospitalSubmissionChart() {
    const { hospitals, selectedHospitals } = this.state;
    const activeHospitals = (hospitals || []).filter(item => selectedHospitals.includes(item.name));
    const categoryNames = activeHospitals.map(item => item.name);
    const categoryValues = activeHospitals.map(item => item.value);

    const onEvents = {
      click: params => {
        const url = this.resolveHospitalUrl(params.name);
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    };

    const option = {
      title: {
        text: "各家医院数据量",
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: categoryNames,
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            interval: 0,
            rotate: 26,
            color: '#243B53',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 18,
            margin: 16,
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
            formatter: value => {
              if (value.length <= 8) {
                return value;
              }
              const segments = value.match(/.{1,8}/g) || [value];
              return segments.join("\n");
            }
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '数据量'
        }
      ],
      series: [
        {
          name: '数据量',
          type: 'bar',
          barWidth: '60%',
          data: categoryValues,
          itemStyle: {
            // 从深到浅的蓝色渐变
            color: function (params) {
              const colorList = [
                '#364fc7',  // 深蓝
                '#3b5bdb',
                '#1971c2',
                '#1c7ed6',
                '#228be6',
                "#339af0",
                "#4dabf7",
                "#74c0fc"
              ];
              // 根据数据索引循环使用颜色
              return colorList[params.dataIndex % colorList.length];
            }
          }
        }
      ]
    };

    return <ReactEcharts option={option} onEvents={onEvents} style={{ height: '400px' }} />;
  }

  render() {
    const { loading } = this.state;

    const themeStyles = {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBackground: '#fff',
      textColor: '#2c3e50',
      subTextColor: '#7f8c8d',
      cardShadow: '0 12px 40px rgba(0,0,0,0.15)',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2'
    };

    return (
      <div className="dashboard-page" style={{
        padding: '24px',
        background: themeStyles.background,
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative'
        }}>
          <Title level={1} style={{
            color: '#fff',
            margin: 0,
            fontSize: '42px',
            fontWeight: 'bold',
            textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
            background: 'linear-gradient(45deg, #fff, #f0f8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            可信共享数据总览
          </Title>
          <Text style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '12px',
            display: 'block',
            textShadow: '1px 1px 4px rgba(0,0,0,0.2)'
          }}>
            📊 医疗数据统计分析与可视化展示
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 总览卡片 */}
          <Col span={24}>
            <Card
              title="就诊记录统计总览"
              bordered={false}
              style={{
                height: '100%',
                background: `linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%), url(${hospitalBg})`,
                backgroundSize: 'auto 80%',
                backgroundPosition: 'right bottom',
                backgroundRepeat: 'no-repeat',
                borderRadius: '20px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                overflow: 'hidden',
                position: 'relative'
              }}
              headStyle={{
                background: 'rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
              bodyStyle={{
                padding: '32px'
              }}
            >
              <div style={{
                maxWidth: '60%',
                color: '#fff',
                position: 'relative',
                zIndex: 1,
                background: 'rgba(0,0,0,0.1)',
                padding: '20px',
                borderRadius: '12px',
                backdropFilter: 'blur(5px)'
              }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>总就诊记录数</span>}
                  value={this.state.totalRecords}
                  valueStyle={{
                    fontSize: '48px',
                    color: '#fff',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                  formatter={(value) => `${(value).toLocaleString()}`}
                  loading={loading}
                />
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  📊 按患者就诊记录统计
                </div>
              </div>
            </Card>
          </Col>

          {/* 基础统计图表 */}
          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PieChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
                    <span>各家医院数据量占比</span>
                  </div>
                  <Button
                    type="default"
                    size="small"
                    onClick={() => window.open('https://zgcx.nhc.gov.cn/unit', '_blank', 'noopener,noreferrer')}
                    style={{
                      background: `linear-gradient(135deg, ${themeStyles.primaryColor} 0%, ${themeStyles.secondaryColor} 100%)`,
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 16px',
                      height: 'auto',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      const btn = e.currentTarget;
                      btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                      btn.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget;
                      btn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                      btn.style.transform = 'translateY(0)';
                    }}
                  >
                    查询医院注册信息
                  </Button>
                </div>
              }
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '20px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground,
                overflow: 'hidden'
              }}
              headStyle={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: '2px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
                padding: '20px 24px'
              }}
            >
              {!loading && this.renderHospitalPieChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChartOutlined style={{ color: themeStyles.secondaryColor, fontSize: '20px' }} />
                  <span>专病种数据分布</span>
                </div>
              }
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '20px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground,
                overflow: 'hidden'
              }}
              headStyle={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: '2px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e0f0ff 100%)',
                padding: '20px 24px'
              }}
            >
              {!loading && this.renderDiseasePieChart()}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BarChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
                  <span>各家医院数据量</span>
                </div>
              }
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '20px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground,
                overflow: 'hidden'
              }}
              headStyle={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: '2px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
                padding: '20px 24px'
              }}
            >
              {!loading && (
                <>
                  {this.renderHospitalLegend()}
                  {this.renderHospitalSubmissionChart()}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DashboardPage;
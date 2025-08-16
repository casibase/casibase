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
import { Card, Row, Col, Statistic, Image } from "antd";
import ReactEcharts from "echarts-for-react";
import * as DashboardBackend from "../backend/DashboardBackend.js"

const mockData ={
    "status": "ok",
    "msg": "",
    "data": {
        "action": [

            {
                "date": "2025-08-14",
                "FieldCount": {
                    "add-application": 8,
                    "add-chat": 78,
                    "add-message": 987,
                    "add-node-tunnel": 7,
                    "add-provider": 1,
                    "add-template": 7,
                    "add-workflow": 2,
                    "delete-application": 8,
                    "delete-chat": 7,
                    "delete-template": 4,
                    "delete-workflow": 2,
                    "deploy-application": 29,
                    "generate-text-to-speech-audio": 28,
                    "signin": 152,
                    "signout": 34,
                    "undeploy-application": 4,
                    "update-application": 9,
                    "update-chat": 126,
                    "update-message": 119,
                    "update-provider": 23,
                    "update-store": 1,
                    "update-template": 6,
                    "update-workflow": 1
                }
            },
            {
                "date": "2025-08-15",
                "FieldCount": {
                    "add-application": 8,
                    "add-chat": 83,
                    "add-message": 1038,
                    "add-node-tunnel": 8,
                    "add-provider": 1,
                    "add-template": 7,
                    "add-workflow": 2,
                    "delete-application": 8,
                    "delete-chat": 7,
                    "delete-template": 4,
                    "delete-workflow": 2,
                    "deploy-application": 29,
                    "generate-text-to-speech-audio": 30,
                    "signin": 155,
                    "signout": 34,
                    "undeploy-application": 4,
                    "update-application": 9,
                    "update-chat": 126,
                    "update-message": 131,
                    "update-provider": 23,
                    "update-store": 1,
                    "update-template": 6,
                    "update-workflow": 1
                }
            },
            {
                "date": "2025-08-16",
                "FieldCount": {
                    "add-application": 8,
                    "add-chat": 83,
                    "add-message": 1057,
                    "add-node-tunnel": 8,
                    "add-provider": 1,
                    "add-template": 7,
                    "add-workflow": 2,
                    "delete-application": 8,
                    "delete-chat": 7,
                    "delete-template": 4,
                    "delete-workflow": 2,
                    "deploy-application": 29,
                    "generate-text-to-speech-audio": 30,
                    "signin": 157,
                    "signout": 34,
                    "undeploy-application": 4,
                    "update-application": 9,
                    "update-chat": 126,
                    "update-message": 132,
                    "update-provider": 23,
                    "update-store": 1,
                    "update-template": 6,
                    "update-workflow": 1
                }
            }
        ],
        "section": [
            
            {
                "date": "2025-08-14",
                "FieldCount": {
                    "呼吸外科": 95,
                    "消化内科": 157,
                    "血管外科": 118,
                    "骨科": 44
                }
            },
            {
                "date": "2025-08-15",
                "FieldCount": {
                    "呼吸外科": 95,
                    "消化内科": 157,
                    "血管外科": 118,
                    "骨科": 44
                }
            },
            {
                "date": "2025-08-16",
                "FieldCount": {
                    "呼吸外科": 95,
                    "消化内科": 157,
                    "血管外科": 118,
                    "骨科": 44
                }
            }
        ],
        "unit": [
           
            {
                "date": "2025-08-14",
                "FieldCount": {
                    "北京协和医院": 104,
                    "医大一院": 65,
                    "广东省人民医院": 120,
                    "江苏省人民医院": 91,
                    "深圳中医院": 58,
                    "第六医院": 31
                }
            },
            {
                "date": "2025-08-15",
                "FieldCount": {
                    "北京协和医院": 104,
                    "医大一院": 65,
                    "广东省人民医院": 120,
                    "江苏省人民医院": 91,
                    "深圳中医院": 58,
                    "第六医院": 31
                }
            },
            {
                "date": "2025-08-16",
                "FieldCount": {
                    "北京协和医院": 104,
                    "医大一院": 65,
                    "广东省人民医院": 120,
                    "江苏省人民医院": 91,
                    "深圳中医院": 58,
                    "第六医院": 31
                }
            }
        ]
    },
    "data2": null
}

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalRecords: 0,
      hospitals: [],
      diseases: [],
      hospitalSubmissions: {
        names: [],
        values: []
      },
      loading: true
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  // 处理数据的辅助方法
  processData = (data) => {
    // 取最后一天的数据
    const lastDayAction = data.action.length > 0 ? data.action[data.action.length - 1] : null;
    const lastDayUnit = data.unit.length > 0 ? data.unit[data.unit.length - 1] : null;
    const lastDaySection = data.section.length > 0 ? data.section[data.section.length - 1] : null;

    // 处理总就诊记录数（action的signin）
    const totalRecords = lastDayAction?.FieldCount?.["test-action"] || 0;

    // 处理医院记录数（unit）
    const hospitals = [];
    if (lastDayUnit?.FieldCount) {
      Object.entries(lastDayUnit.FieldCount).forEach(([name, value]) => {
        hospitals.push({ name, value });
      });
    }

    // 处理病种记录（使用section）
    const diseases = [];
    if (lastDaySection?.FieldCount) {
      Object.entries(lastDaySection.FieldCount).forEach(([name, value]) => {
        diseases.push({ name, value });
      });
    }

    // 处理医院提交量
    const hospitalNames = hospitals.map(item => item.name);
    const hospitalValues = hospitals.map(item => item.value);

    this.setState({
      totalRecords,
      hospitals,
      diseases,
      hospitalSubmissions: {
        names: hospitalNames,
        values: hospitalValues
      },
      loading: false
    });
  }

  fetchDashboardData = async () => {
    try {
      const response = await DashboardBackend.getDashBoardData("100","All","unit,section,action");

      if (response.status === "ok" && response.data) {
        this.processData(response.data);
      } else {
        console.error("Failed to fetch dashboard data");
        // 使用mock数据
        this.processData(mockData.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // 使用mock数据
      this.processData(mockData.data);
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
    const { hospitalSubmissions } = this.state;
    const option = {
      title: {
        text: "各家医院提交量",
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
          data: hospitalSubmissions.names,
          axisTick: {
            alignWithLabel: true
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '提交量'
        }
      ],
      series: [
        {
          name: '提交量',
          type: 'bar',
          barWidth: '60%',
          data: hospitalSubmissions.values,
          itemStyle: {
            // 从深到浅的蓝色渐变
            color: function(params) {
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

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  render() {
    const { totalRecords, loading } = this.state;

    return (
      <div className="dashboard-page">
        <h1>数据看板</h1>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="就诊记录统计总览" bordered={true} style={{ 
              height: '100%',
              backgroundImage: 'url(' + require('./hospital_back_bg.jpg') + ')',
              backgroundPosition: 'right 0px bottom -40px',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              border:"2px solid #1890ff",
              padding: '24px'
            }}>
              <div style={{ maxWidth: '60%' }}>
                <Statistic
                  title="总就诊记录数"
                  value={totalRecords}
                  valueStyle={{ fontSize: 36, color: '#1890ff' }}
                  formatter={(value) => `${(value)}`}
                  loading={loading}
                />
                {/* <p style={{ marginTop: 16 }}>按患者就诊记录统计（非身份证号）</p> */}
              </div>
            </Card>
          </Col>
          
          <Col span={24} lg={12}>
            <Card title="各家医院数据量占比" bordered={true} loading={loading}>
              {!loading && this.renderHospitalPieChart()}
            </Card>
          </Col>
          <Col span={24} lg={12}>
            <Card title="专病种数据分布" bordered={true} loading={loading}>
              {!loading && this.renderDiseasePieChart()}
            </Card>
          </Col>
          <Col span={24}>
            <Card title="各家医院提交量" bordered={true} loading={loading}>
              {!loading && this.renderHospitalSubmissionChart()}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DashboardPage;
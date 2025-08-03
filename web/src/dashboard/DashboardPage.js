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

// 模拟数据
const mockData = {
  totalRecords: 35000000, // 3500万就诊记录
  hospitals: [
    { name: '协和医院', value: 8500000 },
    { name: '同济医院', value: 7200000 },
    { name: '华西医院', value: 6800000 },
    { name: '湘雅医院', value: 5400000 },
    { name: '齐鲁医院', value: 4600000 },
    { name: '其他医院', value: 2500000 }
  ],
  diseases: [
    { name: '高血压', value: 6200000 },
    { name: '糖尿病', value: 4800000 },
    { name: '冠心病', value: 3500000 },
    { name: '脑卒中', value: 2800000 },
    { name: '肺炎', value: 2500000 },
    { name: '胃炎', value: 2100000 },
    { name: '哮喘', value: 1800000 },
    { name: '关节炎', value: 1500000 },
    { name: '抑郁症', value: 1200000 },
    { name: '其他疾病', value: 8600000 }
  ],
  hospitalSubmissions: {
    names: ['协和医院', '同济医院', '华西医院', '湘雅医院', '齐鲁医院', '其他医院'],
    values: [152000, 138000, 125000, 98000, 85000, 62000]
  }
};

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderHospitalPieChart() {
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
        data: mockData.hospitals.map(item => item.name)
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
          data: mockData.hospitals
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  renderDiseasePieChart() {
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
        data: mockData.diseases.map(item => item.name)
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
          data: mockData.diseases
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  renderHospitalSubmissionChart() {
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
          data: mockData.hospitalSubmissions.names,
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
          data: mockData.hospitalSubmissions.values,
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
                
                // 浅蓝
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
                  value={mockData.totalRecords}
                  valueStyle={{ fontSize: 36, color: '#1890ff' }}
                  formatter={(value) => `${(value / 10000).toFixed(1)}万`}
                  
                />
                {/* <p style={{ marginTop: 16 }}>按患者就诊记录统计（非身份证号）</p> */}
              </div>
              
            </Card>
            
          </Col>
         
          <Col span={24} lg={12}>
            <Card title="各家医院数据量占比" bordered={true}>
              {this.renderHospitalPieChart()}
            </Card>
          </Col>
          <Col span={24} lg={12}>
            <Card title="专病种数据分布" bordered={true}>
              {this.renderDiseasePieChart()}
            </Card>
          </Col>
          <Col span={24}>
            <Card title="各家医院提交量" bordered={true}>
              {this.renderHospitalSubmissionChart()}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DashboardPage;
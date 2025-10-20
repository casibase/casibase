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

const mockData = {
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
    "diseaseCategory": [
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
    "section": [
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
    ],
    "region": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "北京市": 120,
          "广东省": 95,
          "江苏省": 88,
          "上海市": 76,
          "浙江省": 65,
          "其他": 45
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "北京市": 125,
          "广东省": 98,
          "江苏省": 92,
          "上海市": 78,
          "浙江省": 68,
          "其他": 47
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "北京市": 130,
          "广东省": 102,
          "江苏省": 95,
          "上海市": 80,
          "浙江省": 70,
          "其他": 49
        }
      }
    ],
    "city": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "北京": 120,
          "广州": 85,
          "南京": 88,
          "上海": 76,
          "杭州": 65,
          "深圳": 45
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "北京": 125,
          "广州": 88,
          "南京": 92,
          "上海": 78,
          "杭州": 68,
          "深圳": 47
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "北京": 130,
          "广州": 92,
          "南京": 95,
          "上海": 80,
          "杭州": 70,
          "深圳": 49
        }
      }
    ],
    "client_ip": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "192.168.1.100": 45,
          "192.168.1.101": 38,
          "192.168.1.102": 32,
          "10.0.0.50": 28,
          "10.0.0.51": 25,
          "172.16.0.10": 20,
          "其他": 15
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "192.168.1.100": 48,
          "192.168.1.101": 40,
          "192.168.1.102": 35,
          "10.0.0.50": 30,
          "10.0.0.51": 27,
          "172.16.0.10": 22,
          "其他": 18
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "192.168.1.100": 50,
          "192.168.1.101": 42,
          "192.168.1.102": 38,
          "10.0.0.50": 32,
          "10.0.0.51": 29,
          "172.16.0.10": 24,
          "其他": 20
        }
      }
    ],
    "organization": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "三甲医院": 280,
          "二甲医院": 120,
          "专科医院": 85,
          "社区医院": 60
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "三甲医院": 290,
          "二甲医院": 125,
          "专科医院": 88,
          "社区医院": 62
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "三甲医院": 300,
          "二甲医院": 130,
          "专科医院": 92,
          "社区医院": 65
        }
      }
    ],
    "response": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "ok": 420,
          "error": 25,
          "warning": 15,
          "info": 5
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "ok": 435,
          "error": 20,
          "warning": 12,
          "info": 8
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "ok": 450,
          "error": 18,
          "warning": 10,
          "info": 7
        }
      }
    ],
    "user_agent": [
      {
        "date": "2025-08-14",
        "FieldCount": {
          "Chrome": 280,
          "Safari": 120,
          "Firefox": 45,
          "Edge": 20
        }
      },
      {
        "date": "2025-08-15",
        "FieldCount": {
          "Chrome": 290,
          "Safari": 125,
          "Firefox": 48,
          "Edge": 22
        }
      },
      {
        "date": "2025-08-16",
        "FieldCount": {
          "Chrome": 300,
          "Safari": 130,
          "Firefox": 50,
          "Edge": 25
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
      loading: true,
      isDarkMode: false,
      // 新增统计维度
      regions: [],
      cities: [],
      clientIps: [],
      organizations: [],
      responseStatus: [],
      actionStats: [],
      userAgents: [],
      dateTrend: []
    };
  }

  componentDidMount() {
    this.checkDarkMode();
    this.fetchDashboardData();
  }

  // 检查深色模式
  checkDarkMode = () => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

    this.setState({ isDarkMode });
  }

  // 切换主题
  toggleTheme = () => {
    const newTheme = !this.state.isDarkMode;
    this.setState({ isDarkMode: newTheme });
    localStorage.setItem('dashboard-theme', newTheme ? 'dark' : 'light');
  }

  // 处理数据的辅助方法
  processData = (data) => {
    console.log("Processing data:", data); // 调试日志

    // 安全地获取最后一天的数据
    const lastDayAction = data.action && data.action.length > 0 ? data.action[data.action.length - 1] : null;
    const lastDaySection = data.section && data.section.length > 0 ? data.section[data.section.length - 1] : null;
    const lastDayDiseaseCategory = data.diseaseCategory && data.diseaseCategory.length > 0 ? data.diseaseCategory[data.diseaseCategory.length - 1] : null;
    const lastDayRegion = data.region && data.region.length > 0 ? data.region[data.region.length - 1] : null;
    const lastDayCity = data.city && data.city.length > 0 ? data.city[data.city.length - 1] : null;
    const lastDayClientIp = data.client_ip && data.client_ip.length > 0 ? data.client_ip[data.client_ip.length - 1] : null;
    const lastDayOrganization = data.organization && data.organization.length > 0 ? data.organization[data.organization.length - 1] : null;
    const lastDayResponse = data.response && data.response.length > 0 ? data.response[data.response.length - 1] : null;
    const lastDayUserAgent = data.user_agent && data.user_agent.length > 0 ? data.user_agent[data.user_agent.length - 1] : null;

    // 处理总就诊记录数（sections各医院的和）
    // const totalRecords = lastDayAction?.FieldCount?.["test-action"] || 0;
    let totalRecords = 0;
    if (lastDaySection?.FieldCount) {
      Object.values(lastDaySection.FieldCount).forEach(value => {
        totalRecords += value;
      });
    }
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

    // 处理地区统计
    const regions = [];
    if (lastDayRegion?.FieldCount) {
      Object.entries(lastDayRegion.FieldCount).forEach(([name, value]) => {
        regions.push({ name, value });
      });
    }

    // 处理城市统计
    const cities = [];
    if (lastDayCity?.FieldCount) {
      Object.entries(lastDayCity.FieldCount).forEach(([name, value]) => {
        cities.push({ name, value });
      });
    }

    // 处理客户端IP统计
    const clientIps = [];
    if (lastDayClientIp?.FieldCount) {
      Object.entries(lastDayClientIp.FieldCount).forEach(([name, value]) => {
        clientIps.push({ name, value });
      });
    }

    // 处理组织统计
    const organizations = [];
    if (lastDayOrganization?.FieldCount) {
      Object.entries(lastDayOrganization.FieldCount).forEach(([name, value]) => {
        organizations.push({ name, value });
      });
    }

    // 处理响应状态统计
    const responseStatus = [];
    if (lastDayResponse?.FieldCount) {
      Object.entries(lastDayResponse.FieldCount).forEach(([name, value]) => {
        responseStatus.push({ name, value });
      });
    }

    // 处理操作类型统计
    const actionStats = [];
    if (lastDayAction?.FieldCount) {
      Object.entries(lastDayAction.FieldCount).forEach(([name, value]) => {
        actionStats.push({ name, value });
      });
    }

    // 处理用户代理统计
    const userAgents = [];
    if (lastDayUserAgent?.FieldCount) {
      Object.entries(lastDayUserAgent.FieldCount).forEach(([name, value]) => {
        userAgents.push({ name, value });
      });
    }

    // 处理日期趋势数据（最近7天）- 只统计医疗相关操作
    const dateTrend = [];
    if (data.section && data.section.length > 0) {
      const recentDays = data.section.slice(-7);
      recentDays.forEach(day => {
        // 使用section数据作为医疗访问趋势，而不是所有系统操作
        const totalCount = Object.values(day.FieldCount).reduce((sum, count) => sum + count, 0);
        dateTrend.push({
          date: day.date,
          value: totalCount
        });
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
      regions,
      cities,
      clientIps,
      organizations,
      responseStatus,
      actionStats,
      userAgents,
      dateTrend,
      loading: false
    });
  }

  fetchDashboardData = async () => {
    try {
      console.log("正在获取真实数据...");
      const response = await DashboardBackend.getDashBoardData("100", "All", "section,diseaseCategory,action,response,region,city,client_ip,organization,user_agent");

      console.log("API响应:", response);

      if (response.status === "ok" && response.data) {
        console.log("使用真实数据");
        this.processData(response.data);
      } else {
        console.warn("API返回数据格式异常，使用mock数据");
        this.processData(mockData.data);
      }
    } catch (error) {
      console.error("API调用失败，使用mock数据:", error);
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

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  // 渲染地区统计图
  renderRegionChart() {
    const { regions } = this.state;

    if (!regions || regions.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: "地区访问分布",
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: function (params) {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div>访问量: <span style="color: #4facfe; font-weight: bold;">${params.value}</span></div>
              <div>占比: <span style="color: #43e97b; font-weight: bold;">${params.percent}%</span></div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'vertical',
        left: 20,
        top: 'middle',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          fontSize: 12,
          color: '#666'
        },
        data: regions.map(item => item.name)
      },
      series: [
        {
          name: '地区访问量',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scale: true,
            scaleSize: 10,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333'
            }
          },
          labelLine: {
            show: false
          },
          data: regions.map((item, index) => ({
            ...item,
            itemStyle: {
              color: this.getRegionColor(index)
            }
          })),
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return Math.random() * 200;
          }
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  // 获取地区颜色
  getRegionColor = (index) => {
    const regionColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
      '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
    ];
    return regionColors[index % regionColors.length];
  }

  // 渲染客户端IP统计图
  renderClientIpChart() {
    const { clientIps } = this.state;

    if (!clientIps || clientIps.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    // 只显示前8个最常见的IP地址
    const topIps = clientIps
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: "客户端IP访问分布",
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: function (params) {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div>访问次数: <span style="color: #4facfe; font-weight: bold;">${params.value}</span></div>
              <div>占比: <span style="color: #43e97b; font-weight: bold;">${params.percent}%</span></div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'vertical',
        left: 20,
        top: 'middle',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          fontSize: 12,
          color: '#666'
        },
        data: topIps.map(item => item.name)
      },
      series: [
        {
          name: 'IP访问量',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scale: true,
            scaleSize: 10,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333'
            }
          },
          labelLine: {
            show: false
          },
          data: topIps.map((item, index) => ({
            ...item,
            itemStyle: {
              color: this.getClientIpColor(index)
            }
          })),
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return Math.random() * 200;
          }
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  // 获取客户端IP颜色
  getClientIpColor = (index) => {
    const ipColors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    return ipColors[index % ipColors.length];
  }

  // 渲染响应状态统计图
  renderResponseStatusChart() {
    const { responseStatus } = this.state;

    if (!responseStatus || responseStatus.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: "响应状态分布",
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: function (params) {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div>数量: <span style="color: #4facfe; font-weight: bold;">${params.value}</span></div>
              <div>占比: <span style="color: #43e97b; font-weight: bold;">${params.percent}%</span></div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'vertical',
        left: 20,
        top: 'middle',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          fontSize: 12,
          color: '#666'
        },
        data: responseStatus.map(item => item.name)
      },
      series: [
        {
          name: '响应状态',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scale: true,
            scaleSize: 10,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.2)'
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333'
            }
          },
          labelLine: {
            show: false
          },
          data: responseStatus.map((item, index) => ({
            ...item,
            itemStyle: {
              color: this.getResponseColor(item.name)
            }
          })),
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return Math.random() * 200;
          }
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  // 获取响应状态颜色
  getResponseColor = (status) => {
    const statusColors = {
      'ok': '#43e97b',      // 绿色 - 成功
      'error': '#ff6b6b',   // 红色 - 错误
      'warning': '#feca57', // 黄色 - 警告
      'info': '#4facfe'     // 蓝色 - 信息
    };
    return statusColors[status] || '#667eea';
  }

  // 渲染操作统计图
  renderActionStatsChart() {
    const { actionStats } = this.state;

    if (!actionStats || actionStats.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    // 只显示前10个最常见的操作类型
    const topActions = actionStats
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: "操作类型统计",
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: function (params) {
          const data = params[0];
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
              <div>操作次数: <span style="color: #4facfe; font-weight: bold;">${data.value}</span></div>
            </div>
          `;
        }
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topActions.map(item => item.name),
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 10,
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '操作次数',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      series: [
        {
          name: '操作次数',
          type: 'bar',
          barWidth: '60%',
          data: topActions.map(item => item.value),
          itemStyle: {
            color: function (params) {
              const colorList = [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
                '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
                '#00d2d3', '#ff9f43'
              ];
              return colorList[params.dataIndex % colorList.length];
            },
            borderRadius: [4, 4, 0, 0],
            shadowBlur: 5,
            shadowColor: 'rgba(0,0,0,0.1)'
          },
          animationDelay: function (idx) {
            return idx * 100;
          },
          animationEasing: 'elasticOut'
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  // 渲染日期趋势图
  renderDateTrendChart() {
    const { dateTrend } = this.state;

    if (!dateTrend || dateTrend.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: "访问趋势（最近7天）",
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: function (params) {
          const data = params[0];
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
              <div>访问量: <span style="color: #4facfe; font-weight: bold;">${data.value}</span></div>
            </div>
          `;
        }
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '8%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dateTrend.map(item => item.date),
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '访问量',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      series: [
        {
          name: '访问量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#667eea',
            width: 3
          },
          itemStyle: {
            color: '#667eea',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
                { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
              ]
            }
          },
          data: dateTrend.map(item => item.value),
          animationDelay: function (idx) {
            return idx * 100;
          },
          animationEasing: 'elasticOut'
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }

  render() {
    const { totalRecords, loading, isDarkMode } = this.state;

    const themeStyles = {
      background: isDarkMode
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      cardBackground: isDarkMode ? '#2c3e50' : '#fff',
      textColor: isDarkMode ? '#ecf0f1' : '#2c3e50',
      subTextColor: isDarkMode ? '#bdc3c7' : '#7f8c8d',
      cardShadow: isDarkMode
        ? '0 8px 32px rgba(0,0,0,0.3)'
        : '0 8px 32px rgba(0,0,0,0.1)'
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
          marginBottom: '32px',
          position: 'relative'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: themeStyles.textColor,
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            可信共享数据总览
          </h1>
          <p style={{
            fontSize: '16px',
            color: themeStyles.subTextColor,
            marginTop: '8px',
            marginBottom: 0
          }}>
            医疗数据统计分析与可视化展示
          </p>

          {/* 主题切换按钮 */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0
          }}>
            <button
              onClick={this.toggleTheme}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 20px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }}
            >
              {isDarkMode ? '🌙' : '☀️'} {isDarkMode ? '深色模式' : '浅色模式'}
            </button>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* 总览卡片 */}
          <Col span={24}>
            <Card
              title="就诊记录统计总览"
              bordered={false}
              style={{
                height: '100%',
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(44, 62, 80, 0.9) 0%, rgba(52, 73, 94, 0.9) 100%), url("./hospital_back_bg.jpg")'
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), url("./hospital_back_bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '16px',
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
                  value={totalRecords}
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
                  📊 按患者就诊记录统计（非索引编号）
                </div>
              </div>
            </Card>
          </Col>

          {/* 基础统计图表 */}
          <Col span={24} lg={12}>
            <Card
              title="各家医院数据量占比"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderHospitalPieChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title="专病种数据分布"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderDiseasePieChart()}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title="各家医院提交量"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderHospitalSubmissionChart()}
            </Card>
          </Col>

          {/* 新增统计图表 */}
          <Col span={24}>
            <Card
              title="访问趋势分析"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderDateTrendChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title="客户端IP访问分布"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderClientIpChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title="响应状态统计"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderResponseStatusChart()}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title="操作类型统计"
              bordered={false}
              loading={loading}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground
              }}
              headStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: isDarkMode ? '2px solid #34495e' : '2px solid #f0f0f0'
              }}
            >
              {!loading && this.renderActionStatsChart()}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DashboardPage;

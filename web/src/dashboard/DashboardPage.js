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
import { Card, Row, Col, Statistic, DatePicker, Select, Button, Space, Typography } from "antd";
import { CalendarOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';
import ReactEcharts from "echarts-for-react";
import * as DashboardBackend from "../backend/DashboardBackend.js"
import hospitalBg from "./hospital_back_bg.jpg";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;


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
      // 新增统计维度
      regions: [],
      cities: [],
      clientIps: [],
      organizations: [],
      responseStatus: [],
      actionStats: [],
      userAgents: [],
      dateTrend: [],
      // 时间选择相关
      dateRange: null,
      trendDays: 15,
      allData: null
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  // 处理趋势数据
  processTrendData = (data) => {
    const { dateRange, trendDays } = this.state;
    const dateTrend = [];

    if (data.section && data.section.length > 0) {
      let filteredDays = data.section;

      // 如果选择了日期范围，则过滤数据
      if (dateRange && dateRange.length === 2) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        filteredDays = data.section.filter(day =>
          day.date >= startDate && day.date <= endDate
        );
      } else {
        // 否则使用最近N天的数据
        filteredDays = data.section.slice(-trendDays);
      }

      let previousTotal = 0;
      filteredDays.forEach((day, index) => {
        const currentTotal = Object.values(day.FieldCount).reduce((sum, count) => sum + count, 0);
        const growth = index === 0 ? currentTotal : currentTotal - previousTotal;
        dateTrend.push({
          date: day.date,
          value: growth
        });
        previousTotal = currentTotal;
      });
    }

    return dateTrend;
  }

  // 处理日期范围变化
  handleDateRangeChange = (dates) => {
    this.setState({ dateRange: dates }, () => {
      if (this.state.allData) {
        this.updateTrendData();
      }
    });
  }

  // 处理天数选择变化
  handleTrendDaysChange = (days) => {
    this.setState({ trendDays: days, dateRange: null }, () => {
      if (this.state.allData) {
        this.updateTrendData();
      }
    });
  }

  // 更新趋势数据
  updateTrendData = () => {
    const { allData } = this.state;
    if (allData) {
      const dateTrend = this.processTrendData(allData);
      this.setState({ dateTrend });
    }
  }

  // 处理数据的辅助方法
  processData = (data) => {
    console.log("Processing data:", data); // 调试日志

    // 保存原始数据
    this.setState({ allData: data });

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

    // 处理日期趋势数据 - 根据选择的时间范围计算数据增长量
    const dateTrend = this.processTrendData(data);

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
        console.error("API返回数据格式异常:", response);
        this.setState({
          loading: false,
          totalRecords: 0,
          hospitals: [],
          diseases: [],
          hospitalSubmissions: { names: [], values: [] },
          regions: [],
          cities: [],
          clientIps: [],
          organizations: [],
          responseStatus: [],
          actionStats: [],
          userAgents: [],
          dateTrend: []
        });
      }
    } catch (error) {
      console.error("API调用失败:", error);
      this.setState({
        loading: false,
        totalRecords: 0,
        hospitals: [],
        diseases: [],
        hospitalSubmissions: { names: [], values: [] },
        regions: [],
        cities: [],
        clientIps: [],
        organizations: [],
        responseStatus: [],
        actionStats: [],
        userAgents: [],
        dateTrend: []
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
    const { dateTrend, dateRange, trendDays } = this.state;

    if (!dateTrend || dateTrend.length === 0) {
      return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        暂无数据
      </div>;
    }

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: dateRange && dateRange.length === 2
          ? `访问趋势（${dateRange[0].format('MM-DD')} 至 ${dateRange[1].format('MM-DD')} 数据增长量）`
          : `访问趋势（最近${trendDays}天数据增长量）`,
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
              <div>数据增长量: <span style="color: #4facfe; font-weight: bold;">${data.value}</span></div>
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
        name: '数据增长量',
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
          name: '数据增长量',
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
    const { totalRecords, loading, dateRange, trendDays } = this.state;

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
          {/* 功能入口卡片 */}
          <Col span={24}>
            <Card
              title="卫生健康数据可信共享链平台"
              bordered={false}
              style={{
                borderRadius: '16px',
                boxShadow: themeStyles.cardShadow,
                border: 'none',
                background: themeStyles.cardBackground,
              }}
              headStyle={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeStyles.textColor,
                borderBottom: '2px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
                padding: '16px 20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ color: themeStyles.subTextColor, fontSize: 16 }}>
                  卫生健康数据可信共享链平台，请点击卡片进入各子功能。
                </div>
                <Space>
                  <Button type="primary" size="large" onClick={() => this.props.history.push('/med-records')}>
                    病例数据录入
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
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
                  📊 按患者就诊记录统计
                </div>
              </div>
            </Card>
          </Col>

          {/* 基础统计图表 */}
          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
                  <span>各家医院数据量占比</span>
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
                  <span>各家医院提交量</span>
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
              {!loading && this.renderHospitalSubmissionChart()}
            </Card>
          </Col>

          {/* 访问趋势分析 */}
          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LineChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
                  <span>访问趋势分析</span>
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
              extra={
                <Space size="middle">
                  <Select
                    value={trendDays}
                    onChange={this.handleTrendDaysChange}
                    style={{ width: 120 }}
                    placeholder="选择天数"
                    suffixIcon={<CalendarOutlined />}
                  >
                    <Option value={7}>最近7天</Option>
                    <Option value={15}>最近15天</Option>
                    <Option value={30}>最近30天</Option>
                    <Option value={60}>最近60天</Option>
                  </Select>
                  <RangePicker
                    value={dateRange}
                    onChange={this.handleDateRangeChange}
                    style={{ width: 240 }}
                    placeholder={['开始日期', '结束日期']}
                    suffixIcon={<CalendarOutlined />}
                  />
                </Space>
              }
            >
              {!loading && this.renderDateTrendChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChartOutlined style={{ color: '#ff6b6b', fontSize: '20px' }} />
                  <span>客户端IP访问分布</span>
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
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
                padding: '20px 24px'
              }}
            >
              {!loading && this.renderClientIpChart()}
            </Card>
          </Col>

          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChartOutlined style={{ color: '#4ecdc4', fontSize: '20px' }} />
                  <span>响应状态统计</span>
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
                background: 'linear-gradient(135deg, #f0fffe 0%, #e0fffe 100%)',
                padding: '20px 24px'
              }}
            >
              {!loading && this.renderResponseStatusChart()}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BarChartOutlined style={{ color: '#feca57', fontSize: '20px' }} />
                  <span>操作类型统计</span>
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
                background: 'linear-gradient(135deg, #fffbf0 0%, #fff8e0 100%)',
                padding: '20px 24px'
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
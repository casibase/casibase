// // Copyright 2023 The Casibase Authors. All Rights Reserved.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //      http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// import React, { Component } from "react";
// import { Card, Row, Col, Typography, Statistic, Tag, Button } from "antd";
// import { BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
// import ReactEcharts from "echarts-for-react";
// import * as DashboardBackend from "../backend/DashboardBackend.js"
// import hospitalBg from "./hospital_back_bg.jpg";

// const { Title, Text } = Typography;
// const { CheckableTag } = Tag;


// class DashboardPage extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       hospitals: [],
//       diseases: [],
//       hospitalSubmissions: {
//         names: [],
//         values: []
//       },
//       totalRecords: 0,
//       loading: true,
//       selectedHospitals: []
//     };

//     this.hospitalLinkRules = [
//       {
//         keywords: ["江苏省人民医院"],
//         url: "https://www.jsph.org.cn/sy.htm"
//       },
//       {
//         keywords: ["中国医科大学附属第一医院"],
//         url: "https://www.cmu1h.com/home"
//       },
//       {
//         keywords: ["广东省人民医院"],
//         url: "https://www.gdghospital.org.cn/"
//       },
//       {
//         keywords: ["深圳市中医院"],
//         url: "https://www.szszyy.cn/"
//       }
//     ];
//   }

//   componentDidMount() {
//     this.fetchDashboardData();
//   }

//   // 处理数据的辅助方法
//   processData = (data) => {
//     console.log("Processing data:", data); // 调试日志

//     // 安全地获取最后一天的数据
//     const lastDaySection = data.section && data.section.length > 0 ? data.section[data.section.length - 1] : null;
//     const lastDayDiseaseCategory = data.diseaseCategory && data.diseaseCategory.length > 0 ? data.diseaseCategory[data.diseaseCategory.length - 1] : null;

//     // 处理医院记录数（section）
//     const hospitals = [];
//     if (lastDaySection?.FieldCount) {
//       Object.entries(lastDaySection.FieldCount).forEach(([name, value]) => {
//         hospitals.push({ name, value });
//       });
//     }

//     // 处理病种记录
//     const diseases = [];
//     if (lastDayDiseaseCategory?.FieldCount) {
//       Object.entries(lastDayDiseaseCategory.FieldCount).forEach(([name, value]) => {
//         diseases.push({ name, value });
//       });
//     }

//     // 处理医院提交量
//     const hospitalNames = hospitals.map(item => item.name);
//     const hospitalValues = hospitals.map(item => item.value);

//     // 计算总记录数
//     const totalRecords = hospitalValues.reduce((sum, value) => sum + value, 0);

//     const prevSelected = this.state.selectedHospitals || [];
//     const selectedHospitals = prevSelected.filter(name => hospitalNames.includes(name));
//     const nextSelectedHospitals = selectedHospitals.length > 0 ? selectedHospitals : hospitalNames;

//     this.setState({
//       hospitals,
//       diseases,
//       hospitalSubmissions: {
//         names: hospitalNames,
//         values: hospitalValues
//       },
//       totalRecords,
//       loading: false,
//       selectedHospitals: nextSelectedHospitals
//     });
//   }

//   resolveHospitalUrl = (name = "") => {
//     const sanitized = (name || "").trim();
//     for (const rule of this.hospitalLinkRules) {
//       if (rule.keywords.some(keyword => sanitized.includes(keyword))) {
//         return rule.url;
//       }
//     }
//     return null;
//   };

//   handleHospitalLegendToggle = (hospitalName, checked) => {
//     this.setState(prevState => {
//       const allHospitalNames = prevState.hospitals.map(item => item.name);
//       const nextSelection = new Set(prevState.selectedHospitals);

//       if (checked) {
//         nextSelection.add(hospitalName);
//       } else {
//         nextSelection.delete(hospitalName);
//       }

//       if (nextSelection.size === 0) {
//         allHospitalNames.forEach(name => nextSelection.add(name));
//       }

//       return { selectedHospitals: Array.from(nextSelection) };
//     });
//   };

//   renderHospitalLegend() {
//     const { hospitals, selectedHospitals } = this.state;
//     if (!hospitals || hospitals.length === 0) {
//       return null;
//     }

//     // return (
//     //   <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

//     //     {hospitals.map(hospital => (
//     //       <CheckableTag
//     //         key={hospital.name}
//     //         checked={selectedHospitals.includes(hospital.name)}
//     //         onChange={checked => this.handleHospitalLegendToggle(hospital.name, checked)}
//     //       >
//     //         {hospital.name}
//     //       </CheckableTag>
//     //     ))}
//     //   </div>
//     // );
//   }

//   // JavaScript
//   // 将原有 fetchDashboardData 注释后，使用写死的数据替代
//   // 原始实现（注释保留）
//   // fetchDashboardData = async () => {
//   //   try {
//   //     console.log("正在获取真实数据...");
//   //     const response = await DashboardBackend.getDashBoardData("100", "All", "section,diseaseCategory");

//   //     console.log("API响应:", response);

//   //     if (response.status === "ok" && response.data) {
//   //       console.log("使用真实数据");
//   //       this.processData(response.data);
//   //     } else {
//   //       console.error("API返回数据格式异常:", response);
//   //       this.setState({
//   //         loading: false,
//   //         hospitals: [],
//   //         diseases: [],
//   //         hospitalSubmissions: { names: [], values: [] },
//   //         totalRecords: 0
//   //       });
//   //     }
//   //   } catch (error) {
//   //     console.error("API调用失败:", error);
//   //     this.setState({
//   //       loading: false,
//   //       hospitals: [],
//   //       diseases: [],
//   //       hospitalSubmissions: { names: [], values: [] },
//   //       totalRecords: 0
//   //     });
//   //   }
//   // }

//   fetchDashboardData = () => {
//     const mockData = {
//       "diseaseCategory": [{
//       "date": "2025-11-19",
//       "FieldCount": {
//       "肺结节": 44400,
//       "围关节骨折及畸形": 28657,
//       "冠心病": 14212,
//       "膝髋骨关节炎": 9754,
//       "结直肠癌": 9177,
//       "脊柱退行性疾病": 8616,
//       "胃肠间质瘤": 7941,
//       "胃癌": 3046,
//       "纵隔肿瘤": 2875,
//       "垂体瘤": 2718,
//       "颈椎病": 2122,
//       "食管肿瘤": 1824,
//       "急性缺血性脑卒中": 1453,
//       "头颈部肿瘤": 1232,
//       "脊柱脊髓损伤": 1028,
//       "心搏骤停": 990,
//       "消化胆胰疾病": 4350,
//       "冠心病多支病变": 4039,
//       "淋系肿瘤": 26693,
//       "乳腺癌外科": 54230,
//       "甲状腺肿瘤手术治疗": 16986,
//       "胰腺中心": 28614,
//       "胸腺专病": 0,
//       "胃肠间质瘤": 7941,
//       "胸外科": 546,
//       "肺病科": 4708,
//       "肝病科": 22159,
//       "血液病科": 16107,
//       "皮肤科": 8411,
//       "眼科": 1436,
//       "胸部X光数据集": 78468,
//       "视网膜平学扫描数据集": 97477,
//       "组织病理学数据集": 23640
//       }
//     }],
//       "section": [{
//         "date": "2025-11-19",
//         "FieldCount": {
//           "中国医科大学附属第一医院": 11151732,
//           "广东省人民医院": 11928642,
//           "江苏省人民医院": 12290105,
//           "深圳市中医院": 5273523,
//           "协和医院": 2921,
//           "中保科联/上海市医保中心":303
//         }
//       }]
//     };

//     this.processData(mockData);
//   };

//   renderHospitalPieChart() {
//     const { hospitals, totalRecords } = this.state;

//     const option = {
//       tooltip: {
//         trigger: 'item',
//         formatter: '{a} <br/>{b}: {c} ({d}%)'
//       },
//       legend: {
//         orient: 'horizontal',
//         top: 'top',
//         left: 'center',
//         data: hospitals.map(item => item.name),
//         textStyle: {
//           fontSize: 15,
//           fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
//           color: '#2c3e50'
//         },
//         itemGap: 20,
//         itemWidth: 14,
//         itemHeight: 14
//       },
//       series: [
//         {
//           name: '医院数据量',
//           type: 'pie',
//           radius: ['30%', '60%'],
//           center: ['50%', '55%'],
//           avoidLabelOverlap: true,
//           animationType: 'scale',
//           animationEasing: 'elasticOut',
//           animationDelay: function (idx) {
//             return Math.random() * 200;
//           },
//           itemStyle: {
//             borderRadius: 10,
//             borderColor: '#fff',
//             borderWidth: 2
//           },
//           label: {
//             show: true,
//             position: 'outside',
//             formatter: function(params) {
//               const percent = params.percent.toFixed(1);
//               const value = params.value.toLocaleString();
//               return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
//             },
//             rich: {
//               name: {
//                 fontSize: 13,
//                 fontWeight: 'normal',
//                 color: '#2c3e50',
//                 padding: [2, 0]
//               },
//               value: {
//                 fontSize: 13,
//                 fontWeight: 'normal',
//                 color: '#667eea',
//                 padding: [2, 0]
//               },
//               percent: {
//                 fontSize: 12,
//                 color: '#7f8c8d',
//                 padding: [2, 0]
//               }
//             },
//             fontSize: 12
//           },
//           labelLine: {
//             show: true,
//             length: 20,
//             length2: 15,
//             lineStyle: {
//               color: '#667eea',
//               width: 2,
//               type: 'solid',
//               shadowBlur: 3,
//               shadowColor: 'rgba(102, 126, 234, 0.3)'
//             },
//             smooth: 0.3
//           },
//           emphasis: {
//             itemStyle: {
//               shadowBlur: 20,
//               shadowOffsetX: 0,
//               shadowColor: 'rgba(0, 0, 0, 0.5)'
//             },
//             label: {
//               show: true,
//               formatter: function(params) {
//                 const percent = params.percent.toFixed(1);
//                 const value = params.value.toLocaleString();
//                 return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
//               },
//               rich: {
//                 name: {
//                   fontSize: 15,
//                   fontWeight: 'bold',
//                   color: '#1a1a1a',
//                   padding: [2, 0]
//                 },
//                 value: {
//                   fontSize: 15,
//                   fontWeight: 'bold',
//                   color: '#667eea',
//                   padding: [2, 0]
//                 },
//                 percent: {
//                   fontSize: 14,
//                   fontWeight: 'bold',
//                   color: '#667eea',
//                   padding: [2, 0]
//                 }
//               }
//             },
//             labelLine: {
//               show: true,
//               lineStyle: {
//                 width: 3,
//                 color: '#667eea'
//               }
//             },
//             scale: true,
//             scaleSize: 5
//           },
//           data: hospitals
//         }
//       ]
//     };

//     return <ReactEcharts option={option} style={{ height: '850px' }} />;
//   }

//   renderDiseasePieChart() {
//     const { diseases } = this.state;

//     const option = {
//       tooltip: {
//         trigger: 'item',
//         backgroundColor: 'rgba(255, 255, 255, 0.98)',
//         borderColor: '#764ba2',
//         borderWidth: 2,
//         textStyle: {
//           color: '#333',
//           fontSize: 14,
//           fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//         },
//         padding: [12, 16],
//         extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
//         formatter: '{a} <br/>{b}: <span style="font-weight: bold; color: #764ba2;">{c}条</span> ({d}%)'
//       },
//       legend: {
//         orient: 'horizontal',
//         top: 'top',
//         left: 'center',
//         data: diseases.map(item => item.name),
//         textStyle: {
//           fontSize: 15,
//           fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
//           color: '#2c3e50'
//         },
//         itemGap: 20,
//         itemWidth: 14,
//         itemHeight: 14
//       },
//       series: [
//         {
//           name: '病种数据量',
//           type: 'pie',
//           radius: ['30%', '60%'],
//           center: ['50%', '55%'],
//           avoidLabelOverlap: true,
//           animationType: 'scale',
//           animationEasing: 'elasticOut',
//           animationDelay: function (idx) {
//             return Math.random() * 200;
//           },
//           itemStyle: {
//             borderRadius: 10,
//             borderColor: '#fff',
//             borderWidth: 2
//           },
//           label: {
//             show: true,
//             position: 'outside',
//             formatter: function(params) {
//               const percent = params.percent.toFixed(1);
//               const value = params.value.toLocaleString();
//               return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
//             },
//             rich: {
//               name: {
//                 fontSize: 13,
//                 fontWeight: 'normal',
//                 color: '#2c3e50',
//                 padding: [2, 0]
//               },
//               value: {
//                 fontSize: 13,
//                 fontWeight: 'normal',
//                 color: '#667eea',
//                 padding: [2, 0]
//               },
//               percent: {
//                 fontSize: 12,
//                 color: '#7f8c8d',
//                 padding: [2, 0]
//               }
//             },
//             fontSize: 12
//           },
//           labelLine: {
//             show: true,
//             length: 20,
//             length2: 15,
//             lineStyle: {
//               color: '#667eea',
//               width: 2,
//               type: 'solid',
//               shadowBlur: 3,
//               shadowColor: 'rgba(102, 126, 234, 0.3)'
//             },
//             smooth: 0.3
//           },
//           emphasis: {
//             itemStyle: {
//               shadowBlur: 20,
//               shadowOffsetX: 0,
//               shadowColor: 'rgba(0, 0, 0, 0.5)'
//             },
//             label: {
//               show: true,
//               formatter: function(params) {
//                 const percent = params.percent.toFixed(1);
//                 const value = params.value.toLocaleString();
//                 return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
//               },
//               rich: {
//                 name: {
//                   fontSize: 15,
//                   fontWeight: 'bold',
//                   color: '#1a1a1a',
//                   padding: [2, 0]
//                 },
//                 value: {
//                   fontSize: 15,
//                   fontWeight: 'bold',
//                   color: '#667eea',
//                   padding: [2, 0]
//                 },
//                 percent: {
//                   fontSize: 14,
//                   fontWeight: 'bold',
//                   color: '#667eea',
//                   padding: [2, 0]
//                 }
//               }
//             },
//             labelLine: {
//               show: true,
//               lineStyle: {
//                 width: 3,
//                 color: '#667eea'
//               }
//             },
//             scale: true,
//             scaleSize: 5
//           },
//           data: diseases
//         }
//       ]
//     };

//     return <ReactEcharts option={option} style={{ height: '850px' }} />;
//   }

//   renderHospitalSubmissionChart() {
//     const { hospitals, selectedHospitals } = this.state;
//     const activeHospitals = (hospitals || []).filter(item => selectedHospitals.includes(item.name));
//     const categoryNames = activeHospitals.map(item => item.name);
//     const categoryValues = activeHospitals.map(item => item.value);

//     // 计算数据的最大值和最小值，用于颜色映射
//     const maxValue = Math.max(...categoryValues);
//     const minValue = Math.min(...categoryValues);
//     const valueRange = maxValue - minValue;

//     const onEvents = {
//       click: params => {
//         const url = this.resolveHospitalUrl(params.name);
//         if (url) {
//           window.open(url, "_blank", "noopener,noreferrer");
//         }
//       }
//     };

//     const option = {
//       tooltip: {
//         trigger: 'axis',
//         axisPointer: {
//           type: 'shadow',
//           shadowStyle: {
//             color: 'rgba(102, 126, 234, 0.1)'
//           }
//         },
//         backgroundColor: 'rgba(255, 255, 255, 0.98)',
//         borderColor: '#667eea',
//         borderWidth: 2,
//         textStyle: {
//           color: '#333',
//           fontSize: 14,
//           fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//         },
//         padding: [12, 16],
//         extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
//         formatter: function(params) {
//           const param = params[0];
//           return `${param.name}<br/><span style="font-weight: bold; color: #667eea;">${param.value.toLocaleString()}条</span>`;
//         }
//       },
//       grid: {
//         left: '3%',
//         right: '4%',
//         bottom: '3%',
//         top: '10%',
//         containLabel: true
//       },
//       xAxis: [
//         {
//           type: 'category',
//           data: categoryNames,
//           axisTick: {
//             alignWithLabel: true
//           },
//           axisLabel: {
//             interval: 0,
//             rotate: 26,
//             color: '#243B53',
//             fontSize: 14,
//             fontWeight: 500,
//             lineHeight: 20,
//             margin: 18,
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
//             formatter: value => {
//               if (value.length <= 8) {
//                 return value;
//               }
//               const segments = value.match(/.{1,8}/g) || [value];
//               return segments.join("\n");
//             }
//           }
//         }
//       ],
//       yAxis: [
//         {
//           type: 'value',
//           name: '数据量',
//           nameTextStyle: {
//             fontSize: 14,
//             fontWeight: 'bold',
//             color: '#2c3e50',
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//           },
//           axisLabel: {
//             fontSize: 13,
//             color: '#7f8c8d',
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//           }
//         }
//       ],
//       series: [
//         {
//           name: '数据量',
//           type: 'bar',
//           barWidth: '60%',
//           animationDuration: 1000,
//           animationEasing: 'cubicOut',
//           data: categoryValues,
//           label: {
//             show: true,
//             position: 'top',
//             formatter: function(params) {
//               return params.value.toLocaleString();
//             },
//             fontSize: 14,
//             fontWeight: 'bold',
//             color: '#2c3e50',
//             offset: [0, -5],
//             textStyle: {
//               fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//             }
//           },
//           itemStyle: {
//             // 从深到浅的蓝色渐变，颜色深浅与数据量相关
//             color: function (params) {
//               const colorList = [
//                 '#364fc7',  // 深蓝（数据量最大）
//                 '#3b5bdb',
//                 '#1971c2',
//                 '#1c7ed6',
//                 '#228be6',
//                 "#339af0",
//                 "#4dabf7",
//                 "#74c0fc"   // 浅蓝（数据量最小）
//               ];

//               // 如果只有一个数据点或所有值相同，使用最深的颜色
//               if (valueRange === 0) {
//                 return colorList[0];
//               }

//               // 计算当前值在范围内的比例（0-1），值越大比例越大
//               const ratio = (params.value - minValue) / valueRange;

//               // 根据比例选择颜色索引，值越大索引越小（颜色越深）
//               const colorIndex = Math.floor((1 - ratio) * (colorList.length - 1));

//               return colorList[Math.max(0, Math.min(colorIndex, colorList.length - 1))];
//             },
//             borderRadius: [4, 4, 0, 0]
//           },
//           emphasis: {
//             itemStyle: {
//               shadowBlur: 10,
//               shadowColor: 'rgba(0, 0, 0, 0.3)',
//               shadowOffsetY: 3
//             },
//             label: {
//               fontSize: 16,
//               color: '#667eea'
//             }
//           },
//         }
//       ]
//     };

//     return <ReactEcharts option={option} onEvents={onEvents} style={{ height: '400px' }} />;
//   }

//   renderDiseaseBarChart() {
//     const { diseases } = this.state;
//     const diseaseNames = diseases.map(item => item.name);
//     const diseaseValues = diseases.map(item => item.value);

//     // 计算数据的最大值和最小值，用于颜色映射
//     const maxValue = Math.max(...diseaseValues);
//     const minValue = Math.min(...diseaseValues);
//     const valueRange = maxValue - minValue;

//     const option = {
//       tooltip: {
//         trigger: 'axis',
//         axisPointer: {
//           type: 'shadow',
//           shadowStyle: {
//             color: 'rgba(118, 75, 162, 0.1)'
//           }
//         },
//         backgroundColor: 'rgba(255, 255, 255, 0.98)',
//         borderColor: '#764ba2',
//         borderWidth: 2,
//         textStyle: {
//           color: '#333',
//           fontSize: 14,
//           fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//         },
//         padding: [12, 16],
//         extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
//         formatter: function(params) {
//           const param = params[0];
//           return `${param.name}<br/><span style="font-weight: bold; color: #764ba2;">${param.value.toLocaleString()}条</span>`;
//         }
//       },
//       grid: {
//         left: '3%',
//         right: '4%',
//         bottom: '3%',
//         top: '10%',
//         containLabel: true
//       },
//       xAxis: [
//         {
//           type: 'category',
//           data: diseaseNames,
//           axisTick: {
//             alignWithLabel: true
//           },
//           axisLabel: {
//             interval: 0,
//             rotate: 26,
//             color: '#243B53',
//             fontSize: 14,
//             fontWeight: 500,
//             lineHeight: 20,
//             margin: 18,
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
//             formatter: value => {
//               if (value.length <= 8) {
//                 return value;
//               }
//               const segments = value.match(/.{1,8}/g) || [value];
//               return segments.join("\n");
//             }
//           }
//         }
//       ],
//       yAxis: [
//         {
//           type: 'value',
//           name: '数据量',
//           nameTextStyle: {
//             fontSize: 14,
//             fontWeight: 'bold',
//             color: '#2c3e50',
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//           },
//           axisLabel: {
//             fontSize: 13,
//             color: '#7f8c8d',
//             fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//           },
//           axisLine: {
//             lineStyle: {
//               color: '#e0e0e0',
//               width: 1
//             }
//           },
//           splitLine: {
//             lineStyle: {
//               color: '#f0f0f0',
//               type: 'dashed',
//               width: 1
//             }
//           }
//         }
//       ],
//       series: [
//         {
//           name: '数据量',
//           type: 'bar',
//           barWidth: '60%',
//           animationDuration: 1000,
//           animationEasing: 'cubicOut',
//           data: diseaseValues,
//           label: {
//             show: true,
//             position: 'top',
//             formatter: function(params) {
//               return params.value.toLocaleString();
//             },
//             fontSize: 14,
//             fontWeight: 'bold',
//             color: '#2c3e50',
//             offset: [0, -5],
//             textStyle: {
//               fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
//             }
//           },
//           itemStyle: {
//             // 从深到浅的蓝色渐变，颜色深浅与数据量相关
//             color: function (params) {
//               const colorList = [
//                 '#364fc7',  // 深蓝（数据量最大）
//                 '#3b5bdb',
//                 '#1971c2',
//                 '#1c7ed6',
//                 '#228be6',
//                 "#339af0",
//                 "#4dabf7",
//                 "#74c0fc"   // 浅蓝（数据量最小）
//               ];

//               // 如果只有一个数据点或所有值相同，使用最深的颜色
//               if (valueRange === 0) {
//                 return colorList[0];
//               }

//               // 计算当前值在范围内的比例（0-1），值越大比例越大
//               const ratio = (params.value - minValue) / valueRange;

//               // 根据比例选择颜色索引，值越大索引越小（颜色越深）
//               const colorIndex = Math.floor((1 - ratio) * (colorList.length - 1));

//               return colorList[Math.max(0, Math.min(colorIndex, colorList.length - 1))];
//             },
//             borderRadius: [4, 4, 0, 0]
//           },
//           emphasis: {
//             itemStyle: {
//               shadowBlur: 10,
//               shadowColor: 'rgba(0, 0, 0, 0.3)',
//               shadowOffsetY: 3
//             },
//             label: {
//               fontSize: 16,
//               color: '#667eea'
//             }
//           },
//         }
//       ]
//     };

//     return <ReactEcharts option={option} style={{ height: '400px' }} />;
//   }

//   render() {
//     const { loading } = this.state;

//     const themeStyles = {
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       cardBackground: '#fff',
//       textColor: '#2c3e50',
//       subTextColor: '#7f8c8d',
//       cardShadow: '0 12px 40px rgba(0,0,0,0.15)',
//       primaryColor: '#667eea',
//       secondaryColor: '#764ba2'
//     };

//     return (
//       <div className="dashboard-page" style={{
//         padding: '24px',
//         background: themeStyles.background,
//         minHeight: '100vh',
//         transition: 'all 0.3s ease'
//       }}>
//         <div style={{
//           textAlign: 'center',
//           marginBottom: '40px',
//           position: 'relative'
//         }}>
//           <Title level={1} style={{
//             color: '#fff',
//             margin: 0,
//             fontSize: '42px',
//             fontWeight: 'bold',
//             textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
//             background: 'linear-gradient(45deg, #fff, #f0f8ff)',
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent',
//             backgroundClip: 'text'
//           }}>
//             可信共享数据总览
//           </Title>
//           <Text style={{
//             fontSize: '18px',
//             color: 'rgba(255,255,255,0.9)',
//             marginTop: '12px',
//             display: 'block',
//             textShadow: '1px 1px 4px rgba(0,0,0,0.2)'
//           }}>
//             📊 医疗数据统计分析与可视化展示
//           </Text>
//         </div>

//         <Row gutter={[24, 24]}>
//           {/* 总览卡片 */}
//           <Col span={24}>
//             <Card
//               title="就诊记录统计总览"
//               bordered={false}
//               style={{
//                 height: '100%',
//                 background: `linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%), url(${hospitalBg})`,
//                 backgroundSize: 'auto 80%',
//                 backgroundPosition: 'right bottom',
//                 backgroundRepeat: 'no-repeat',
//                 borderRadius: '20px',
//                 boxShadow: themeStyles.cardShadow,
//                 border: 'none',
//                 overflow: 'hidden',
//                 position: 'relative'
//               }}
//               headStyle={{
//                 background: 'rgba(255,255,255,0.1)',
//                 borderBottom: '1px solid rgba(255,255,255,0.2)',
//                 color: '#fff',
//                 fontSize: '18px',
//                 fontWeight: 'bold'
//               }}
//               bodyStyle={{
//                 padding: '32px'
//               }}
//             >
//               <div style={{
//                 maxWidth: '60%',
//                 color: '#fff',
//                 position: 'relative',
//                 zIndex: 1,
//                 background: 'rgba(0,0,0,0.1)',
//                 padding: '20px',
//                 borderRadius: '12px',
//                 backdropFilter: 'blur(5px)'
//               }}>
//                 <Statistic
//                   title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>总就诊记录数</span>}
//                   value={this.state.totalRecords}
//                   valueStyle={{
//                     fontSize: '48px',
//                     color: '#fff',
//                     fontWeight: 'bold',
//                     textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
//                   }}
//                   formatter={(value) => `${(value).toLocaleString()}`}
//                   loading={loading}
//                 />
//                 <div style={{
//                   marginTop: '16px',
//                   padding: '12px 16px',
//                   background: 'rgba(255,255,255,0.1)',
//                   borderRadius: '8px',
//                   fontSize: '14px',
//                   color: 'rgba(255,255,255,0.8)'
//                 }}>
//                   📊 按患者就诊记录统计
//                 </div>
//               </div>
//             </Card>
//           </Col>

//           {/* 基础统计图表 */}
//           <Col span={24} lg={12}>
//             <Card
//               title={
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                     <PieChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
//                     <span>各家医院数据量占比</span>
//                   </div>
//                   <Button
//                     type="default"
//                     size="small"
//                     onClick={() => window.open('https://zgcx.nhc.gov.cn/unit', '_blank', 'noopener,noreferrer')}
//                     style={{
//                       background: `linear-gradient(135deg, ${themeStyles.primaryColor} 0%, ${themeStyles.secondaryColor} 100%)`,
//                       color: '#fff',
//                       fontWeight: '500',
//                       fontSize: '14px',
//                       border: 'none',
//                       borderRadius: '6px',
//                       padding: '4px 16px',
//                       height: 'auto',
//                       boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
//                       transition: 'all 0.3s ease',
//                       cursor: 'pointer'
//                     }}
//                     onMouseEnter={(e) => {
//                       const btn = e.currentTarget;
//                       btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
//                       btn.style.transform = 'translateY(-1px)';
//                     }}
//                     onMouseLeave={(e) => {
//                       const btn = e.currentTarget;
//                       btn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
//                       btn.style.transform = 'translateY(0)';
//                     }}
//                   >
//                     医疗机构信息
//                   </Button>
//                 </div>
//               }
//               bordered={false}
//               loading={loading}
//               style={{
//                 borderRadius: '20px',
//                 boxShadow: themeStyles.cardShadow,
//                 border: 'none',
//                 background: themeStyles.cardBackground,
//                 overflow: 'hidden'
//               }}
//               headStyle={{
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 color: themeStyles.textColor,
//                 borderBottom: '2px solid #f0f0f0',
//                 background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
//                 padding: '20px 24px',
//                 borderRadius: '20px 20px 0 0'
//               }}
//               bodyStyle={{
//                 padding: '24px',
//                 background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
//               }}
//             >
//               {!loading && this.renderHospitalPieChart()}
//             </Card>
//           </Col>

//           <Col span={24} lg={12}>
//             <Card
//               title={
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <PieChartOutlined style={{ color: themeStyles.secondaryColor, fontSize: '20px' }} />
//                   <span>专病种数据分布</span>
//                 </div>
//               }
//               bordered={false}
//               loading={loading}
//               style={{
//                 borderRadius: '20px',
//                 boxShadow: themeStyles.cardShadow,
//                 border: 'none',
//                 background: themeStyles.cardBackground,
//                 overflow: 'hidden'
//               }}
//               headStyle={{
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 color: themeStyles.textColor,
//                 borderBottom: '2px solid #f0f0f0',
//                 background: 'linear-gradient(135deg, #f0f8ff 0%, #e0f0ff 100%)',
//                 padding: '20px 24px',
//                 borderRadius: '20px 20px 0 0'
//               }}
//               bodyStyle={{
//                 padding: '24px',
//                 background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
//               }}
//             >
//               {!loading && this.renderDiseasePieChart()}
//             </Card>
//           </Col>

//           <Col span={24}>
//             <Card
//               title={
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <BarChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
//                   <span>各家医院数据量</span>
//                 </div>
//               }
//               bordered={false}
//               loading={loading}
//               style={{
//                 borderRadius: '20px',
//                 boxShadow: themeStyles.cardShadow,
//                 border: 'none',
//                 background: themeStyles.cardBackground,
//                 overflow: 'hidden'
//               }}
//               headStyle={{
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 color: themeStyles.textColor,
//                 borderBottom: '2px solid #f0f0f0',
//                 background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
//                 padding: '20px 24px',
//                 borderRadius: '20px 20px 0 0'
//               }}
//               bodyStyle={{
//                 padding: '24px',
//                 background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
//               }}
//             >
//               {!loading && (
//                 <>
//                   {this.renderHospitalLegend()}
//                   {this.renderHospitalSubmissionChart()}
//                 </>
//               )}
//             </Card>
//           </Col>

//           <Col span={24}>
//             <Card
//               title={
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <BarChartOutlined style={{ color: themeStyles.secondaryColor, fontSize: '20px' }} />
//                   <span>专病种数据量</span>
//                 </div>
//               }
//               bordered={false}
//               loading={loading}
//               style={{
//                 borderRadius: '20px',
//                 boxShadow: themeStyles.cardShadow,
//                 border: 'none',
//                 background: themeStyles.cardBackground,
//                 overflow: 'hidden'
//               }}
//               headStyle={{
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 color: themeStyles.textColor,
//                 borderBottom: '2px solid #f0f0f0',
//                 background: 'linear-gradient(135deg, #f0f8ff 0%, #e0f0ff 100%)',
//                 padding: '20px 24px',
//                 borderRadius: '20px 20px 0 0'
//               }}
//               bodyStyle={{
//                 padding: '24px',
//                 background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
//               }}
//             >
//               {!loading && this.renderDiseaseBarChart()}
//             </Card>
//           </Col>
//         </Row>
//       </div>
//     );
//   }
// }

// export default DashboardPage;
import React, { Component } from "react";
import { Card, Row, Col, Typography, Statistic, Tag, Button } from "antd";
import { BarChartOutlined, PieChartOutlined, DatabaseOutlined } from '@ant-design/icons';
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
  }

  fetchDashboardData = () => {
    const mockData = {
      "diseaseCategory": [{
        "date": "2025-11-19",
        "FieldCount": {
          "肺结节": 44400,
          "围关节骨折及畸形": 28657,
          "冠心病": 14212,
          "膝髋骨关节炎": 9754,
          "结直肠癌": 9177,
          "脊柱退行性疾病": 8616,
          "胃肠间质瘤": 7941,
          "胃癌": 3046,
          "纵隔肿瘤": 2875,
          "垂体瘤": 2718,
          "颈椎病": 2122,
          "食管肿瘤": 1824,
          "急性缺血性脑卒中": 1453,
          "头颈部肿瘤": 1232,
          "脊柱脊髓损伤": 1028,
          "心搏骤停": 990,
          "消化胆胰疾病": 4350,
          "冠心病多支病变": 4039,
          "淋系肿瘤": 26693,
          "乳腺癌外科": 54230,
          "甲状腺肿瘤手术治疗": 16986,
          "胰腺中心": 28614,
          "胸腺专病": 0,
          "胃肠间质瘤": 7941,
          "胸外科": 546,
          "肺病科": 4708,
          "肝病科": 22159,
          "血液病科": 16107,
          "皮肤科": 8411,
          "眼科": 1436,
          "胸部X光数据集": 78468,
          "视网膜平学扫描数据集": 97477,
          "组织病理学数据集": 23640
        }
      }],
      "section": [{
        "date": "2025-11-19",
        "FieldCount": {
          "中国医科大学附属第一医院": 11151732,
          "广东省人民医院": 11928642,
          "江苏省人民医院": 12290105,
          "深圳市中医院": 5273523,
          "协和医院": 2921,
          "中保科联/上海市医保中心": 303
        }
      }]
    };

    this.processData(mockData);
  };

  renderHospitalPieChart() {
    const { hospitals, totalRecords } = this.state;

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        top: 'top',
        left: 'center',
        data: hospitals.map(item => item.name),
        textStyle: {
          fontSize: 15,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          color: '#2c3e50'
        },
        itemGap: 20,
        itemWidth: 14,
        itemHeight: 14
      },
      series: [
        {
          name: '医院数据量',
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: true,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return Math.random() * 200;
          },
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: function (params) {
              const percent = params.percent.toFixed(1);
              const value = params.value.toLocaleString();
              return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
            },
            rich: {
              name: {
                fontSize: 13,
                fontWeight: 'normal',
                color: '#2c3e50',
                padding: [2, 0]
              },
              value: {
                fontSize: 13,
                fontWeight: 'normal',
                color: '#667eea',
                padding: [2, 0]
              },
              percent: {
                fontSize: 12,
                color: '#7f8c8d',
                padding: [2, 0]
              }
            },
            fontSize: 12
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 15,
            lineStyle: {
              color: '#667eea',
              width: 2,
              type: 'solid',
              shadowBlur: 3,
              shadowColor: 'rgba(102, 126, 234, 0.3)'
            },
            smooth: 0.3
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: {
              show: true,
              formatter: function (params) {
                const percent = params.percent.toFixed(1);
                const value = params.value.toLocaleString();
                return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
              },
              rich: {
                name: {
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  padding: [2, 0]
                },
                value: {
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#667eea',
                  padding: [2, 0]
                },
                percent: {
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#667eea',
                  padding: [2, 0]
                }
              }
            },
            labelLine: {
              show: true,
              lineStyle: {
                width: 3,
                color: '#667eea'
              }
            },
            scale: true,
            scaleSize: 5
          },
          data: hospitals
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '850px' }} />;
  }

  renderDiseasePieChart() {
    const { diseases } = this.state;

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#764ba2',
        borderWidth: 2,
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
        formatter: '{a} <br/>{b}: <span style="font-weight: bold; color: #764ba2;">{c}条</span> ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        top: 'top',
        left: 'center',
        data: diseases.map(item => item.name),
        textStyle: {
          fontSize: 15,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          color: '#2c3e50'
        },
        itemGap: 20,
        itemWidth: 14,
        itemHeight: 14
      },
      series: [
        {
          name: '病种数据量',
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: true,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return Math.random() * 200;
          },
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: function (params) {
              const percent = params.percent.toFixed(1);
              const value = params.value.toLocaleString();
              return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
            },
            rich: {
              name: {
                fontSize: 13,
                fontWeight: 'normal',
                color: '#2c3e50',
                padding: [2, 0]
              },
              value: {
                fontSize: 13,
                fontWeight: 'normal',
                color: '#667eea',
                padding: [2, 0]
              },
              percent: {
                fontSize: 12,
                color: '#7f8c8d',
                padding: [2, 0]
              }
            },
            fontSize: 12
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 15,
            lineStyle: {
              color: '#667eea',
              width: 2,
              type: 'solid',
              shadowBlur: 3,
              shadowColor: 'rgba(102, 126, 234, 0.3)'
            },
            smooth: 0.3
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: {
              show: true,
              formatter: function (params) {
                const percent = params.percent.toFixed(1);
                const value = params.value.toLocaleString();
                return `{name|${params.name}}\n{value|${value}条} {percent|(${percent}%)}`;
              },
              rich: {
                name: {
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  padding: [2, 0]
                },
                value: {
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#667eea',
                  padding: [2, 0]
                },
                percent: {
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#667eea',
                  padding: [2, 0]
                }
              }
            },
            labelLine: {
              show: true,
              lineStyle: {
                width: 3,
                color: '#667eea'
              }
            },
            scale: true,
            scaleSize: 5
          },
          data: diseases
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '850px' }} />;
  }

  // --- 新增：数据容量饼图渲染方法 ---
  renderDataCapacityPieChart() {
    const dataCapacity = [
      { name: "江苏省人民医院", value: 2.8 },
      { name: "广东省人民医院", value: 1.94143 },
      { name: "中国医科大学附属第一医院", value: 1.0264 },
      { name: "深圳市中医院", value: 0.0065 },
      { name: "协和医院", value: 0.0596 },
      { name: "示范应用中心", value: 0.00238 }
    ];

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#667eea', // 使用主色调
        borderWidth: 2,
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
        formatter: '{a} <br/>{b}: <span style="font-weight: bold; color: #667eea;">{c}P</span> ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        top: 'top',
        left: 'center',
        data: dataCapacity.map(item => item.name),
        textStyle: {
          fontSize: 14,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          color: '#2c3e50'
        },
        itemGap: 15
      },
      series: [
        {
          name: '数据容量',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '60%'], // 稍微下移以适应图例
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{c}P ({d}%)',
            fontSize: 13,
            color: '#2c3e50'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 15,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: dataCapacity
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
  }
  // ---------------------------------

  renderHospitalSubmissionChart() {
    const { hospitals, selectedHospitals } = this.state;
    const activeHospitals = (hospitals || []).filter(item => selectedHospitals.includes(item.name));
    const categoryNames = activeHospitals.map(item => item.name);
    const categoryValues = activeHospitals.map(item => item.value);

    // 计算数据的最大值和最小值，用于颜色映射
    const maxValue = Math.max(...categoryValues);
    const minValue = Math.min(...categoryValues);
    const valueRange = maxValue - minValue;

    const onEvents = {
      click: params => {
        const url = this.resolveHospitalUrl(params.name);
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    };

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(102, 126, 234, 0.1)'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#667eea',
        borderWidth: 2,
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
        formatter: function (params) {
          const param = params[0];
          return `${param.name}<br/><span style="font-weight: bold; color: #667eea;">${param.value.toLocaleString()}条</span>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
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
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 20,
            margin: 18,
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
          name: '数据量',
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
          },
          axisLabel: {
            fontSize: 13,
            color: '#7f8c8d',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
          }
        }
      ],
      series: [
        {
          name: '数据量',
          type: 'bar',
          barWidth: '60%',
          animationDuration: 1000,
          animationEasing: 'cubicOut',
          data: categoryValues,
          label: {
            show: true,
            position: 'top',
            formatter: function (params) {
              return params.value.toLocaleString();
            },
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50',
            offset: [0, -5],
            textStyle: {
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
            }
          },
          itemStyle: {
            // 从深到浅的蓝色渐变，颜色深浅与数据量相关
            color: function (params) {
              const colorList = [
                '#364fc7',  // 深蓝（数据量最大）
                '#3b5bdb',
                '#1971c2',
                '#1c7ed6',
                '#228be6',
                "#339af0",
                "#4dabf7",
                "#74c0fc"   // 浅蓝（数据量最小）
              ];

              // 如果只有一个数据点或所有值相同，使用最深的颜色
              if (valueRange === 0) {
                return colorList[0];
              }

              // 计算当前值在范围内的比例（0-1），值越大比例越大
              const ratio = (params.value - minValue) / valueRange;

              // 根据比例选择颜色索引，值越大索引越小（颜色越深）
              const colorIndex = Math.floor((1 - ratio) * (colorList.length - 1));

              return colorList[Math.max(0, Math.min(colorIndex, colorList.length - 1))];
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowOffsetY: 3
            },
            label: {
              fontSize: 16,
              color: '#667eea'
            }
          },
        }
      ]
    };

    return <ReactEcharts option={option} onEvents={onEvents} style={{ height: '400px' }} />;
  }

  renderDiseaseBarChart() {
    const { diseases } = this.state;
    const diseaseNames = diseases.map(item => item.name);
    const diseaseValues = diseases.map(item => item.value);

    // 计算数据的最大值和最小值，用于颜色映射
    const maxValue = Math.max(...diseaseValues);
    const minValue = Math.min(...diseaseValues);
    const valueRange = maxValue - minValue;

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(118, 75, 162, 0.1)'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#764ba2',
        borderWidth: 2,
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
        },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px;',
        formatter: function (params) {
          const param = params[0];
          return `${param.name}<br/><span style="font-weight: bold; color: #764ba2;">${param.value.toLocaleString()}条</span>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: diseaseNames,
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            interval: 0,
            rotate: 26,
            color: '#243B53',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 20,
            margin: 18,
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
          name: '数据量',
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
          },
          axisLabel: {
            fontSize: 13,
            color: '#7f8c8d',
            fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
          },
          axisLine: {
            lineStyle: {
              color: '#e0e0e0',
              width: 1
            }
          },
          splitLine: {
            lineStyle: {
              color: '#f0f0f0',
              type: 'dashed',
              width: 1
            }
          }
        }
      ],
      series: [
        {
          name: '数据量',
          type: 'bar',
          barWidth: '60%',
          animationDuration: 1000,
          animationEasing: 'cubicOut',
          data: diseaseValues,
          label: {
            show: true,
            position: 'top',
            formatter: function (params) {
              return params.value.toLocaleString();
            },
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50',
            offset: [0, -5],
            textStyle: {
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
            }
          },
          itemStyle: {
            // 从深到浅的蓝色渐变，颜色深浅与数据量相关
            color: function (params) {
              const colorList = [
                '#364fc7',  // 深蓝（数据量最大）
                '#3b5bdb',
                '#1971c2',
                '#1c7ed6',
                '#228be6',
                "#339af0",
                "#4dabf7",
                "#74c0fc"   // 浅蓝（数据量最小）
              ];

              // 如果只有一个数据点或所有值相同，使用最深的颜色
              if (valueRange === 0) {
                return colorList[0];
              }

              // 计算当前值在范围内的比例（0-1），值越大比例越大
              const ratio = (params.value - minValue) / valueRange;

              // 根据比例选择颜色索引，值越大索引越小（颜色越深）
              const colorIndex = Math.floor((1 - ratio) * (colorList.length - 1));

              return colorList[Math.max(0, Math.min(colorIndex, colorList.length - 1))];
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowOffsetY: 3
            },
            label: {
              fontSize: 16,
              color: '#667eea'
            }
          },
        }
      ]
    };

    return <ReactEcharts option={option} style={{ height: '400px' }} />;
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
                    医疗机构信息
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
                padding: '20px 24px',
                borderRadius: '20px 20px 0 0'
              }}
              bodyStyle={{
                padding: '24px',
                background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
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
                padding: '20px 24px',
                borderRadius: '20px 20px 0 0'
              }}
              bodyStyle={{
                padding: '24px',
                background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
              }}
            >
              {!loading && this.renderDiseasePieChart()}
            </Card>
          </Col>

          {/* 新增：数据容量展示卡片 */}
          <Col span={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChartOutlined style={{ color: themeStyles.primaryColor, fontSize: '20px' }} />
                  <span>各机构数据容量</span>
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
                padding: '20px 24px',
                borderRadius: '20px 20px 0 0'
              }}
              bodyStyle={{
                padding: '24px',
                background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
              }}
            >
              {!loading && this.renderDataCapacityPieChart()}
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
                padding: '20px 24px',
                borderRadius: '20px 20px 0 0'
              }}
              bodyStyle={{
                padding: '24px',
                background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
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

          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BarChartOutlined style={{ color: themeStyles.secondaryColor, fontSize: '20px' }} />
                  <span>专病种数据量</span>
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
                padding: '20px 24px',
                borderRadius: '20px 20px 0 0'
              }}
              bodyStyle={{
                padding: '24px',
                background: 'linear-gradient(to bottom, #fafbff, #ffffff)'
              }}
            >
              {!loading && this.renderDiseaseBarChart()}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DashboardPage;

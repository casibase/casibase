// Copyright 2024 The casbin Authors. All Rights Reserved.
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
import {Button, Col, Radio, Row, Select, Statistic} from "antd";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as UsageBackend from "./backend/UsageBackend";
import ReactEcharts from "echarts-for-react";
import * as Conf from "./Conf";
import i18next from "i18next";

const {Option} = Select;

class UsagePage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      usages: null,
      rangeUsages: null,
      usageMetadata: null,
      rangeType: "All",
      endpoint: this.getHost(),
    };
  }

  UNSAFE_componentWillMount() {
    this.getUsages("");
  }

  getHost() {
    let res = window.location.host;
    if (res === "localhost:13001") {
      res = "localhost:14000";
    }
    return res;
  }

  getUsages(serverUrl) {
    UsageBackend.getUsages(serverUrl, 30)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            usages: res.data,
            usageMetadata: res.data2,
          });
        } else {
          Setting.showMessage("error", `Failed to get usages: ${res.msg}`);
        }
      });
  }

  getRangeUsages(serverUrl, rangeType) {
    UsageBackend.getRangeUsages(serverUrl, rangeType, 30)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            rangeUsages: res.data,
            usageMetadata: res.data2,
          });
        } else {
          Setting.showMessage("error", `Failed to get usages: ${res.msg}`);
        }
      });
  }

  renderLeftChart(usages) {
    const dates = usages.map(usage => usage.date);
    const userCounts = usages.map(usage => usage.userCount);
    const chatCounts = usages.map(usage => usage.chatCount);

    const leftOption = {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: [i18next.t("general:Users"), i18next.t("general:Chats")],
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      grid: {
        left: "10%",
        right: "10%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
      },
      yAxis: [
        {
          type: "value",
          name: i18next.t("general:Users"),
          position: "left",
        },
        {
          type: "value",
          name: i18next.t("general:Chats"),
          position: "right",
        },
      ],
      series: [
        {
          name: i18next.t("general:Users"),
          type: "line",
          data: userCounts,
        },
        {
          name: i18next.t("general:Chats"),
          type: "line",
          yAxisIndex: 1,
          data: chatCounts,
        },
      ],
    };

    return <ReactEcharts option={leftOption} style={{height: "400px", width: "48%", display: "inline-block"}} />;
  }

  renderRightChart(usages) {
    const dates = usages.map(usage => usage.date);
    const messageCounts = usages.map(usage => usage.messageCount);
    const tokenCounts = usages.map(usage => usage.tokenCount);
    const prices = usages.map(usage => usage.price);

    const rightOption = {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: [i18next.t("general:Messages"), i18next.t("general:Tokens"), i18next.t("chat:Price")],
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      grid: {
        left: "10%",
        right: "10%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
      },
      yAxis: [
        {
          type: "value",
          name: i18next.t("general:Messages"),
          position: "left",
        },
        {
          type: "value",
          name: i18next.t("general:Tokens"),
          position: "right",
        },
        {
          type: "value",
          name: i18next.t("chat:Price"),
          position: "right",
          offset: 100,
        },
      ],
      series: [
        {
          name: i18next.t("general:Messages"),
          type: "line",
          data: messageCounts,
        },
        {
          name: i18next.t("general:Tokens"),
          type: "line",
          yAxisIndex: 1,
          data: tokenCounts,
        },
        {
          name: i18next.t("chat:Price"),
          type: "line",
          yAxisIndex: 2,
          data: prices,
        },
      ],
    };

    if (this.props.account.name !== "admin") {
      rightOption.legend.data = rightOption.legend.data.filter(item => item !== i18next.t("chat:Price"));
      rightOption.yAxis = rightOption.yAxis.filter(yAxis => yAxis.name !== i18next.t("chat:Price"));
      rightOption.series = rightOption.series.filter(series => series.name !== i18next.t("chat:Price"));
    }

    return <ReactEcharts option={rightOption} style={{height: "400px", width: "48%", display: "inline-block"}} />;
  }

  renderStatistic(usages) {
    if (this.state.usages === null) {
      return null;
    }

    const lastUsage = usages && usages.length > 0 ? usages[usages.length - 1] : {
      userCount: 0,
      chatCount: 0,
      messageCount: 0,
      tokenCount: 0,
      price: 0,
      currency: "USD",
    };

    return (
      <Row gutter={16}>
        {
          this.props.account.name !== "admin" ? <Col span={6} /> : (
            <React.Fragment>
              <Col span={3}>
                <Statistic title={i18next.t("task:Application")} value={this.state.usageMetadata.application} />
              </Col>
            </React.Fragment>
          )
        }
        <Col span={3}>
          <Statistic title={i18next.t("general:Users")} value={lastUsage.userCount} />
        </Col>
        <Col span={3}>
          <Statistic title={i18next.t("general:Chats")} value={lastUsage.chatCount} />
        </Col>
        <Col span={3}>
          <Statistic title={i18next.t("general:Messages")} value={lastUsage.messageCount} />
        </Col>
        <Col span={3}>
          <Statistic title={i18next.t("general:Tokens")} value={lastUsage.tokenCount} />
        </Col>
        {
          this.props.account.name !== "admin" ? null : (
            <React.Fragment>
              <Col span={3}>
                <Statistic title={i18next.t("chat:Price")} value={lastUsage.price} prefix={lastUsage.currency && "$"} />
              </Col>
              {
                Conf.DefaultLanguage === "en" ? null : (
                  <React.Fragment>
                    <Col span={3}>
                      <Statistic title={i18next.t("chat:CPrice")} value={parseFloat((lastUsage.price * 7.2).toFixed(2))} prefix={"￥"} />
                    </Col>
                    <Col span={3}>
                      <Statistic title={i18next.t("chat:FPrice")} value={parseFloat((lastUsage.price * 7.2 * 5).toFixed(2))} prefix={"￥"} />
                    </Col>
                  </React.Fragment>
                )
              }
            </React.Fragment>
          )
        }
      </Row>
    );
  }

  getServerUrlFromEndpoint(endpoint) {
    if (endpoint === "localhost:14000") {
      return `http://${endpoint}`;
    } else {
      return `https://${endpoint}`;
    }
  }

  getUsagesForAllCases(endpoint, rangeType) {
    if (endpoint === "") {
      endpoint = this.state.endpoint;
    }
    const serverUrl = this.getServerUrlFromEndpoint(endpoint);

    if (rangeType === "") {
      rangeType = this.state.rangeType;
    }

    if (rangeType === "All") {
      this.getUsages(serverUrl);
    } else {
      this.getRangeUsages(serverUrl, rangeType);
    }
  }

  renderSelect() {
    if (Conf.UsageEndpoints.length === 0 || this.props.account.name !== "admin") {
      return null;
    }

    return (
      <div style={{marginBottom: "10px", float: "right"}}>
        <Radio.Group style={{marginBottom: "10px"}} buttonStyle="solid" value={this.state.rangeType} onChange={e => {
          const rangeType = e.target.value;
          this.setState({
            rangeType: rangeType,
          });

          this.getUsagesForAllCases("", rangeType);
        }}>
          <Radio.Button value={"All"}>{i18next.t("usage:All")}</Radio.Button>
          <Radio.Button value={"Hour"}>{i18next.t("usage:Hour")}</Radio.Button>
          <Radio.Button value={"Day"}>{i18next.t("usage:Day")}</Radio.Button>
          <Radio.Button value={"Week"}>{i18next.t("usage:Week")}</Radio.Button>
          <Radio.Button value={"Month"}>{i18next.t("usage:Month")}</Radio.Button>
        </Radio.Group>
        <br />
        <Select virtual={false} listHeight={320} style={{width: "280px", marginRight: "10px"}} value={this.state.endpoint} onChange={(value => {
          const endpoint = value;
          this.setState({
            endpoint: endpoint,
          });

          this.getUsagesForAllCases(endpoint, "");
        })}>
          {
            Conf.UsageEndpoints.map((item, index) => <Option key={index} value={item.id}>{`${item.name} (${item.id})`}</Option>)
          }
        </Select>
        <Button disabled={this.getHost() === this.state.endpoint} type="primary" onClick={() => Setting.openLink(`https://${this.state.endpoint}`)}>{i18next.t("usage:Go")}</Button>
      </div>
    );
  }

  formatDate(date, rangeType) {
    switch (rangeType) {
    case "Hour":
      return date;
    case "Day":
      return date;
    case "Week":
      return date;
    case "Month":
      return date.slice(0, 7);
    default:
      return date;
    }
  }

  generateChartOptions(xData, leftYData, rightYData, leftYName, rightYName) {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999",
          },
        },
      },
      legend: {
        data: [leftYName, rightYName],
      },
      xAxis: [
        {
          type: "category",
          data: xData,
          axisPointer: {
            type: "shadow",
          },
        },
      ],
      yAxis: [
        {
          type: "value",
          name: leftYName,
          position: "left",
        },
        {
          type: "value",
          name: rightYName,
          position: "right",
        },
      ],
      series: [
        {
          name: leftYName,
          type: "line",
          yAxisIndex: 0,
          data: leftYData,
        },
        {
          name: rightYName,
          type: "line",
          yAxisIndex: 1,
          data: rightYData,
        },
      ],
    };
  }

  renderLeftRangeChart(usages) {
    const rangeType = this.state.rangeType;
    const xData = usages.map(usage => this.formatDate(usage.date, rangeType));
    const userCountData = usages.map(usage => usage.userCount);
    const chatCountData = usages.map(usage => usage.chatCount);

    const options = this.generateChartOptions(xData, userCountData, chatCountData, "User", "Chat");

    return <ReactEcharts option={options} style={{height: "400px", width: "100%"}} />;
  }

  renderRightRangeChart(usages) {
    const rangeType = this.state.rangeType;
    const xData = usages.map(usage => this.formatDate(usage.date, rangeType));
    const messageCountData = usages.map(usage => usage.messageCount);
    const tokenCountData = usages.map(usage => usage.tokenCount);

    const options = this.generateChartOptions(xData, messageCountData, tokenCountData, "Message", "Token");

    return <ReactEcharts option={options} style={{height: "400px", width: "100%"}} />;
  }

  renderChart() {
    if (this.state.rangeType === "All") {
      if (this.state.usages === null) {
        return null;
      }

      return (
        <React.Fragment>
          {this.renderLeftChart(this.state.usages)}
          {this.renderRightChart(this.state.usages)}
        </React.Fragment>
      );
    } else {
      if (this.state.rangeUsages === null) {
        return null;
      }

      return (
        <React.Fragment>
          {this.renderLeftRangeChart(this.state.rangeUsages)}
          {this.renderRightRangeChart(this.state.rangeUsages)}
        </React.Fragment>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderSelect()}
        {this.renderStatistic(this.state.usages)}
        <br />
        <br />
        {this.renderChart()}
      </div>
    );
  }
}

export default UsagePage;

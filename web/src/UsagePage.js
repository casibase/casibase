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
import {Col, Row, Statistic} from "antd";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as UsageBackend from "./backend/UsageBackend";
import ReactEcharts from "echarts-for-react";
import * as Conf from "./Conf";

class UsagePage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      usages: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getUsages();
  }

  getUsages() {
    UsageBackend.getUsages(30)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            usages: res.data,
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
        data: ["User Count", "Chat Count"],
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
          name: "User Count",
          position: "left",
        },
        {
          type: "value",
          name: "Chat Count",
          position: "right",
        },
      ],
      series: [
        {
          name: "User Count",
          type: "line",
          data: userCounts,
        },
        {
          name: "Chat Count",
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
        data: ["Message Count", "Token Count", "Price"],
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
          name: "Message Count",
          position: "left",
        },
        {
          type: "value",
          name: "Token Count",
          position: "right",
        },
        {
          type: "value",
          name: "Price",
          position: "right",
          offset: 100,
        },
      ],
      series: [
        {
          name: "Message Count",
          type: "line",
          data: messageCounts,
        },
        {
          name: "Token Count",
          type: "line",
          yAxisIndex: 1,
          data: tokenCounts,
        },
        {
          name: "Price",
          type: "line",
          yAxisIndex: 2,
          data: prices,
        },
      ],
    };

    if (this.props.account.name !== "admin") {
      rightOption.legend.data = rightOption.legend.data.filter(item => item !== "Price");
      rightOption.yAxis = rightOption.yAxis.filter(yAxis => yAxis.name !== "Price");
      rightOption.series = rightOption.series.filter(series => series.name !== "Price");
    }

    return <ReactEcharts option={rightOption} style={{height: "400px", width: "48%", display: "inline-block"}} />;
  }

  renderStatistic(usages) {
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
        <Col span={1} />
        <Col span={3}>
          <Statistic title="User Count" value={lastUsage.userCount} />
        </Col>
        <Col span={3}>
          <Statistic title="Chat Count" value={lastUsage.chatCount} />
        </Col>
        <Col span={3}>
          <Statistic title="Message Count" value={lastUsage.messageCount} />
        </Col>
        <Col span={3}>
          <Statistic title="Token Count" value={lastUsage.tokenCount} />
        </Col>
        {
          this.props.account.name !== "admin" ? null : (
            <React.Fragment>
              <Col span={3}>
                <Statistic title="Price" value={lastUsage.price} prefix={lastUsage.currency && "$"} />
              </Col>
              {
                Conf.DefaultLanguage === "en" ? null : (
                  <React.Fragment>
                    <Col span={3}>
                      <Statistic title="CPrice" value={lastUsage.price * 7.2} prefix={"￥"} />
                    </Col>
                    <Col span={3}>
                      <Statistic title="FPrice" value={lastUsage.price * 7.2 * 5} prefix={"￥"} />
                    </Col>
                  </React.Fragment>
                )
              }
            </React.Fragment>
          )
        }
        <Col span={1} />
      </Row>
    );
  }

  render() {
    if (this.state.usages === null) {
      return null;
    }

    return (
      <div>
        {this.renderStatistic(this.state.usages)}
        <br />
        <br />
        {this.renderLeftChart(this.state.usages)}
        {this.renderRightChart(this.state.usages)}
      </div>
    );
  }
}

export default UsagePage;

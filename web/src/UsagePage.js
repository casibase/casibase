// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import UsageTable from "./UsageTable";

const {Option} = Select;

class UsagePage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      usages: null,
      usageMetadata: null,
      rangeType: "All",
      endpoint: this.getHost(),
      users: ["All"],
      selectedUser: "All",
      userTableInfo: null,
      selectedTableInfo: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getUsers("");
  }

  getHost() {
    let res = window.location.host;
    if (res === "localhost:13001") {
      res = "localhost:14000";
    }
    return res;
  }

  getUsages(serverUrl) {
    UsageBackend.getUsages(serverUrl, this.state.selectedUser, 30)
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

  getCountFromRangeType(rangeType) {
    if (rangeType === "Hour") {
      return 72;
    } else if (rangeType === "Day") {
      return 30;
    } else if (rangeType === "Week") {
      return 16;
    } else if (rangeType === "Month") {
      return 12;
    } else {
      return 30;
    }
  }

  getRangeUsagesAll(serverUrl) {
    this.getRangeUsages(serverUrl, "Hour");
    this.getRangeUsages(serverUrl, "Day");
    this.getRangeUsages(serverUrl, "Week");
    this.getRangeUsages(serverUrl, "Month");
  }

  updateTableInfo(user) {
    if (user === "All") {
      this.state.selectedTableInfo = this.state.userTableInfo;
    } else {
      this.state.selectedTableInfo = this.state.userTableInfo.filter(item => item.user === this.state.users[user]);
    }
  }

  getUsers(serverUrl) {
    UsageBackend.getUsers(serverUrl, this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            users: res.data,
          }, () => {
            this.getUsages("");
            this.getRangeUsagesAll("");
            this.getUserTableInfos("");
          }
          );
          this.state.selectedUser = !(this.props.account.name === "admin" || this.props.account.type === "chat-admin") ? res.data[0] : "All";
        } else {
          Setting.showMessage("error", `Failed to get users: ${res.msg}`);
        }
      });
  }
  getRangeUsages(serverUrl, rangeType) {
    const count = this.getCountFromRangeType(rangeType);
    UsageBackend.getRangeUsages(serverUrl, rangeType, count, this.state.selectedUser)
      .then((res) => {
        if (res.status === "ok") {
          const state = {};
          state[`rangeUsages${rangeType}`] = res.data;
          this.setState(state);
        } else {
          Setting.showMessage("error", `Failed to get usages: ${res.msg}`);
        }
      });
  }
  getUserTableInfos(serverUrl) {
    UsageBackend.getUserTableInfos(serverUrl, this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            userTableInfo: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get userTableInfo: ${res.msg}`);
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

    return leftOption;
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
          offset: 60,
          axisLabel: {
            margin: 2,
          },
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

    return rightOption;
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

    const isLoading = this.state.usages === null;

    return (
      <Row gutter={16}>
        {
          this.props.account.name !== "admin" ? <Col span={6} /> : (
            <React.Fragment>
              <Col span={3}>
                <Statistic
                  loading={isLoading}
                  title={i18next.t("task:Application")}
                  value={this.state.usageMetadata?.application}
                />
              </Col>
            </React.Fragment>
          )
        }
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Users")}
            value={lastUsage.userCount}
          />
        </Col>
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Chats")}
            value={lastUsage.chatCount}
          />
        </Col>
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Messages")}
            value={lastUsage.messageCount}
          />
        </Col>
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Tokens")}
            value={lastUsage.tokenCount}
          />
        </Col>
        {
          this.props.account.name !== "admin" ? null : (
            <React.Fragment>
              <Col span={3}>
                <Statistic
                  loading={isLoading}
                  title={i18next.t("chat:Price")}
                  value={lastUsage.price}
                  prefix={lastUsage.currency && "$"}
                />
              </Col>
              {
                Conf.DefaultLanguage === "en" ? null : (
                  <React.Fragment>
                    <Col span={3}>
                      <Statistic
                        loading={isLoading}
                        title={i18next.t("chat:CPrice")}
                        value={parseFloat((lastUsage.price * 7.2).toFixed(2))}
                        prefix={"￥"}
                      />
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
    this.getRangeUsagesAll(serverUrl);
    this.getUsages(serverUrl);
    // if (rangeType === "All") {
    //   this.getUsages(serverUrl);
    // } else {
    //   this.getRangeUsagesAll(serverUrl);
    // }
  }

  renderRadio() {
    return (
      <div style={{marginTop: "-10px", float: "right"}}>
        {this.renderDropdown()}
        <Radio.Group style={{marginBottom: "10px"}} buttonStyle="solid" value={this.state.rangeType} onChange={e => {
          const rangeType = e.target.value;
          this.setState({
            rangeType: rangeType,
          }
          );
        }}>
          <Radio.Button value={"All"}>{i18next.t("usage:All")}</Radio.Button>
          <Radio.Button value={"Hour"}>{i18next.t("usage:Hour")}</Radio.Button>
          <Radio.Button value={"Day"}>{i18next.t("usage:Day")}</Radio.Button>
          <Radio.Button value={"Week"}>{i18next.t("usage:Week")}</Radio.Button>
          <Radio.Button value={"Month"}>{i18next.t("usage:Month")}</Radio.Button>
        </Radio.Group>
        {this.renderSelect()}
      </div>
    );
  }

  renderSelect() {
    if (Conf.UsageEndpoints.length === 0 || this.props.account.name !== "admin") {
      return null;
    }

    return (
      <React.Fragment>
        <br />
        <Select virtual={false} listHeight={360} style={{width: "280px", marginRight: "10px"}}
          value={this.state.endpoint} onChange={(value => {
            const endpoint = value;
            this.setState({
              endpoint: endpoint,
            });

            this.getUsagesForAllCases(endpoint, "");
          })}>
          {
            Conf.UsageEndpoints.map((item, index) => <Option key={index}
              value={item.id}>{`${item.name} (${item.id})`}</Option>)
          }
        </Select>
        <Button disabled={this.getHost() === this.state.endpoint} type="primary" onClick={() => Setting.openLink(`https://${this.state.endpoint}`)}>{i18next.t("usage:Go")}</Button>
      </React.Fragment>
    );
  }

  renderDropdown() {
    const users_options = [
      <option key="all" value="All" disabled={!(this.props.account.name === "admin" || this.props.account.type === "chat-admin")}>
        All
      </option>,
      ...this.state.users.map((user, index) => (
        <option key={index} value={index}>
          {user}
        </option>
      )),
    ];
    const handleChange = (value) => {
      let user;
      if (value === "All") {
        user = "All";
      } else {
        user = this.state.users[value];
      }
      this.setState({
        selectedUser: user,
      }, () => {
        this.getUsagesForAllCases("", this.state.rangeType);
        this.updateTableInfo(value);
      });
    };

    return (
      <div style={{display: "flex", alignItems: "center", marginBottom: "10px"}}>
        <span style={{width: "50px", marginRight: "10px"}}>{i18next.t("general:User")}:</span>
        <Select
          virtual={true}
          value={this.state.selectedUser}
          onChange={(value => handleChange(value))}
          style={{width: "100%"}}
        >
          {users_options}
        </Select>
      </div>
    );
  }

  formatDate(date, rangeType) {
    const dateTime = new Date(date);

    switch (rangeType) {
    case "Hour": {
      return `${date}:00`;
    }
    case "Day": {
      return date;
    }
    case "Week": {
      const startOfWeek = dateTime;
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get to the end of the week

      const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, "0");
      const startDay = String(startOfWeek.getDate()).padStart(2, "0");
      const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, "0");
      const endDay = String(endOfWeek.getDate()).padStart(2, "0");
      return `${startMonth}-${startDay} ~ ${endMonth}-${endDay}`;
    }
    case "Month": {
      return date.slice(0, 7);
    }
    default: {
      return date;
    }
    }
  }

  renderLeftRangeChart(usages) {
    const rangeType = this.state.rangeType;
    const xData = usages.map(usage => this.formatDate(usage.date, rangeType));
    const userCountData = usages.map(usage => usage.userCount);
    const chatCountData = usages.map(usage => usage.chatCount);

    const options = {
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
        data: [i18next.t("general:Users"), i18next.t("general:Chats")],
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
          type: "bar",
          data: userCountData,
        },
        {
          name: i18next.t("general:Chats"),
          type: "bar",
          yAxisIndex: 1,
          data: chatCountData,
        },
      ],
    };

    return options;
  }

  renderRightRangeChart(usages) {
    const rangeType = this.state.rangeType;
    const xData = usages.map(usage => this.formatDate(usage.date, rangeType));
    const messageCountData = usages.map(usage => usage.messageCount);
    const tokenCountData = usages.map(usage => usage.tokenCount);
    const priceData = usages.map(usage => usage.price);

    const options = {
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
        data: [i18next.t("general:Messages"), i18next.t("general:Tokens"), i18next.t("chat:Price")],
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
          offset: 60,
          axisLabel: {
            margin: 2,
          },
        },
      ],
      series: [
        {
          name: i18next.t("general:Messages"),
          type: "bar",
          data: messageCountData,
        },
        {
          name: i18next.t("general:Tokens"),
          type: "bar",
          yAxisIndex: 1,
          data: tokenCountData,
        },
        {
          name: i18next.t("chat:Price"),
          type: "bar",
          yAxisIndex: 2,
          data: priceData,
        },
      ],
    };

    if (this.props.account.name !== "admin") {
      options.legend.data = options.legend.data.filter(item => item !== i18next.t("chat:Price"));
      options.yAxis = options.yAxis.filter(yAxis => yAxis.name !== i18next.t("chat:Price"));
      options.series = options.series.filter(series => series.name !== i18next.t("chat:Price"));
    }

    return options;
  }

  renderChart() {
    if (this.state.rangeType === "All") {
      return (
        <React.Fragment>
          <Row style={{marginTop: "20px"}} >
            <Col span={1} />
            <Col span={11} >
              <ReactEcharts
                option={this.renderLeftChart(this.state.usages || [])}
                style={{
                  height: "400px",
                  width: "100%",
                  display: "inline-block",
                  backgroundColor: "#fff",
                }}
                showLoading={this.state.usages === null}
                loadingOption={{
                  color: "#4b0082",
                  textColor: "#000",
                  maskColor: "rgba(255, 255, 255, 0.8)",
                  fontSize: "16px",
                  spinnerRadius: 6,
                  lineWidth: 3,
                  fontWeight: "bold",
                  text: "",
                }}
              />
            </Col>
            <Col span={11} >
              <ReactEcharts
                option={this.renderRightChart(this.state.usages || [])}
                style={{
                  height: "400px",
                  width: "100%",
                  display: "inline-block",
                  backgroundColor: "#fff",
                }}
                showLoading={this.state.usages === null}
                loadingOption={{
                  color: "#4b0082",
                  textColor: "#000",
                  maskColor: "rgba(255, 255, 255, 0.8)",
                  fontSize: "16px",
                  spinnerRadius: 6,
                  lineWidth: 3,
                  fontWeight: "bold",
                  text: "",
                }}
              />
            </Col>
            <Col span={1} />
          </Row>
        </React.Fragment>
      );
    } else {
      const fieldName = `rangeUsages${this.state.rangeType}`;
      const rangeUsages = this.state[fieldName];

      return (
        <React.Fragment>
          <ReactEcharts
            option={this.renderLeftRangeChart(rangeUsages || [])}
            style={{
              height: "400px",
              width: "48%",
              display: "inline-block",
              backgroundColor: "#fff",
            }}
            showLoading={rangeUsages === null}
            loadingOption={{
              color: "#4b0082",
              textColor: "#000",
              maskColor: "rgba(255, 255, 255, 0.8)",
              fontSize: "16px",
              spinnerRadius: 6,
              lineWidth: 3,
              fontWeight: "bold",
              text: "",
            }}
          />
          <ReactEcharts
            option={this.renderRightRangeChart(rangeUsages || [])}
            style={{
              height: "400px",
              width: "48%",
              display: "inline-block",
              backgroundColor: "#fff",
            }}
            showLoading={rangeUsages === null}
            loadingOption={{
              color: "#4b0082",
              textColor: "#000",
              maskColor: "rgba(255, 255, 255, 0.8)",
              fontSize: "16px",
              spinnerRadius: 6,
              lineWidth: 3,
              fontWeight: "bold",
              text: "",
            }}
          />
        </React.Fragment>
      );
    }
  }

  render() {
    return (
      <div style={{backgroundColor: "white"}}>
        <Row style={{marginTop: "20px"}} >
          <Col span={1} />
          <Col span={17} >
            {this.renderStatistic(this.state.usages)}
          </Col>
          <Col span={5} >
            {this.renderRadio()}
          </Col>
          <Col span={1} />
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col span={24} >
            {this.renderChart()}
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col span={24} >
            <UsageTable account={this.props.account} data={this.state.selectedTableInfo === null ? this.state.userTableInfo : this.state.selectedTableInfo} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default UsagePage;

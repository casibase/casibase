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
import {Col, Row, Select, Statistic} from "antd";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as ActivityBackend from "./backend/ActivityBackend";
import ReactEcharts from "echarts-for-react";
import i18next from "i18next";
import * as UsageBackend from "./backend/UsageBackend";

const {Option} = Select;

class ActivityPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.subPieCharts = ["region", "city", "unit", "section"],
    this.state = {
      classes: props,
      activities: null,
      allOps: [],
      selectedOps: [],
      usageMetadata: null,
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

  extractAllOperations(apiResponse) {
    if (!apiResponse || apiResponse.status !== "ok" || !apiResponse.data) {
      return [];
    }
    const opsSet = new Set();
    apiResponse.data.action.forEach(item => {
      Object.keys(item.FieldCount).forEach(op => opsSet.add(op));
    });

    return Array.from(opsSet);
  }

  getActivities(serverUrl, fieldNames) {
    ActivityBackend.getActivities(serverUrl, this.state.selectedUser, 30, fieldNames)
      .then((res) => {
        if (res.status === "ok") {
          const state = {};
          const fieldCount = res.data;
          Object.entries(fieldCount).forEach(([fieldName, data]) => {
            const activityKey = `activities${fieldName}`;
            state[activityKey] = data;
            if (fieldName === "action") {
              const allOps = this.extractAllOperations(res);
              state["allOps"] = allOps;
              state["selectedOps"] = allOps.slice(0, 3);
            }
            this.setState(state);
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getActivitiesAll(serverUrl) {
    this.getActivities(serverUrl, this.subPieCharts);
    this.getActivities(serverUrl, ["action"]);
    this.getActivities(serverUrl, ["response"]);
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

  getUsers(serverUrl) {
    UsageBackend.getUsers(serverUrl, this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            users: res.data,
            usageMetadata: res.data2,
          }, () => {
            this.getActivitiesAll("");
          }
          );
          this.state.selectedUser = !(this.props.account.name === "admin" || this.props.account.type === "chat-admin") ? res.data[0] : "All";
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  renderPieChart(activity) {
    const FieldCount = activity[activity.length - 1]?.FieldCount || {};
    const pieData = Object.keys(FieldCount).map(key => ({
      name: key,
      value: FieldCount[key],
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)",
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        left: "left",
        top: 20,
        bottom: 20,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: "Operation Type",
          type: "pie",
          radius: "50%",
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }

  renderLineChart(data, selectedOps) {
    const dates = data.map(item => item.date);

    const series = selectedOps.map(op => ({
      name: op,
      type: "line",
      data: data.map(item => item.FieldCount[op] || 0),
    }));

    return {
      tooltip: {trigger: "axis"},
      legend: {data: selectedOps},
      xAxis: {type: "category", data: dates},
      yAxis: {type: "value"},
      series,
    };
  }

  renderStatistic(activityResponse) {
    // get-activity(,"response")
    const lastActivity = activityResponse && activityResponse.length > 0 ? activityResponse[activityResponse.length - 1].FieldCount : {
      ok: 0,
      error: 0,
    };

    const isLoading = activityResponse === undefined;

    return (
      <Row gutter={16}>
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Success")}
            value={lastActivity.ok}
          />
        </Col>
        <Col span={3}>
          <Statistic
            loading={isLoading}
            title={i18next.t("general:Error")}
            value={lastActivity.error}
          />
        </Col>
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

  getActivitiesForAllCases(endpoint, rangeType) {
    if (endpoint === "") {
      endpoint = this.state.endpoint;
    }
    const serverUrl = this.getServerUrlFromEndpoint(endpoint);

    if (rangeType === "") {
      rangeType = this.state.rangeType;
    }
    this.getActivitiesAll(serverUrl);
  }

  renderRadio() {
    return (
      <div style={{marginTop: "-10px", float: "right"}}>
        {this.renderDropdown()}
        <Select
          mode="multiple"
          style={{width: "300px", marginBottom: "10px"}}
          placeholder="Select operations"
          value={this.state.selectedOps}
          onChange={(selectedOps) => this.setState({selectedOps})}
          allowClear
          maxTagCount="responsive"
          maxTagTextLength={10}
        >
          {this.state.allOps.map(op => (
            <Option key={op} value={op}>{op}</Option>
          ))}
        </Select>
      </div>
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
        this.getActivitiesForAllCases("", this.state.rangeType);
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

  renderSubPieCharts() {
    // const count = this.subPieCharts?.length || 0;
    const count = this.subPieCharts?.length || 0;
    const numChartsPerRow = 2;
    const grouped = [];
    for (let i = 0; i < count; i += numChartsPerRow) {
      grouped.push(this.subPieCharts.slice(i, i + 2));
    }
    return (
      <Col span={22} key="subPieChars">
        {
          grouped.map((r, rowIndex) => (
            <Row key={`row-${rowIndex}`} style={{marginBottom: 16}}>
              {r.map((dataName, colIndex) => (
                <Col span={12} key={`col-${rowIndex}-${colIndex}`}>
                  <ReactEcharts
                    option={this.renderPieChart(this.state["activities" + dataName] || [])}
                    style={{
                      height: "400px",
                      width: "100%",
                      display: "inline-block",
                    }}
                    showLoading={this.state["activities" + dataName] === undefined}
                    loadingOption={{
                      color: localStorage.getItem("themeColor"),
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
              ))}
            </Row>
          ))
        }
      </Col>
    );
  }

  renderChart() {
    const fieldName = "activitiesaction";
    const activitiesAction = this.state[fieldName];
    return (
      <React.Fragment>
        <Row style={{marginTop: "20px"}} >
          <Col span={1} />
          <Col span={11} >
            <ReactEcharts
              option={this.renderPieChart(activitiesAction || [])}
              style={{
                height: "400px",
                width: "100%",
                display: "inline-block",
              }}
              showLoading={activitiesAction === undefined}
              loadingOption={{
                color: localStorage.getItem("themeColor"),
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
              option={this.renderLineChart(activitiesAction || [], this.state.selectedOps || [])}
              style={{
                height: "400px",
                width: "100%",
                display: "inline-block",
              }}
              notMerge={true}
              showLoading={activitiesAction === undefined}
              loadingOption={{
                color: localStorage.getItem("themeColor"),
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
        <Row style={{marginTop: "20px"}} >
          <Col span={1} key="left-spacer" />
          {this.renderSubPieCharts()}
          <Col span={1} key="left-spacer" />
        </Row>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div>
        <Row style={{marginTop: "20px"}} >
          <Col span={1} />
          <Col span={17} >
            {this.renderStatistic(this.state["activitiesresponse"])}
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
      </div>
    );
  }
}

export default ActivityPage;

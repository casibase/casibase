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
import {Button, Card, Col, Input, Row, Select, Tag} from "antd";
import * as ApplicationStoreBackend from "./backend/ApplicationStoreBackend";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
const {TextArea} = Input;
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import StoreAvatarUploader from "./AvatarUpload";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/yaml/yaml");

class ApplicationStoreEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      applicationName: props.match.params.applicationName,
      applicationChart: null,
      loading: false,
      defaultStore: null,
    };
  }

  componentDidMount() {
    this.getApplicationChart();
    this.getDefaultStore();
  }

  getApplicationChart() {
    ApplicationStoreBackend.getApplicationChart(this.props.account.name, this.state.applicationName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            applicationChart: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      })
      .catch((err) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${err}`);
      });
  }

  parseSources(sources) {
    if (sources === "") {
      return [];
    }
    try {
      return JSON.parse(sources);
    } catch (error) {
      return [sources];
    }
  }

  getDefaultStore() {
    StoreBackend.getStores(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          const defaultStore = res.data.find(store => store.isDefault);
          if (defaultStore) {
            this.setState({
              defaultStore: defaultStore,
            });
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  updateField(key, value) {
    const chart = this.state.applicationChart || {};
    chart[key] = value;
    this.setState({applicationChart: chart});
  }

  submitEdit(exitAfterSave) {
    const chart = Setting.deepCopy(this.state.applicationChart);

    this.setState({loading: true});
    ApplicationStoreBackend.updateApplicationChart(this.props.account.name, this.state.applicationName, chart)
      .then((res) => {
        this.setState({loading: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          if (exitAfterSave) {
            this.props.history.push("/application-store");
          } else {
            // reload to reflect any backend changes
            this.getApplicationChart();
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        this.setState({loading: false});
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  renderChartEditor() {
    const chart = this.state.applicationChart;
    if (!chart) {
      return null;
    }

    return (
      <Card size="small" title={
        <div>
          {i18next.t("general:Edit") + i18next.t("application:Application Chart")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitEdit(true)} loading={this.state.loading}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={(Setting.isMobile()) ? {margin: "5px"} : {}} type="inner">

        <Row style={{marginTop: "10px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.name} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.displayName} onChange={e => this.updateField("displayName", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22}>
            <TextArea autoSize={{minRows: 1, maxRows: 5}} value={chart.description} onChange={e => this.updateField("description", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.type} onChange={e => this.updateField("type", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Namespace"), i18next.t("general:Namespace - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.namespace} onChange={e => this.updateField("namespace", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px", alignItems: "baseline"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Tag>{chart.status}</Tag>
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(("Api" + i18next.t("general:Version")), i18next.t("general:ApiVersion - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.apiVersion} onChange={e => this.updateField("apiVersion", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Version"), i18next.t("general:Version - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.version} onChange={e => this.updateField("version", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(("App" + i18next.t("general:Version")), i18next.t("general:App version - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.appVersion} onChange={e => this.updateField("appVersion", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Repository URL"), i18next.t("general:Repository URL - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.repoUrl} onChange={e => this.updateField("repoUrl", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Chart URL"), i18next.t("general:Chart URL - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.chartUrl} onChange={e => this.updateField("chartUrl", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Icon"), i18next.t("general:Icon - Tooltip"))} :
          </Col>
          <Col span={22} >
            <StoreAvatarUploader
              store={this.state.defaultStore}
              imageUrl={chart.iconUrl}
              onUpdate={(newUrl) => {
                this.updateField("iconUrl", newUrl);
              }}
              onUploadComplete={(newUrl) => {
                this.submitEdit(false);
              }}
            />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("video:Keywords"), i18next.t("general:Keywords - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.keywords || ""} onChange={e => this.updateField("keywords", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Home"), i18next.t("general:Home - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input value={chart.home || ""} onChange={e => this.updateField("home", e.target.value)} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Sources"), i18next.t("general:Sources - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Select
              mode="tags"
              style={{width: "100%"}}
              defaultValue={this.parseSources(chart.sources)}
              onChange={value => this.updateField("sources", JSON.stringify(value))} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Maintainers"), i18next.t("general:Maintainers - Tooltip"))} :
          </Col>
          <Col span={22}>
            <div style={{height: "100px"}}>
              <CodeMirror
                value={chart.maintainers}
                options={{mode: {name: "javascript", json: true}, theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateField("maintainers", value);
                }}
              />
            </div>
          </Col>
        </Row>

      </Card>
    );
  }

  render() {
    return (
      <div>
        {this.state.applicationChart !== null ? this.renderChartEditor() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitEdit(true)} loading={this.state.loading}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default ApplicationStoreEditPage;

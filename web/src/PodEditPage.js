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
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as PodBackend from "./backend/PodBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {Option} = Select;

class PodEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      podOwner: props.match.params.organizationName,
      podName: props.match.params.podName,
      pod: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getPod();
  }

  getPod() {
    PodBackend.getPod(this.props.account.owner, this.state.podName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            pod: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get pod: ${res.msg}`);
        }
      });
  }

  parsePodField(key, value) {
    if (["port"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updatePodField(key, value) {
    value = this.parsePodField(key, value);
    const pod = this.state.pod;
    pod[key] = value;
    this.setState({
      pod: pod,
    });
  }

  renderPod() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("pod:New Pod") : i18next.t("pod:Edit Pod")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitPodEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitPodEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deletePod()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.owner} onChange={e => {
              this.updatePodField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.provider} onChange={e => {
              this.updatePodField("provider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.name} onChange={e => {
              this.updatePodField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Namespace"), i18next.t("general:Namespace - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.namespace} onChange={e => {
              this.updatePodField("namespace", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Created time"), i18next.t("general:Created time - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={Setting.getFormattedDate(this.state.pod.createdTime)} onChange={e => {
              this.updatePodField("createdTime", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("machine:Host IP"), i18next.t("machine:Host IP - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.hostIP} onChange={e => {
              this.updatePodField("hostIP", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("pod:Pod IP"), i18next.t("pod:Pod IP - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.podIP} onChange={e => {
              this.updatePodField("podIP", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("pod:Labels"), i18next.t("pod:Labels - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.pod.labels} onChange={e => {
              this.updatePodField("labels", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.pod.status} onChange={(value => {
              this.updatePodField("status", value);
            })}>
              {
                [
                  {id: "Running", name: "Running"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  submitPodEdit(willExist) {
    const pod = Setting.deepCopy(this.state.pod);
    PodBackend.updatePod(this.state.pod.owner, this.state.podName, pod)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              podName: this.state.pod.name,
            });
            if (willExist) {
              this.props.history.push("/pods");
            } else {
              this.props.history.push(`/pods/${this.state.pod.owner}/${encodeURIComponent(this.state.pod.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save: server side failure"));
            this.updatePodField("name", this.state.podName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deletePod() {
    PodBackend.deletePod(this.state.pod)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/pods");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.pod !== null ? this.renderPod() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitPodEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitPodEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deletePod()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default PodEditPage;

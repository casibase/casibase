// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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
import {Button, Card, Col, Input, Row, Select, Switch} from "antd";
import * as RecordBackend from "./backend/RecordBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

const {Option} = Select;

class RecordEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      recordOwner: props.match.params.organizationName,
      recordName: props.match.params.recordName,
      record: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getRecord();
  }

  getRecord() {
    RecordBackend.getRecord(this.props.account.owner, this.state.recordName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            record: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseRecordField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateRecordField(key, value) {
    value = this.parseRecordField(key, value);

    const record = this.state.record;
    record[key] = value;
    this.setState({
      record: record,
    });
  }

  renderRecord() {
    // const history = useHistory();
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("record:New Record") : i18next.t("record:View Record")}&nbsp;&nbsp;&nbsp;&nbsp;
          {this.state.mode !== "123" ? (
            <React.Fragment>
              <Button onClick={() => this.submitRecordEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitRecordEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            </React.Fragment>
          ) : (
            <Button type="primary" onClick={() => this.props.history.push("/records")}>{i18next.t("general:Exit")}</Button>
          )}
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteRecord()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.owner} onChange={e => {
              // this.updateRecordField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.name} onChange={e => {
              // this.updateRecordField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input disabled={false} value={this.state.record.provider} onChange={e => {
              // this.updateRecordField("provider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Block"), i18next.t("general:Block - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input disabled={false} value={this.state.record.block} onChange={e => {
              this.updateRecordField("block", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Client IP"), i18next.t("general:Client IP - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.clientIp} onChange={e => {
              // this.updateRecordField("clientIp", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:User"), i18next.t("general:User - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.user} onChange={e => {
              // this.updateRecordField("user", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Method"), i18next.t("general:Method - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select disabled={false} virtual={false} style={{width: "100%"}} value={this.state.record.method} onChange={(value => {
              // this.updateRecordField("method", value);
            })}>
              {
                [
                  {id: "GET", name: "GET"},
                  {id: "HEAD", name: "HEAD"},
                  {id: "POST", name: "POST"},
                  {id: "PUT", name: "PUT"},
                  {id: "DELETE", name: "DELETE"},
                  {id: "CONNECT", name: "CONNECT"},
                  {id: "OPTIONS", name: "OPTIONS"},
                  {id: "TRACE", name: "TRACE"},
                  {id: "PATCH", name: "PATCH"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Request URI"), i18next.t("general:Request URI - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.requestUri} onChange={e => {
              // this.updateRecordField("requestUri", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Action"), i18next.t("general:Action - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.action} onChange={e => {
              // this.updateRecordField("action", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Language"), i18next.t("general:Language - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.language} onChange={e => {
              // this.updateRecordField("language", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Object"), i18next.t("general:Object - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{width: "900px", height: "300px"}}>
              <CodeMirror
                value={Setting.formatJsonString(this.state.record.object)}
                options={{mode: "javascript", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Response"), i18next.t("general:Response - Tooltip"))} :
          </Col>
          <Col span={22}>
            <div style={{width: "900px", height: "300px"}}>
              <CodeMirror
                value={Setting.formatJsonString(this.state.record.response)}
                options={{mode: "javascript", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 19 : 2}>
            {Setting.getLabel(i18next.t("general:Is triggered"), i18next.t("general:Is triggered - Tooltip"))} :
          </Col>
          <Col span={1} >
            <Switch disabled={false} checked={this.state.record.isTriggered} onChange={checked => {
              // this.updateRecordField("isTriggered", checked);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitRecordEdit(willExist) {
    const record = Setting.deepCopy(this.state.record);
    RecordBackend.updateRecord(this.state.record.owner, this.state.recordName, record)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              recordName: this.state.record.name,
            });
            if (willExist) {
              this.props.history.push("/records");
            } else {
              this.props.history.push(`/records/${this.state.record.owner}/${encodeURIComponent(this.state.record.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateRecordField("name", this.state.recordName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteRecord() {
    RecordBackend.deleteRecord(this.state.record)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/records");
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
          this.state.record !== null ? this.renderRecord() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          {this.state.mode !== "123" ? (
            <React.Fragment>
              <Button size="large" onClick={() => this.submitRecordEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitRecordEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            </React.Fragment>
          ) : (
            <Button type="primary" size="large" onClick={() => this.props.history.push("/records")}>{i18next.t("general:Exit")}</Button>
          )}
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteRecord()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default RecordEditPage;

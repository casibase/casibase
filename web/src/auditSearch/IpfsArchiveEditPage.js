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
import {Button, Card, Col, Input, Modal, Row, Select} from "antd";
import {ExclamationCircleOutlined} from "@ant-design/icons";
import * as IpfsArchiveBackend from "../backend/IpfsArchiveBackend";
import * as Setting from "../Setting";
import i18next from "i18next";
import DataTypeConverter from "../common/DataTypeConverter";

const {Option} = Select;

class IpfsArchiveEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      id: props.match.params.id ? parseInt(props.match.params.id, 10) : null,
      archive: null,
      mode: props.location.mode !== undefined ? props.location.mode : "view",
    };
  }

  UNSAFE_componentWillMount() {
    this.getArchive();
  }

  getArchive() {
    if (this.state.id) {
      IpfsArchiveBackend.getIpfsArchiveById(this.state.id)
        .then((res) => {
          if (res.status === "ok") {
            this.setState({
              archive: res.data,
            });
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.message}`);
          }
        });
    } else {
      // 新建模式
      this.setState({
        archive: {
            recordId: null,
            correlationId: '',
            ipfsAddress: '',
            updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            uploadTime: '',
            dataType: null
          },
        mode: "add"
      });
    }
  }

  updateArchiveField(key, value) {
    const archive = this.state.archive;
    archive[key] = value;
    this.setState({
      archive: archive,
    });
  }

  renderArchive() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("ipfsArchive:New Ipfs Archive") : i18next.t("ipfsArchive:View Ipfs Archive")}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:Record ID"), i18next.t("ipfsArchive:Record ID - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input 
              type="number" 
              pattern="[0-9]*" 
              disabled={this.state.mode !== "add"} 
              value={this.state.archive.recordId || ''} 
              onChange={e => {
                // 过滤非数字字符
                const value = e.target.value.replace(/\D/g, '');
                this.updateArchiveField("recordId", value ? parseInt(value, 10) : null);
              }} 
              placeholder={i18next.t("ipfsArchive:Please enter integer")} 
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:Correlation ID"), i18next.t("ipfsArchive:Correlation ID - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input 
              disabled={this.state.mode !== "add"} 
              value={this.state.archive.correlationId} 
              onChange={e => {
                this.updateArchiveField("correlationId", e.target.value);
              }} 
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:IPFS Address"), i18next.t("ipfsArchive:IPFS Address - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input 
              disabled={this.state.mode === "view"} 
              value={this.state.archive.ipfsAddress} 
              onChange={e => {
                this.updateArchiveField("ipfsAddress", e.target.value);
              }} 
            />
          </Col>
        </Row>
         <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:Data Type"), i18next.t("ipfsArchive:Data Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select 
              disabled={this.state.mode !== "add"} 
              style={{width: "100%"}} 
              value={this.state.archive.dataType} 
              onChange={(value) => {
                this.updateArchiveField("dataType", parseInt(value));
              }} 
            >
              <Option value={1}>{DataTypeConverter.convertToChinese(1)}</Option>
              <Option value={2}>{DataTypeConverter.convertToChinese(2)}</Option>
              <Option value={3}>{DataTypeConverter.convertToChinese(3)}</Option>
              <Option value={4}>{DataTypeConverter.convertToChinese(4)}</Option>
            </Select>
          </Col>
        </Row>
        {this.state.mode !== "add" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("ipfsArchive:Update Time"), i18next.t("ipfsArchive:Update Time - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input 
                disabled={true} 
                value={this.state.archive.updateTime} 
              />
            </Col>
          </Row>
        )}
        
        {this.state.mode !== "add" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("ipfsArchive:Create Time"), i18next.t("ipfsArchive:Create Time - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input 
                disabled={true} 
                value={this.state.archive.createTime} 
              />
            </Col>
          </Row>
        )}
        {this.state.mode !== "add" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("ipfsArchive:Upload Time"), i18next.t("ipfsArchive:Upload Time - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input 
                disabled={true} 
                value={this.state.archive.uploadTime === "0000-00-00 00:00:00" ? "---" : this.state.archive.uploadTime} 
              />
            </Col>
          </Row>
        )}
      </Card>
    );
  }

  submitArchiveEdit(willExit) {
    const archive = Setting.deepCopy(this.state.archive);
    archive.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (this.state.mode === "add") {
      archive.createTime = archive.updateTime;
      IpfsArchiveBackend.addIpfsArchive(archive)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Successfully added"));
            if (willExit) {
              this.props.history.push("/ipfs-archive");
            } else {
              this.props.history.push(`/ipfs-archive/edit/${encodeURIComponent(res.data.id)}`);
            }
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.message}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
        });
    } else {
            IpfsArchiveBackend.updateIpfsArchive(this.state.id, archive)
              .then((res) => {
                if (res.status === "ok") {
                  Setting.showMessage("success", i18next.t("general:Successfully saved"));
                  if (willExit) {
                    this.props.history.push("/ipfs-archive");
                  } else {
                    this.getArchive();
                  }
                } else {
                  Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.message}`);
                }
              })
              .catch(error => {
                Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
              });
    }
  }

  deleteArchive() {
    const {confirm} = Modal;
    confirm({
      title: `${i18next.t("general:Sure to delete")}: ${this.state.archive.correlationId} ?`,
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        IpfsArchiveBackend.deleteIpfsArchiveById(this.state.id)
          .then((res) => {
            if (res.status === "ok") {
              Setting.showMessage("success", i18next.t("general:Successfully deleted"));
              this.props.history.push("/ipfs-archive");
            } else {
              Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.message}`);
            }
          })
          .catch(error => {
            Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
          });
      },
      onCancel: () => {
        // Do nothing
      },
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
    });
  }

  render() {
    return (
      <div>
        {this.state.archive !== null ? this.renderArchive() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          {this.state.mode === "view" ? (
            <Button size="large" onClick={() => this.props.history.goBack()}>{i18next.t("general:Back")}</Button>
          ) : this.state.mode === "add" ? (
            <React.Fragment>
              <Button type="primary" size="large" onClick={() => this.submitArchiveEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.submitArchiveEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.props.history.push("/ipfs-archive")}>{i18next.t("general:Cancel")}</Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button type="primary" size="large" onClick={() => this.submitArchiveEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.submitArchiveEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.props.history.goBack()}>{i18next.t("general:Back")}</Button>
              {/* <Button style={{marginLeft: "20px"}} type="danger" size="large" onClick={() => this.deleteArchive()}>{i18next.t("general:Delete")}</Button> */}
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

export default IpfsArchiveEditPage;
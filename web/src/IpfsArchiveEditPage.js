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
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as IpfsArchiveBackend from "./backend/IpfsArchiveBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {Option} = Select;

class IpfsArchiveEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      correlationId: props.match.params.correlationId,
      archive: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getArchive();
  }

  getArchive() {
    if (this.state.correlationId) {
      IpfsArchiveBackend.getIpfsArchive(this.state.correlationId)
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
          correlation_id: '',
          ipfs_address: '',
          update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          data_type: 1
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
            {Setting.getLabel(i18next.t("ipfsArchive:Correlation ID"), i18next.t("ipfsArchive:Correlation ID - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input 
              disabled={this.state.mode !== "add"} 
              value={this.state.archive.correlation_id} 
              onChange={e => {
                this.updateArchiveField("correlation_id", e.target.value);
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
              disabled={false} 
              value={this.state.archive.ipfs_address} 
              onChange={e => {
                this.updateArchiveField("ipfs_address", e.target.value);
              }} 
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:Update Time"), i18next.t("ipfsArchive:Update Time - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input 
              disabled={true} 
              value={this.state.archive.update_time} 
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("ipfsArchive:Data Type"), i18next.t("ipfsArchive:Data Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select 
              disabled={false} 
              style={{width: "100%"}} 
              value={this.state.archive.data_type} 
              onChange={(value) => {
                this.updateArchiveField("data_type", parseInt(value));
              }} 
            >
              <Option value={1}>{i18next.t("ipfsArchive:Record Data")}</Option>
              <Option value={2}>{i18next.t("ipfsArchive:Other Data")}</Option>
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  submitArchiveEdit(willExit) {
    const archive = Setting.deepCopy(this.state.archive);
    archive.update_time = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (this.state.mode === "add") {
      IpfsArchiveBackend.addIpfsArchive(archive)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Successfully added"));
            if (willExit) {
              this.props.history.push("/ipfs-archives");
            } else {
              this.props.history.push(`/ipfs-archive/edit/${encodeURIComponent(res.data.correlation_id)}`);
            }
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.message}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
        });
    } else {
      IpfsArchiveBackend.updateIpfsArchive(this.state.correlationId, archive)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            if (willExit) {
              this.props.history.push("/ipfs-archives");
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
      title: `${i18next.t("general:Sure to delete")}: ${this.state.archive.correlation_id} ?`,
      icon: <ExclamationCircleOutlined />,
      okText: i18next.t("general:OK"),
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
      onOk: () => {
        IpfsArchiveBackend.deleteIpfsArchive(this.state.archive)
          .then((res) => {
            if (res.status === "ok") {
              Setting.showMessage("success", i18next.t("general:Deleted successfully"));
              this.props.history.push("/ipfs-archives");
            } else {
              Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.message}`);
            }
          })
          .catch(error => {
            Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
          });
      },
    });
  }

  render() {
    return (
      <div>
        {this.state.archive !== null ? this.renderArchive() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          {this.state.mode === "add" ? (
            <React.Fragment>
              <Button type="primary" size="large" onClick={() => this.submitArchiveEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.submitArchiveEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.props.history.push("/ipfs-archives")}>{i18next.t("general:Cancel")}</Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button type="primary" size="large" onClick={() => this.submitArchiveEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.submitArchiveEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} type="danger" size="large" onClick={() => this.deleteArchive()}>{i18next.t("general:Delete")}</Button>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

export default IpfsArchiveEditPage;
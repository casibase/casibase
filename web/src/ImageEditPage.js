// Copyright 2024 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as ImageBackend from "./backend/ImageBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class ImageEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      imageOwner: props.match.params.organizationName,
      imageName: props.match.params.imageName,
      image: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getImage();
  }

  getImage() {
    ImageBackend.getImage(this.props.account.owner, this.state.imageName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            image: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseImageField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateImageField(key, value) {
    value = this.parseImageField(key, value);

    const image = this.state.image;
    image[key] = value;
    this.setState({
      image: image,
    });
  }

  renderImage() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("image:New Image") : i18next.t("image:Edit Image")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitImageEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitImageEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteImage()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.image.owner} onChange={e => {
              this.updateImageField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.image.name} onChange={e => {
              this.updateImageField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Category"), i18next.t("provider:Category - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.image.category} onChange={value => {
              this.updateImageField("category", value);
            }}
            options={[
              {value: "Private Image", label: "Private Image"},
              {value: "Public Image", label: "Public Image"},
              {value: "Market Image", label: "Market Image"},
              {value: "Community Image", label: "Community Image"},
            ].map(item => Setting.getOption(item.label, item.value))} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:ID"), i18next.t("general:ID - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.imageId}
              onChange={(e) => {
                this.updateImageField("imageId", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.state}
              onChange={(e) => {
                this.updateImageField("state", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Tag"), i18next.t("general:Tag - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.tag}
              onChange={(e) => {
                this.updateImageField("tag", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input.TextArea
              value={this.state.image.description}
              onChange={(e) => {
                this.updateImageField("description", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("node:OS"), i18next.t("node:OS - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.os}
              onChange={(e) => {
                this.updateImageField("os", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("image:Platform"), i18next.t("image:Platform - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.platform}
              onChange={(e) => {
                this.updateImageField("platform", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("image:Arch"), i18next.t("image:Arch - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.systemArchitecture}
              onChange={(e) => {
                this.updateImageField("systemArchitecture", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Size"), i18next.t("general:Size - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.size}
              onChange={(e) => {
                this.updateImageField("size", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("image:Boot mode"), i18next.t("image:Boot mode - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.bootMode}
              onChange={(e) => {
                this.updateImageField("bootMode", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Progress"), i18next.t("general:Progress - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.image.progress}
              onChange={(e) => {
                this.updateImageField("progress", e.target.value);
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitImageEdit(willExist) {
    const image = Setting.deepCopy(this.state.image);
    ImageBackend.updateImage(this.state.image.owner, this.state.imageName, image)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              imageName: this.state.image.name,
            });
            if (willExist) {
              this.props.history.push("/images");
            } else {
              this.props.history.push(`/images/${this.state.image.owner}/${encodeURIComponent(this.state.image.name)}`);
            }
            // this.getImage(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateImageField("name", this.state.imageName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteImage() {
    ImageBackend.deleteImage(this.state.image)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/images");
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
          this.state.image !== null ? this.renderImage() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitImageEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitImageEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteImage()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default ImageEditPage;

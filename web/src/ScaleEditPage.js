// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.

import React from "react";
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as ScaleBackend from "./backend/ScaleBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {TextArea} = Input;

class ScaleEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      owner: props.match.params.owner,
      scaleName: props.match.params.scaleName,
      isNewScale: props.location?.state?.isNewScale || false,
      scale: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getScale();
  }

  getScale() {
    ScaleBackend.getScale(this.state.owner, this.state.scaleName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({scale: res.data});
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  updateScaleField(key, value) {
    const scale = {...this.state.scale};
    scale[key] = value;
    this.setState({scale});
  }

  submitScaleEdit(exitAfterSave) {
    const scale = Setting.deepCopy(this.state.scale);
    ScaleBackend.updateScale(this.state.owner, this.state.scaleName, scale)
      .then((res) => {
        if (res.status === "ok" && res.data) {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({isNewScale: false, scaleName: this.state.scale.name});
          if (exitAfterSave) {
            this.props.history.push("/scales");
          } else {
            this.props.history.push(`/scales/${this.state.scale.owner}/${this.state.scale.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  renderScale() {
    const s = this.state.scale;
    if (!s) {
      return null;
    }
    return (
      <Card size="small" title={
        <div>
          {i18next.t("task:Edit Scale")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitScaleEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitScaleEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} gutter={16}>
          <Col span={12}>
            <div>{Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :</div>
            <Input value={s.name} onChange={(e) => this.updateScaleField("name", e.target.value)} />
          </Col>
          <Col span={12}>
            <div>{Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :</div>
            <Input value={s.displayName} onChange={(e) => this.updateScaleField("displayName", e.target.value)} />
          </Col>
        </Row>
        {Setting.isAdminUser(this.props.account) ? (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select
                virtual={false}
                style={{width: "100%"}}
                value={s.state || "Public"}
                onChange={(value) => this.updateScaleField("state", value)}
                options={[
                  {value: "Public", label: i18next.t("video:Public")},
                  {value: "Hidden", label: i18next.t("video:Hidden")},
                ]}
              />
            </Col>
          </Row>
        ) : null}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Text"), i18next.t("task:Scale - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea rows={12} value={s.text} onChange={(e) => this.updateScaleField("text", e.target.value)} />
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {this.state.scale !== null ? this.renderScale() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitScaleEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitScaleEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default ScaleEditPage;

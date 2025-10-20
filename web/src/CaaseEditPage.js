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
import {Button, Card, Col, Input, Row} from "antd";
import * as CaaseBackend from "./backend/CaaseBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class CaaseEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      caaseName: props.match.params.caaseName,
      caase: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getCaase();
  }

  getCaase() {
    CaaseBackend.getCaase(this.props.account.owner, this.state.caaseName).then(
      (res) => {
        if (res.status === "ok") {
          this.setState({
            caase: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      }
    );
  }

  parseCaaseField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateCaaseField(key, value) {
    value = this.parseCaaseField(key, value);

    const caase = this.state.caase;
    caase[key] = value;
    this.setState({
      caase: caase,
    });
  }

  renderCaase() {
    return (
      <Card
        size="small"
        title={
          <div>
            {this.state.mode === "add"
              ? i18next.t("caase:New Caase")
              : i18next.t("caase:Edit Caase")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button onClick={() => this.submitCaaseEdit(false)}>
              {i18next.t("general:Save")}
            </Button>
            <Button
              style={{marginLeft: "20px"}}
              type="primary"
              onClick={() => this.submitCaaseEdit(true)}
            >
              {i18next.t("general:Save & Exit")}
            </Button>
            {this.state.mode === "add" ? (
              <Button
                style={{marginLeft: "20px"}}
                onClick={() => this.deleteCaase()}
              >
                {i18next.t("general:Cancel")}
              </Button>
            ) : null}
          </div>
        }
        style={{marginLeft: "5px"}}
        type="inner"
      >
        <Row style={{marginTop: "10px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("general:Organization"),
              i18next.t("general:Organization - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.owner}
              onChange={(e) => {
                this.updateCaaseField("owner", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("general:Name"),
              i18next.t("general:Name - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.name}
              onChange={(e) => {
                this.updateCaaseField("name", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Symptoms"),
              i18next.t("med:Symptoms - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.symptoms}
              onChange={(e) => {
                this.updateCaaseField("symptoms", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Diagnosis"),
              i18next.t("med:Diagnosis - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.diagnosis}
              onChange={(e) => {
                this.updateCaaseField("diagnosis", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Diagnosis date"),
              i18next.t("med:Diagnosis date - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.diagnosisDate}
              onChange={(e) => {
                this.updateCaaseField("diagnosisDate", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Prescription"),
              i18next.t("med:Prescription - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.prescription}
              onChange={(e) => {
                this.updateCaaseField("prescription", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Follow up"),
              i18next.t("med:Follow up - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.followUp}
              onChange={(e) => {
                this.updateCaaseField("followUp", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:HIS interface info"),
              i18next.t("med:HIS interface info - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.hisInterfaceInfo}
              onChange={(e) => {
                this.updateCaaseField("hisInterfaceInfo", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Primary care physician"),
              i18next.t("med:Primary care physician - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.primaryCarePhysician}
              onChange={(e) => {
                this.updateCaaseField("primaryCarePhysician", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("general:Type"),
              i18next.t("general:Type - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.type}
              onChange={(e) => {
                this.updateCaaseField("type", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Patient name"),
              i18next.t("med:Patient name - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.patientName}
              onChange={(e) => {
                this.updateCaaseField("patientName", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Doctor name"),
              i18next.t("med:Doctor name - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.doctorName}
              onChange={(e) => {
                this.updateCaaseField("doctorName", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Specialist alliance Id"),
              i18next.t("med:Specialist alliance Id - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.specialistAllianceId}
              onChange={(e) => {
                this.updateCaaseField("specialistAllianceId", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Integrated care organization Id"),
              i18next.t("med:Integrated care organization Id - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.caase.integratedCareOrganizationId}
              onChange={(e) => {
                this.updateCaaseField(
                  "integratedCareOrganizationId",
                  e.target.value
                );
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitCaaseEdit(willExist) {
    const caase = Setting.deepCopy(this.state.caase);
    CaaseBackend.updateCaase(
      this.state.caase.owner,
      this.state.caaseName,
      caase
    )
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              caaseName: this.state.caase.name,
            });
            if (willExist) {
              this.props.history.push("/caases");
            } else {
              this.props.history.push(
                `/caases/${this.state.caase.owner}/${encodeURIComponent(this.state.caase.name)}`
              );
            }
            // this.getCaase(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateCaaseField("name", this.state.caaseName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteCaase() {
    CaaseBackend.deleteCaase(this.state.caase)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/caases");
        } else {
          Setting.showMessage(
            "error",
            `${i18next.t("general:Failed to delete")}: ${res.msg}`
          );
        }
      })
      .catch((error) => {
        Setting.showMessage(
          "error",
          `${i18next.t("general:Failed to connect to server")}: ${error}`
        );
      });
  }

  render() {
    return (
      <div>
        {this.state.caase !== null ? this.renderCaase() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitCaaseEdit(false)}>
            {i18next.t("general:Save")}
          </Button>
          <Button
            style={{marginLeft: "20px"}}
            type="primary"
            size="large"
            onClick={() => this.submitCaaseEdit(true)}
          >
            {i18next.t("general:Save & Exit")}
          </Button>
          {this.state.mode === "add" ? (
            <Button
              style={{marginLeft: "20px"}}
              size="large"
              onClick={() => this.deleteCaase()}
            >
              {i18next.t("general:Cancel")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
}

export default CaaseEditPage;

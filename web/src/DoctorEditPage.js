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
import * as DoctorBackend from "./backend/DoctorBackend";
import * as HospitalBackend from "./backend/HospitalBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class DoctorEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      doctorName: props.match.params.doctorName,
      doctor: null,
      hospitals: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getDoctor();
    this.getHospitals();
  }

  getDoctor() {
    DoctorBackend.getDoctor(
      this.props.account.owner,
      this.state.doctorName
    ).then((res) => {
      if (res.status === "ok") {
        this.setState({
          doctor: res.data,
        });
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
      }
    });
  }

  getHospitals() {
    HospitalBackend.getHospitals(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            hospitals: res.data || [],
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseDoctorField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateDoctorField(key, value) {
    value = this.parseDoctorField(key, value);

    const doctor = this.state.doctor;
    doctor[key] = value;
    this.setState({
      doctor: doctor,
    });
  }

  renderDoctor() {
    return (
      <Card
        size="small"
        title={
          <div>
            {this.state.mode === "add"
              ? i18next.t("doctor:New Doctor")
              : i18next.t("doctor:Edit Doctor")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button onClick={() => this.submitDoctorEdit(false)}>
              {i18next.t("general:Save")}
            </Button>
            <Button
              style={{marginLeft: "20px"}}
              type="primary"
              onClick={() => this.submitDoctorEdit(true)}
            >
              {i18next.t("general:Save & Exit")}
            </Button>
            {this.state.mode === "add" ? (
              <Button
                style={{marginLeft: "20px"}}
                onClick={() => this.deleteDoctor()}
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
              i18next.t("general:Name"),
              i18next.t("general:Name - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.doctor.name}
              onChange={(e) => {
                this.updateDoctorField("name", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Department"),
              i18next.t("med:Department - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.doctor.department}
              onChange={(e) => {
                this.updateDoctorField("department", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Gender"),
              i18next.t("med:Gender - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.doctor.gender}
              onChange={(value) => {
                this.updateDoctorField("gender", value);
              }}
              options={[
                {value: "Male", label: "Male"},
                {value: "Female", label: "Female"},
                {value: "Other", label: "Other"},
              ].map((item) => Setting.getOption(item.label, item.value))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Access level"),
              i18next.t("med:Access level - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Input
              value={this.state.doctor.accessLevel}
              onChange={(e) => {
                this.updateDoctorField("accessLevel", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(
              i18next.t("med:Hospital"),
              i18next.t("med:Hospital - Tooltip")
            )}{" "}
            :
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.doctor.hospitalName}
              onChange={(value) => {
                this.updateDoctorField("hospitalName", value);
              }}
              options={this.state.hospitals.map((hospital) => ({
                label: hospital.name,
                value: hospital.name,
              }))}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitDoctorEdit(willExist) {
    const doctor = Setting.deepCopy(this.state.doctor);
    DoctorBackend.updateDoctor(this.state.doctor.owner, this.state.doctorName, doctor)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              doctorName: this.state.doctor.name,
            });
            if (willExist) {
              this.props.history.push("/doctors");
            } else {
              this.props.history.push(`/doctors/${encodeURIComponent(this.state.doctor.name)}`);
            }
          // this.getDoctor(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateDoctorField("name", this.state.doctorName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteDoctor() {
    DoctorBackend.deleteDoctor(this.state.doctor)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/doctors");
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
        {this.state.doctor !== null ? this.renderDoctor() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitDoctorEdit(false)}>
            {i18next.t("general:Save")}
          </Button>
          <Button
            style={{marginLeft: "20px"}}
            type="primary"
            size="large"
            onClick={() => this.submitDoctorEdit(true)}
          >
            {i18next.t("general:Save & Exit")}
          </Button>
          {this.state.mode === "add" ? (
            <Button
              style={{marginLeft: "20px"}}
              size="large"
              onClick={() => this.deleteDoctor()}
            >
              {i18next.t("general:Cancel")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
}

export default DoctorEditPage;

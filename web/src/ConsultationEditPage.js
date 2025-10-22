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
// import {LinkOutlined} from "@ant-design/icons";
import * as ConsultationBackend from "./backend/ConsultationBackend";
import * as PatientBackend from "./backend/PatientBackend";
import * as DoctorBackend from "./backend/DoctorBackend";
import * as HospitalBackend from "./backend/HospitalBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class ConsultationEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      consultationName: props.match.params.consultationName,
      consultation: null,
      patients: [],
      doctors: [],
      hospitals: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getConsultation();
    this.getPatients();
    this.getDoctors();
    this.getHospitals();
  }

  getConsultation() {
    ConsultationBackend.getConsultation(this.props.account.owner, this.state.consultationName)
      .then((res) => {
        if (res.status === "ok") {
          const consultation = res.data;
          // Ensure doctorNames is an array
          if (!consultation.doctorNames) {
            consultation.doctorNames = [];
          }
          this.setState({
            consultation: consultation,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getPatients() {
    PatientBackend.getPatients(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            patients: res.data || [],
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getDoctors() {
    DoctorBackend.getDoctors(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            doctors: res.data || [],
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

  parseConsultationField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateConsultationField(key, value) {
    value = this.parseConsultationField(key, value);

    const consultation = this.state.consultation;
    consultation[key] = value;
    this.setState({
      consultation: consultation,
    });
  }

  renderConsultation() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("consultation:New Consultation") : i18next.t("consultation:Edit Consultation")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitConsultationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitConsultationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteConsultation()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.consultation.name} onChange={e => {
              this.updateConsultationField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Patient"), i18next.t("med:Patient - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.consultation.patientName}
              onChange={(value) => {
                this.updateConsultationField("patientName", value);
              }}
              options={this.state.patients.map((patient) => ({
                label: patient.hospitalName ? `${patient.hospitalName}/${patient.name}` : patient.name,
                value: patient.name,
              }))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Doctors"), i18next.t("med:Doctors - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              mode="multiple"
              style={{width: "100%"}}
              value={this.state.consultation.doctorNames || []}
              onChange={(value) => {
                this.updateConsultationField("doctorNames", value);
              }}
              options={this.state.doctors.map((doctor) => ({
                label: doctor.hospitalName ? `${doctor.hospitalName}/${doctor.name}` : doctor.name,
                value: doctor.name,
              }))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Expired time"), i18next.t("med:Expired time - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.consultation.expiredTime} onChange={e => {
              this.updateConsultationField("expiredTime", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.consultation.state} onChange={value => {
              this.updateConsultationField("state", value);
            }}
            options={[
              {value: "Active", label: "Active"},
              {value: "Inactive", label: "Inactive"},
            ].map(item => Setting.getOption(item.label, item.value))} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitConsultationEdit(willExist) {
    const consultation = Setting.deepCopy(this.state.consultation);
    ConsultationBackend.updateConsultation(this.state.consultation.owner, this.state.consultationName, consultation)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              consultationName: this.state.consultation.name,
            });
            if (willExist) {
              this.props.history.push("/consultations");
            } else {
              this.props.history.push(`/consultations/${encodeURIComponent(this.state.consultation.name)}`);
            }
            // this.getConsultation(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateConsultationField("name", this.state.consultationName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteConsultation() {
    ConsultationBackend.deleteConsultation(this.state.consultation)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/consultations");
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
          this.state.consultation !== null ? this.renderConsultation() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitConsultationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitConsultationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteConsultation()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default ConsultationEditPage;

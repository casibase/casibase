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
import {Link} from "react-router-dom";
import {Button, Table} from "antd";
import BaseListPage from "./BaseListPage";
import moment from "moment";
import * as Setting from "./Setting";
import * as PatientBackend from "./backend/PatientBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class PatientListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newPatient() {
    return {
      owner: this.props.account.owner,
      name: `patient_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Patient - ${Setting.getRandomName()}`,
      category: "Public Cloud",
      type: "Amazon Web Services",
      clientId: "",
      clientSecret: "",
      region: "us-west",
      state: "Active",
    };
  }

  addPatient() {
    const newPatient = this.newPatient();
    PatientBackend.addPatient(newPatient)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/patients/${newPatient.name}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  canEditPatient(patient) {
    const account = this.props.account;
    if (!account) {
      return false;
    }

    // Admins can edit all patients
    if (Setting.isAdminUser(account) || account.tag === "Admin") {
      return true;
    }

    // Doctors who are owners can edit
    if (account.tag === "Doctor" && patient.owners) {
      return patient.owners.includes(account.name);
    }

    return false;
  }

  deletePatient(i) {
    PatientBackend.deletePatient(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderTable(patients) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/patients/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        // sorter: true,
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, patient, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("med:Owners"),
        dataIndex: "owners",
        key: "owners",
        width: "200px",
        render: (text, patient, index) => {
          if (!patient.owners || patient.owners.length === 0) {
            return "";
          }
          return (
            <span>
              {patient.owners.map((owner, idx) => (
                <span key={idx}>
                  <Link to={`/doctors/${owner}`}>{owner}</Link>
                  {idx < patient.owners.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          );
        },
      },
      {
        title: i18next.t("med:Hospital"),
        dataIndex: "hospitalName",
        key: "hospitalName",
        width: "150px",
        sorter: (a, b) => (a.hospitalName || "").localeCompare(b.hospitalName || ""),
        render: (text, record, index) => {
          if (!text) {
            return "";
          }
          return (
            <Link to={`/hospitals/${text}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("med:Gender"),
        dataIndex: "gender",
        key: "gender",
        width: "100px",
        sorter: (a, b) => a.gender.localeCompare(b.gender),
      },
      {
        title: i18next.t("med:Address"),
        dataIndex: "address",
        key: "address",
        width: "200px",
        sorter: (a, b) => a.address.localeCompare(b.address),
      },
      {
        title: i18next.t("med:Email"),
        dataIndex: "email",
        key: "email",
        width: "200px",
        sorter: (a, b) => a.email.localeCompare(b.email),
      },
      {
        title: i18next.t("med:Blood type"),
        dataIndex: "bloodType",
        key: "bloodType",
        width: "100px",
        sorter: (a, b) => a.bloodType.localeCompare(b.bloodType),
      },
      {
        title: i18next.t("med:Allergies"),
        dataIndex: "allergies",
        key: "allergies",
        width: "200px",
        sorter: (a, b) => a.allergies.localeCompare(b.allergies),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "130px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, patient, index) => {
          const canEdit = this.canEditPatient(patient);
          return (
            <div>
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/patients/${patient.name}`)}
              >{canEdit ? i18next.t("general:Edit") : i18next.t("general:View")}
              </Button>
              <PopconfirmModal
                disabled={!canEdit}
                style={{marginBottom: "10px"}}
                title={i18next.t("general:Sure to delete") + `: ${patient.name} ?`}
                onConfirm={() => this.deletePatient(index)}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      pageSize: this.state.pagination.pageSize,
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={patients} rowKey={(patient) => `${patient.owner}/${patient.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("med:Patients")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addPatient.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    PatientBackend.getPatients(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      });
  };
}

export default PatientListPage;

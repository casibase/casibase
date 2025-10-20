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
import * as ConsultationBackend from "./backend/ConsultationBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class ConsultationListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newConsultation() {
    return {
      owner: this.props.account.owner,
      name: `consultation_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Consultation - ${Setting.getRandomName()}`,
      patientName: "Unknown",
      doctorName: "Unknown",
      authorizedHospital: "",
      expirationTime: moment().add(1, "years").format(),
    };
  }

  addConsultation() {
    const newConsultation = this.newConsultation();
    ConsultationBackend.addConsultation(newConsultation)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/consultations/${newConsultation.name}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteConsultation(i) {
    ConsultationBackend.deleteConsultation(this.state.data[i])
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

  renderTable(consultations) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, consultation, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/consultations/${record.name}`}>{text}</Link>
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
        render: (text, consultation, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("med:Patient name"),
        dataIndex: "patientName",
        key: "patientName",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("patientName"),
        render: (text, record, index) => {
          return (
            <Link to={`/patients/${record.owner}/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("med:Doctor name"),
        dataIndex: "doctorName",
        key: "doctorName",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("doctorName"),
        render: (text, record, index) => {
          return (
            <Link to={`/doctors/${record.owner}/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("med:Expired time"),
        dataIndex: "expiredTime",
        key: "expiredTime",
        width: "120px",
        sorter: (a, b) => a.expiredTime.localeCompare(b.expiredTime),
      },
      {
        title: i18next.t("med:Authorized hospital"),
        dataIndex: "authorizedHospital",
        key: "authorizedHospital",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("authorizedHospital"),
        render: (text, record, index) => {
          return (
            <Link to={`/hospitals/${record.owner}/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "130px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, consultation, index) => {
          return (
            <div>
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/consultations/${consultation.name}`)}
              >{i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={consultation.owner !== this.props.account.owner}
                style={{marginBottom: "10px"}}
                title={i18next.t("general:Sure to delete") + `: ${consultation.name} ?`}
                onConfirm={() => this.deleteConsultation(index)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={consultations} rowKey={(consultation) => `${consultation.owner}/${consultation.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("med:Consultations")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addConsultation.bind(this)}>{i18next.t("general:Add")}</Button>
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
    ConsultationBackend.getConsultations(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default ConsultationListPage;

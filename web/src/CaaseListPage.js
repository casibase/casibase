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
import * as CaaseBackend from "./backend/CaaseBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class CaaseListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newCaase() {
    return {
      owner: this.props.account.owner,
      name: `caase_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Caase - ${Setting.getRandomName()}`,
      symptoms: "",
      diagnosis: "",
      diagnosisDate: moment().format(),
      prescription: "",
      followUp: "",
      hisInterfaceInfo: "",
      primaryCarePhysician: "",
      patientName: "",
      doctorName: "",
      specialistAllianceId: "",
      integratedCareOrganizationId: "",
    };
  }

  addCaase() {
    const newCaase = this.newCaase();
    CaaseBackend.addCaase(newCaase)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({
            pathname: `/caases/${newCaase.name}`,
            mode: "add",
          });
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteCaase(i) {
    CaaseBackend.deleteCaase(this.state.data[i])
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
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderTable(caases) {
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
            <Link to={`/caases/${record.name}`}>{text}</Link>
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
        render: (text, caase, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("med:Patient"),
        dataIndex: "patientName",
        key: "patientName",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("patientName"),
        render: (text, record, index) => {
          return (
            <Link to={`/patients/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("med:Doctor"),
        dataIndex: "doctorName",
        key: "doctorName",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("doctorName"),
        render: (text, record, index) => {
          return (
            <Link to={`/doctors/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("med:Hospital"),
        dataIndex: "hospitalName",
        key: "hospitalName",
        width: "120px",
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
        title: i18next.t("med:Symptoms"),
        dataIndex: "symptoms",
        key: "symptoms",
        width: "160px",
        sorter: (a, b) => a.symptoms.localeCompare(b.symptoms),
      },
      {
        title: i18next.t("med:Diagnosis"),
        dataIndex: "diagnosis",
        key: "diagnosis",
        width: "160px",
        sorter: (a, b) => a.diagnosis.localeCompare(b.diagnosis),
      },
      {
        title: i18next.t("med:Diagnosis date"),
        dataIndex: "diagnosisDate",
        key: "diagnosisDate",
        width: "160px",
        sorter: (a, b) => a.diagnosisDate.localeCompare(b.diagnosisDate),
      },
      {
        title: i18next.t("med:Prescription"),
        dataIndex: "prescription",
        key: "prescription",
        width: "160px",
        sorter: (a, b) => a.prescription.localeCompare(b.prescription),
      },
      {
        title: i18next.t("med:Follow up"),
        dataIndex: "followUp",
        key: "followUp",
        width: "160px",
        sorter: (a, b) => a.followUp.localeCompare(b.followUp),
      },
      {
        title: i18next.t("med:HIS interface info"),
        dataIndex: "hisInterfaceInfo",
        key: "hisInterfaceInfo",
        width: "160px",
        sorter: (a, b) => a.hisInterfaceInfo.localeCompare(b.hisInterfaceInfo),
      },
      {
        title: i18next.t("med:Primary care physician"),
        dataIndex: "primaryCarePhysician",
        key: "primaryCarePhysician",
        width: "160px",
        sorter: (a, b) =>
          a.primaryCarePhysician.localeCompare(b.primaryCarePhysician),
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "120px",
        sorter: (a, b) => a.type.localeCompare(b.type),
      },
      {
        title: i18next.t("med:Specialist alliance Id"),
        dataIndex: "specialistAllianceId",
        key: "specialistAllianceId",
        width: "160px",
        sorter: (a, b) =>
          a.specialistAllianceId.localeCompare(b.specialistAllianceId),
      },
      {
        title: i18next.t("med:Integrated care organization Id"),
        dataIndex: "integratedCareOrganizationId",
        key: "integratedCareOrganizationId",
        width: "160px",
        sorter: (a, b) =>
          a.integratedCareOrganizationId.localeCompare(
            b.integratedCareOrganizationId
          ),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "220px",
        fixed: Setting.isMobile() ? "false" : "right",
        render: (text, caase, index) => {
          return (
            <div>
              <Button
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
                  marginRight: "10px",
                }}
                onClick={() =>
                  this.props.history.push(
                    `/caases/${caase.name}`
                  )
                }
              >
                {i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={caase.owner !== this.props.account.owner}
                style={{marginBottom: "10px"}}
                title={
                  i18next.t("general:Sure to delete") + `: ${caase.name} ?`
                }
                onConfirm={() => this.deleteCaase(index)}
              ></PopconfirmModal>
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
      showTotal: () =>
        i18next
          .t("general:{total} in total")
          .replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table
          scroll={{x: "max-content"}}
          columns={columns}
          dataSource={caases}
          rowKey={(caase) => `${caase.owner}/${caase.name}`}
          size="middle"
          bordered
          pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("med:Caases")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button
                type="primary"
                size="small"
                onClick={this.addCaase.bind(this)}
              >
                {i18next.t("general:Add")}
              </Button>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    let field = params.searchedColumn,
      value = params.searchText;
    const sortField = params.sortField,
      sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    CaaseBackend.getCaases(
      Setting.getRequestOrganization(this.props.account),
      params.pagination.current,
      params.pagination.pageSize,
      field,
      value,
      sortField,
      sortOrder
    ).then((res) => {
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

export default CaaseListPage;

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
import * as DoctorBackend from "./backend/DoctorBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class DoctorListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newDoctor() {
    return {
      owner: this.props.account.owner,
      name: `doctor_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Doctor - ${Setting.getRandomName()}`,
      department: "General",
      gender: "Unknown",
      accessLevel: "Standard",
      hospitalName: "Unknown",
    };
  }

  addDoctor() {
    const newDoctor = this.newDoctor();
    DoctorBackend.addDoctor(newDoctor)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({
            pathname: `/doctors/${newDoctor.name}`,
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

  deleteDoctor(i) {
    DoctorBackend.deleteDoctor(this.state.data[i])
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

  renderTable(doctors) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/doctors/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "180px",
        // sorter: true,
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, doctor, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("med:Department"),
        dataIndex: "department",
        key: "department",
        width: "150px",
        sorter: (a, b) => a.department.localeCompare(b.department),
      },

      {
        title: i18next.t("med:Gender"),
        dataIndex: "gender",
        key: "gender",
        width: "150px",
        sorter: (a, b) => a.gender.localeCompare(b.gender),
      },

      {
        title: i18next.t("med:Access level"),
        dataIndex: "accessLevel",
        key: "accessLevel",
        width: "150px",
        sorter: (a, b) => a.accessLevel.localeCompare(b.accessLevel),
      },
      {
        title: i18next.t("med:Hospital"),
        dataIndex: "hospitalName",
        key: "hospitalName",
        // width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("hospitalName"),
        render: (text, record, index) => {
          return (
            <Link to={`/hospitals/${text}`}>
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
        width: "220px",
        fixed: Setting.isMobile() ? "false" : "right",
        render: (text, doctor, index) => {
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
                    `/doctors/${doctor.name}`
                  )
                }
              >
                {i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={doctor.owner !== this.props.account.owner}
                style={{marginBottom: "10px"}}
                title={
                  i18next.t("general:Sure to delete") + `: ${doctor.name} ?`
                }
                onConfirm={() => this.deleteDoctor(index)}
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
          dataSource={doctors}
          rowKey={(doctor) => `${doctor.owner}/${doctor.name}`}
          size="middle"
          bordered
          pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("med:Doctors")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button
                type="primary"
                size="small"
                onClick={this.addDoctor.bind(this)}
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
    DoctorBackend.getDoctors(
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

export default DoctorListPage;

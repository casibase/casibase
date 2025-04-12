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
import {Button, Table, Tag} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as MachineBackend from "./backend/MachineBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./modal/PopconfirmModal";
import ConnectModal from "./modal/ConnectModal";

class MachineListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newMachine() {
    return {
      owner: this.props.account.owner,
      provider: "provider_1",
      name: `machine_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      expireTime: "",
      displayName: `New Machine - ${Setting.getRandomName()}`,
      region: "us-west",
      zone: "Zone 1",
      category: "Standard",
      type: "Pay As You Go",
      size: "Standard_D4ls_v5",
      image: "Ubuntu 24.04",
      os: "Linux",
      publicIp: "",
      privateIp: "",
      state: "Active",
    };
  }

  addMachine() {
    const newMachine = this.newMachine();
    MachineBackend.addMachine(newMachine)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/machines/${newMachine.owner}/${newMachine.name}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteMachine(i) {
    MachineBackend.deleteMachine(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
            pagination: {total: this.state.pagination.total - 1},
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  renderDownloadXlsxButton() {
    return (
      <Button size="small" style={{marginRight: "10px"}} onClick={() => {
        const data = [];
        this.state.data.filter(item => item.author !== "AI").forEach((item, i) => {
          const row = {};
          row[i18next.t("message:Chat")] = item.chat;
          row[i18next.t("general:Message")] = item.name;
          row[i18next.t("general:Created time")] = Setting.getFormattedDate(item.createdTime);
          row[i18next.t("general:User")] = item.user;
          row[i18next.t("general:Text")] = item.text;
          row[i18next.t("message:Error text")] = item.errorText;
          data.push(row);
        });

        const sheet = Setting.json2sheet(data);
        sheet["!cols"] = [
          {wch: 15},
          {wch: 15},
          {wch: 30},
          {wch: 15},
          {wch: 50},
          {wch: 50},
        ];

        Setting.saveSheetToFile(sheet, i18next.t("general:Messages"), `${i18next.t("general:Messages")}-${Setting.getFormattedDate(moment().format())}.xlsx`);
      }}>{i18next.t("general:Download")}</Button>
    );
  }

  renderTable(messages) {
    let columns = [
      // {
      //   title: i18next.t("general:Owner"),
      //   dataIndex: "owner",
      //   key: "owner",
      //   width: "90px",
      //   sorter: (a, b) => a.owner.localeCompare(b.owner),
      // },
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, machine, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "120px",
        sorter: (a, b) => a.provider.localeCompare(b.provider),
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
            <Link to={`/machines/${record.owner}/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Expire time"),
        dataIndex: "expireTime",
        key: "expireTime",
        width: "160px",
        // sorter: true,
        sorter: (a, b) => a.expireTime.localeCompare(b.expireTime),
        render: (text, machine, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Region"),
        dataIndex: "region",
        key: "region",
        width: "120px",
        sorter: (a, b) => a.region.localeCompare(b.region),
      },
      {
        title: i18next.t("machine:Zone"),
        dataIndex: "zone",
        key: "zone",
        width: "120px",
        sorter: (a, b) => a.zone.localeCompare(b.zone),
      },
      {
        title: i18next.t("message:Knowledge"),
        dataIndex: "knowledge",
        key: "knowledge",
        width: "100px",
        sorter: (a, b) => a.knowledge.localeCompare(b.knowledge),
        render: (text, record, index) => {
          return record.vectorScores?.map(vectorScore => {
            return (
              <a key={vectorScore.vector} target="_blank" rel="noreferrer" href={`/vectors/${vectorScore.vector}`}>
                <Tag style={{marginTop: "5px"}} color={"processing"}>
                  {vectorScore.score}
                </Tag>
              </a>
            );
          });
        },
      },
      {
        title: i18next.t("general:Size"),
        dataIndex: "size",
        key: "size",
        width: "120px",
        sorter: (a, b) => a.size.localeCompare(b.size),
      },
      {
        title: i18next.t("machine:Image"),
        dataIndex: "image",
        key: "image",
        width: "120px",
        sorter: (a, b) => a.image.localeCompare(b.image),
      },
      {
        title: i18next.t("machine:Public IP"),
        dataIndex: "publicIp",
        key: "publicIp",
        width: "120px",
        sorter: (a, b) => a.publicIp.localeCompare(b.publicIp),
      },
      {
        title: i18next.t("machine:Private IP"),
        dataIndex: "privateIp",
        key: "privateIp",
        width: "120px",
        sorter: (a, b) => a.privateIp.localeCompare(b.privateIp),
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: "100px",
        sorter: (a, b) => a.state.localeCompare(b.state),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "260px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, machine, index) => {
          return (
            <div>
              <ConnectModal
                owner={machine.owner}
                name={machine.name}
                category={"machine"}
                node={machine}
              />
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/machines/${machine.owner}/${machine.name}`)}
              >{i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={machine.owner !== this.props.account.owner}
                title={i18next.t("general:Sure to delete") + `: ${machine.name} ?`}
                onConfirm={() => this.deleteMachine(index)}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    if (!this.props.account || this.props.account.name !== "admin") {
      columns = columns.filter(column => column.key !== "name" && column.key !== "tokenCount" && column.key !== "price");

      const tokenCountIndex = columns.findIndex(column => column.key === "tokenCount");
      if (tokenCountIndex !== -1) {
        const [tokenCountElement] = columns.splice(tokenCountIndex, 1);

        const actionIndex = columns.findIndex(column => column.key === "action");
        const insertIndex = actionIndex !== -1 ? actionIndex : columns.length;
        columns.splice(insertIndex, 0, tokenCountElement);
      }
    }

    const paginationProps = {
      total: this.state.pagination.total,
      pageSize: this.state.pagination.pageSize,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={messages} rowKey="name" size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Messages")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button disabled={!Setting.isLocalAdminUser(this.props.account)} type="primary" size="small" onClick={this.addMessage.bind(this)}>{i18next.t("general:Add")}</Button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              {
                this.renderDownloadXlsxButton()
              }
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Users")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(messages, "user"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Chats")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(messages, "chat"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Messages")}:
              &nbsp;
              {Setting.getDisplayTag(this.state.pagination.total)}
              {
                (!this.props.account || this.props.account.name !== "admin") ? null : (
                  <React.Fragment>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Tokens")}:
                    &nbsp;
                    {Setting.getDisplayTag(Setting.sumFields(messages, "tokenCount"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("chat:Price")}:
                    &nbsp;
                    {Setting.getDisplayPrice(Setting.sumFields(messages, "price"))}
                  </React.Fragment>
                )
              }
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
    MachineBackend.getMachines(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default MachineListPage;

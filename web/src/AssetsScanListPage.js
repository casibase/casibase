// Copyright 2023 The casbin Authors. All Rights Reserved.
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

import {Button, Table} from "antd";
import i18next from "i18next";
import React from "react";
import * as AssetsScanBackend from "./backend/AssetsScanBackend";
import * as Setting from "./Setting";

class AssetsScanListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scans: null,
    };
  }

  getAllScans() {
    AssetsScanBackend.getAllScans().then(data => {
      if (data["status"] === "ok") {
        this.setState({
          scans: data["data"],
        });
      } else {
        Setting.showMessage("error", `failed to get assets scan list: ${data["msg"]}`);
      }
    });
  }

  deleteScan(id) {
    AssetsScanBackend.deleteAssetsScan(id).then((data) => {
      if (data.status === "ok") {
        Setting.showMessage("success", `Successfully deleted scan ${id}`);
        this.setState({
          scans: this.state.scans.filter((scan) => scan.id !== id),
        });
      } else {
        Setting.showMessage("error", `Failed to delete scan ${id}: ${data.msg}`);
      }
    });
  }

  componentDidMount() {
    this.getAllScans();
  }

  renderTable() {
    const columns = [
      {
        title: i18next.t("general:Assets Name"),
        dataIndex: "name",
        key: "name",
        width: "90px",
        render: (text, record, index) => {
          if (!record.name) {
            text = "Default Name";
          }
          return <a href={`/assets/${record.id}`}>{text}</a>;
        },
      },
      {
        title: i18next.t("general:Created At"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "90px",
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Target Host"),
        dataIndex: "targetHost",
        key: "targetHost",
        width: "30px",
        fixed: "right",
        render: (text, record, index) => {
          return <div>
            {record.targets.map((target, index) => {
              return <span key={index}>{`${target.host}; `}</span>;
            })}
          </div>;
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "90px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={() => {
                this.props.history.push(`/assets/${record.id}`);
              }}>{i18next.t("general:Detail")}</Button>
              <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={() => {
                if (window.confirm("Do you really want to delete scan")) {
                  this.deleteScan(record.id);
                }
              }}>{i18next.t("general:Delete")}</Button>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={this.state.scans} rowKey="name" size="middle"
          bordered
          pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("assets:Assets List")}
              <Button type="primary" size="small" style={{marginLeft: "20px"}} onClick={() => {
                this.props.history.push("/assets/0");
              }}>{i18next.t("general:New Assets")}</Button>
            </div>
          )}
          loading={this.state.scans === null}
          rowClassName={(record, index) => {
            return record.isDeleted ? "highlight-row" : "";
          }}
        />
      </div>
    );
  }

  render() {
    return <div>
      {this.renderTable()}
    </div>;
  }
}

export default AssetsScanListPage;

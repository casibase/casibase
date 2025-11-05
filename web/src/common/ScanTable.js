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
import {Table, Tag} from "antd";
import i18next from "i18next";
import * as Setting from "../Setting";
import {ScanResultPopover} from "./ScanResultPopover";

class ScanTable extends React.Component {
  getProviderLogo(provider) {
    if (!provider) {
      return null;
    }

    const otherProviderInfo = Setting.getOtherProviderInfo();
    if (!otherProviderInfo[provider.category] || !otherProviderInfo[provider.category][provider.type]) {
      return null;
    }

    return otherProviderInfo[provider.category][provider.type].logo;
  }

  render() {
    const {scans, providers = [], showAsset = false, compact = false} = this.props;

    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: compact ? "120px" : "150px",
        render: (text, record, index) => {
          return (
            <Link to={`/scans/${text}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: compact ? "150px" : "200px",
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: compact ? "120px" : "160px",
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
    ];

    if (showAsset) {
      columns.push({
        title: i18next.t("scan:Asset"),
        dataIndex: "asset",
        key: "asset",
        width: compact ? "100px" : "150px",
        render: (text, record, index) => {
          if (!text) {
            return i18next.t("general:None");
          }
          return (
            <Link to={`/assets/${text}`}>{text}</Link>
          );
        },
      });
    }

    columns.push(
      {
        title: i18next.t("scan:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: compact ? "150px" : "200px",
        render: (text, record, index) => {
          if (!text) {
            return i18next.t("general:None");
          }
          const provider = providers.find(p => p.name === text);
          const logo = this.getProviderLogo(provider);

          return (
            <Link to={`/providers/${text}`}>
              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                {logo && <img src={logo} alt={text} style={{width: "20px", height: "20px"}} />}
                <span>{record.resultSummary || text}</span>
              </div>
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: compact ? "80px" : "120px",
        render: (text, record, index) => {
          let color = "default";
          if (text === "Completed") {
            color = "success";
          } else if (text === "Failed") {
            color = "error";
          } else if (text === "Running") {
            color = "processing";
          }
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: i18next.t("scan:Result"),
        dataIndex: "result",
        key: "result",
        width: compact ? "80px" : "120px",
        render: (text, record, index) => {
          if (!text || text === "") {
            return i18next.t("general:None");
          }
          return (
            <ScanResultPopover
              result={text}
              providerType={record.providerType || "Nmap"}
            />
          );
        },
      }
    );

    return (
      <Table
        columns={columns}
        dataSource={scans}
        rowKey={(record) => `${record.owner}/${record.name}`}
        size={compact ? "small" : ""}
        pagination={compact ? false : {pageSize: 10}}
        scroll={compact ? {x: "max-content"} : undefined}
      />
    );
  }
}

export default ScanTable;

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
import {Alert, Space, Table, Tag, Typography} from "antd";
import i18next from "i18next";

const {Text} = Typography;

class OsPatchResultRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patches: null,
      error: null,
    };
  }

  componentDidMount() {
    this.parseResult();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.result !== this.props.result) {
      this.parseResult();
    }
  }

  parseResult() {
    const {result} = this.props;
    if (!result) {
      this.setState({patches: null, error: null});
      return;
    }

    try {
      const parsed = JSON.parse(result);
      this.setState({patches: Array.isArray(parsed) ? parsed : [parsed], error: null});
    } catch (e) {
      this.setState({patches: null, error: "Failed to parse scan result: " + e.message});
    }
  }

  renderStatus(status) {
    const colorMap = {
      "Available": "blue",
      "Downloaded": "cyan",
      "Installed": "green",
      "Pending Restart": "orange",
      "Succeeded": "green",
      "Failed": "red",
    };
    return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
  }

  renderBooleanTag(value, trueText, falseText) {
    if (value === true) {
      return <Tag color="orange">{trueText || "Yes"}</Tag>;
    } else if (value === false) {
      return <Tag color="green">{falseText || "No"}</Tag>;
    }
    return null;
  }

  render() {
    const {patches, error} = this.state;

    if (error) {
      return <Alert message={i18next.t("general:Error")} description={error} type="error" showIcon />;
    }

    if (!patches || patches.length === 0) {
      return <Alert message={i18next.t("scan:No patches found")} type="info" />;
    }

    const columns = [
      {
        title: i18next.t("scan:Title"),
        dataIndex: "title",
        key: "title",
        width: "30%",
        ellipsis: true,
      },
      {
        title: i18next.t("scan:KB"),
        dataIndex: "kb",
        key: "kb",
        width: "10%",
        render: (kb) => <Text code>{kb}</Text>,
      },
      {
        title: i18next.t("scan:Status"),
        dataIndex: "status",
        key: "status",
        width: "12%",
        render: (status) => this.renderStatus(status),
      },
      {
        title: i18next.t("scan:Size"),
        dataIndex: "size",
        key: "size",
        width: "10%",
      },
      {
        title: i18next.t("scan:Reboot Required"),
        dataIndex: "rebootRequired",
        key: "rebootRequired",
        width: "12%",
        render: (value) => this.renderBooleanTag(value, i18next.t("scan:Required"), i18next.t("scan:Not Required")),
      },
      {
        title: i18next.t("scan:Mandatory"),
        dataIndex: "isMandatory",
        key: "isMandatory",
        width: "10%",
        render: (value) => this.renderBooleanTag(value, i18next.t("scan:Yes"), i18next.t("scan:No")),
      },
      {
        title: i18next.t("scan:Installed On"),
        dataIndex: "installedOn",
        key: "installedOn",
        width: "16%",
        render: (date) => {
          if (!date) {return null;}
          try {
            const dateObj = new Date(date);
            return dateObj.toLocaleString();
          } catch (e) {
            return date;
          }
        },
      },
    ];

    return (
      <div>
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
          <Table
            columns={columns}
            dataSource={patches}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${i18next.t("general:Total")}: ${total}`,
            }}
            size="small"
            rowKey={(record, index) => `${record.kb || index}`}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{margin: 0}}>
                  <Text strong>{i18next.t("scan:Description")}:</Text>
                  <p style={{marginTop: "8px"}}>{record.description || i18next.t("scan:No description available")}</p>
                  {record.categories && (
                    <p style={{marginTop: "8px"}}>
                      <Text strong>{i18next.t("scan:Categories")}:</Text> {record.categories}
                    </p>
                  )}
                </div>
              ),
              rowExpandable: (record) => record.description || record.categories,
            }}
          />
        </Space>
      </div>
    );
  }
}

export default OsPatchResultRenderer;

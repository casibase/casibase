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

import React from "react";
import {Link} from "react-router-dom";
import {Alert, Button, Popconfirm, Popover, Switch, Table, Tooltip, Typography} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as RecordBackend from "./backend/RecordBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./modal/PopconfirmModal";
import {CloseCircleFilled, DeleteOutlined} from "@ant-design/icons";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";

class RecordListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      providerMap: {},
      enableCrossChain: this.getEnableCrossChainFromStorage(),
      queryResult: "",
      comparisonResult: null,
      isComparing: false,
    };
  }

  componentDidMount() {
    this.getProviders();
  }

  getEnableCrossChainFromStorage() {
    const saved = localStorage.getItem("enableCrossChain");
    if (saved === null || saved === undefined) {
      return false;
    }
    return JSON.parse(saved) === true;
  }

  toggleEnableCrossChain = () => {
    const newValue = !this.state.enableCrossChain;
    this.setState({
      enableCrossChain: newValue,
    });
    localStorage.setItem("enableCrossChain", JSON.stringify(newValue));
  };

  getProviders() {
    ProviderBackend.getProviders(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          const providerMap = {};
          for (const provider of res.data) {
            providerMap[provider.name] = provider;
          }
          this.setState({
            providerMap: providerMap,
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  newRecord() {
    return {
      owner: this.props.account.owner,
      name: Setting.GenerateId(),
      createdTime: moment().format(),
      provider: "",
      organization: this.props.account.owner,
      clientIp: "::1",
      user: this.props.account.name,
      method: "POST",
      requestUri: "/api/get-account",
      action: "login",
      isTriggered: false,
    };
  }

  addRecord() {
    const newRecord = this.newRecord();
    RecordBackend.addRecord(newRecord)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/records/${newRecord.owner}/${newRecord.id}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return RecordBackend.deleteRecord(this.state.data[i]);
  };

  deleteRecord(i) {
    RecordBackend.deleteRecord(this.state.data[i])
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

  commitRecord(i, isFirst = true) {
    const commitMethod = isFirst ? RecordBackend.commitRecord : RecordBackend.commitRecordSecond;
    commitMethod(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully committed"));
          this.fetch({
            pagination: this.state.pagination,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to commit")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to commit")}: ${error}`);
      });
  }

  parseQueryResult(queryResult) {
    try {
      const lines = queryResult.split("\n");
      const blockMatch = lines[0].match(/block \[(\d+)\]/);
      const blockId = blockMatch ? blockMatch[1] : "Unknown";

      const isMatched = lines[0].includes("Matched");

      if (isMatched) {
        const dataStartIndex = lines.findIndex(line => line.includes("Data:"));
        if (dataStartIndex !== -1) {
          const data = lines.slice(dataStartIndex + 2).join("\n").trim();
          return {
            status: "matched",
            blockId,
            data: data,
            parsedData: this.tryParseJSON(data),
          };
        }
      } else {
        const chainDataStart = lines.findIndex(line => line.includes("Chain data:"));
        const localDataStart = lines.findIndex(line => line.includes("Local data:"));

        if (chainDataStart !== -1 && localDataStart !== -1) {
          const chainData = lines.slice(chainDataStart + 2, localDataStart - 1).join("\n").trim();
          const localData = lines.slice(localDataStart + 2).join("\n").trim();

          return {
            status: "mismatched",
            blockId,
            chainData: chainData,
            localData: localData,
            parsedChainData: this.tryParseJSON(chainData),
            parsedLocalData: this.tryParseJSON(localData),
          };
        }
      }

      return {
        status: "unknown",
        blockId: "Unknown",
        rawData: queryResult,
      };
    } catch (error) {
      return {
        status: "error",
        blockId: "Error",
        error: error.message,
        rawData: queryResult,
      };
    }
  }

  tryParseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }

  formatFieldPath(path) {
    if (path.startsWith("value.")) {
      return path.substring(6);
    }
    return path;
  }

  formatFieldValue(value) {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "string") {
      if (value.length > 50) {
        return value.substring(0, 50) + "...";
      }
      return value;
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  detectDifferences(chainData, localData) {
    const differences = [];

    if (!chainData || !localData) {
      return differences;
    }

    const compareObjects = (chainObj, localObj, path = "") => {
      for (const key in chainObj) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in localObj)) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: i18next.t("general:Error"),
            type: "missing",
          });
        } else if (typeof chainObj[key] !== typeof localObj[key]) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: localObj[key],
            type: "type_mismatch",
          });
        } else if (typeof chainObj[key] === "object" && chainObj[key] !== null && !Array.isArray(chainObj[key])) {
          compareObjects(chainObj[key], localObj[key], currentPath);
        } else if (chainObj[key] !== localObj[key]) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: localObj[key],
            type: "value_mismatch",
          });
        }
      }
    };

    try {
      let chainValueObj = chainData;
      let localValueObj = localData;

      if (chainData.value && typeof chainData.value === "string") {
        try {
          chainValueObj = JSON.parse(chainData.value);
        } catch (e) {
          // console.warn("Failed to parse chain data value:", e);
        }
      }

      if (localData.value && typeof localData.value === "string") {
        try {
          localValueObj = JSON.parse(localData.value);
        } catch (e) {
          // console.warn("Failed to parse local data value:", e);
        }
      }

      compareObjects(chainValueObj, localValueObj);
    } catch (error) {
      // console.error("Error comparing objects:", error);
      compareObjects(chainData, localData);
    }

    return differences;
  }

  queryRecord(record, isFirst = true) {
    this.setState({
      isComparing: true,
      comparisonResult: null,
    });

    const queryMethod = isFirst ? RecordBackend.queryRecord : RecordBackend.queryRecordSecond;
    queryMethod(record.owner, record.name).then((res) => {
      if (res.status === "ok") {
        const queryResult = res.data;
        const comparisonResult = this.parseQueryResult(queryResult);

        if (comparisonResult.status === "mismatched" && comparisonResult.parsedChainData && comparisonResult.parsedLocalData) {
          comparisonResult.differences = this.detectDifferences(
            comparisonResult.parsedChainData,
            comparisonResult.parsedLocalData
          );
        }

        this.setState({
          queryResult: queryResult,
          comparisonResult: comparisonResult,
          isComparing: false,
        });
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to query record")}: ${res.msg}`);
        this.setState({isComparing: false});
      }
    }).catch((error) => {
      Setting.showMessage("error", `Query failed: ${error.message}`);
      this.setState({isComparing: false});
    });
  }

  renderTable(records) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "organization",
        key: "organization",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("organization"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:ID"),
        dataIndex: "id",
        key: "id",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("id"),
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "300px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/records/${record.organization}/${record.id}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Client IP"),
        dataIndex: "clientIp",
        key: "clientIp",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("clientIp"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={`https://db-ip.com/${text}`}>
              {text}
            </a>
          );
        },
      },
      // {
      //   title: i18next.t("general:User agent"),
      //   dataIndex: "userAgent",
      //   key: "userAgent",
      //   width: "150px",
      //   sorter: true,
      //   ...this.getColumnSearchProps("userAgent"),
      //   render: (text, record, index) => {
      //     return text;
      //   },
      // },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "150px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("vector:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("provider"),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      (this.state.enableCrossChain ? {
        title: i18next.t("vector:Provider") + " 2",
        dataIndex: "provider2",
        key: "provider2",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("provider2"),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      } : {
        title: i18next.t("vector:Provider") + " 2",
        hidden: true,
      }),
      {
        title: i18next.t("general:User"),
        dataIndex: "user",
        key: "user",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("user"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${record.organization}/${record.user}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Method"),
        dataIndex: "method",
        key: "method",
        width: "110px",
        sorter: true,
        filterMultiple: false,
        filters: [
          {text: "GET", value: "GET"},
          {text: "HEAD", value: "HEAD"},
          {text: "POST", value: "POST"},
          {text: "PUT", value: "PUT"},
          {text: "DELETE", value: "DELETE"},
          {text: "CONNECT", value: "CONNECT"},
          {text: "OPTIONS", value: "OPTIONS"},
          {text: "TRACE", value: "TRACE"},
          {text: "PATCH", value: "PATCH"},
        ],
      },
      {
        title: i18next.t("general:Request URI"),
        dataIndex: "requestUri",
        key: "requestUri",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("requestUri"),
      },
      {
        title: i18next.t("general:Language"),
        dataIndex: "language",
        key: "language",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("language"),
      },
      // TODO i18n
      {
        title: i18next.t("general:Region"),
        dataIndex: "region",
        key: "region",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("region"),
      },
      {
        title: i18next.t("general:City"),
        dataIndex: "city",
        key: "city",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("city"),
      },
      {
        title: i18next.t("general:Unit"),
        dataIndex: "unit",
        key: "unit",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("unit"),
      },
      {
        title: i18next.t("general:Section"),
        dataIndex: "section",
        key: "section",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("section"),
      },
      {
        title: i18next.t("general:Response"),
        dataIndex: "response",
        key: "response",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("response"),
      },
      {
        title: i18next.t("record:Object"),
        dataIndex: "object",
        key: "object",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("object"),
        render: (text, record, index) => {
          if (!text || text === "") {
            return (
              <div style={{maxWidth: "200px"}}>
                {Setting.getShortText(text, 50)}
              </div>
            );
          }

          let formattedText;
          let isValidJson = false;
          let errorMessage;

          try {
            // Try to parse and format JSON
            const parsedJson = JSON.parse(text);
            formattedText = JSON.stringify(parsedJson, null, 2);
            isValidJson = true;
          } catch (error) {
            // If parsing fails, use original text
            formattedText = text;
            isValidJson = false;
            errorMessage = error.message;
          }

          return (
            <Popover
              placement="right"
              content={
                <div style={{width: "600px", height: "400px", display: "flex", flexDirection: "column", gap: "12px"}}>
                  {!isValidJson && (
                    <Alert type="error" showIcon message={
                      <Typography.Paragraph ellipsis={{expandable: "collapsible"}} style={{margin: 0}}>{errorMessage}</Typography.Paragraph>}
                    />)}
                  <CodeMirror
                    value={formattedText}
                    options={{
                      mode: isValidJson ? "application/json" : "text/plain",
                      theme: "material-darker",
                      readOnly: true,
                      lineNumbers: true,
                    }}
                    editorDidMount={(editor) => {
                      if (window.ResizeObserver) {
                        const resizeObserver = new ResizeObserver(() => {
                          editor.refresh();
                        });
                        resizeObserver.observe(editor.getWrapperElement().parentNode);
                      }
                    }}
                  />
                </div>
              }
              trigger="hover"
            >
              <div style={{maxWidth: "200px", cursor: "pointer"}}>
                {Setting.getShortText(text, 50)}
              </div>
            </Popover>
          );
        },
      },
      {
        title: i18next.t("message:Error text"),
        dataIndex: "errorText",
        key: "errorText",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("errorText"),
        render: (text, record, index) => {
          return (text !== "" ? <Alert description={text} type="error" showIcon style={{padding: "4px"}} icon={<CloseCircleFilled style={{fontSize: "16px", margin: "4px 8px 0 4px"}} />} /> : null);
        },
      },
      {
        title: i18next.t("general:Is triggered"),
        dataIndex: "isTriggered",
        key: "isTriggered",
        width: "140px",
        sorter: true,
        render: (text, record, index) => {
          if (!["signup", "login", "logout", "update-user"].includes(record.action)) {
            return null;
          }

          return (
            <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" checked={text} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("action"),
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("general:Block"),
        dataIndex: "block",
        key: "block",
        width: "110px",
        sorter: true,
        fixed: (Setting.isMobile()) ? "false" : "right",
        ...this.getColumnSearchProps("block"),
        render: (text, record, index) => {
          return Setting.getBlockBrowserUrl(this.state.providerMap, record, text, true);
        },
      },
      (this.state.enableCrossChain ? {
        title: i18next.t("general:Block") + " 2",
        dataIndex: "block2",
        key: "block2",
        width: "110px",
        sorter: true,
        fixed: (Setting.isMobile()) ? "false" : "right",
        ...this.getColumnSearchProps("block2"),
        render: (text, record, index) => {
          return Setting.getBlockBrowserUrl(this.state.providerMap, record, text, false);
        },
      } : {
        title: i18next.t("general:Block") + " 2",
        hidden: true,
      }),
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: this.state.enableCrossChain ? "370px" : "270px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              marginTop: "10px",
              marginBottom: "10px",
            }}>
              {
                <>
                  {(record.block === "") ? (
                    <Button
                      disabled={record.block !== ""}
                      type="primary" danger
                      onClick={() => this.commitRecord(index, true)}
                    >{i18next.t("record:Commit")}
                    </Button>
                  ) : (
                    <Popover
                      placement="left"
                      title={i18next.t("general:Result")}
                      content={
                        <div style={{width: "800px", maxHeight: "600px", overflow: "auto"}}>
                          {this.state.isComparing ? (
                            <div style={{textAlign: "center", padding: "40px"}}>
                              <div style={{fontSize: "24px", marginBottom: "16px"}}>🔄</div>
                              <div>{i18next.t("general:Loading...")}</div>
                            </div>
                          ) : (
                            this.renderComparisonResult(this.state.comparisonResult)
                          )}
                        </div>
                      }
                      trigger="click"
                    >
                      <Button
                        disabled={record.block === ""}
                        type="primary"
                        onClick={() => this.queryRecord(record, true)}
                      >{i18next.t("record:Query")}
                      </Button>
                    </Popover>
                  )}
                  {this.state.enableCrossChain && (
                    (record.block2 === "") ? (
                      <Tooltip title={record.provider2 === "" ? i18next.t("general:Error") : ""}>
                        <Button
                          disabled={record.provider2 === ""}
                          type="primary" danger
                          onClick={() => this.commitRecord(index, false)}
                        >{i18next.t("record:Commit") + " 2"}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Popover
                        placement="left"
                        title={i18next.t("general:Result") + " 2"}
                        content={
                          <div style={{width: "800px", maxHeight: "600px", overflow: "auto"}}>
                            {this.state.isComparing ? (
                              <div style={{textAlign: "center", padding: "40px"}}>
                                <div style={{fontSize: "24px", marginBottom: "16px"}}>🔄</div>
                                <div>{i18next.t("general:Loading...")}</div>
                              </div>
                            ) : (
                              this.renderComparisonResult(this.state.comparisonResult)
                            )}
                          </div>
                        }
                        trigger="click"
                      >
                        <Button
                          disabled={record.block2 === ""}
                          type="primary"
                          onClick={() => this.queryRecord(record, false)}
                        >{i18next.t("record:Query") + " 2"}
                        </Button>
                      </Popover>
                    )
                  )}
                </>
              }
              <Button
                // disabled={record.owner !== this.props.account.owner}
                onClick={() => this.props.history.push(`/records/${record.owner}/${record.id}`)}
              >{i18next.t("general:View")}
              </Button>
              <PopconfirmModal
                // disabled={record.owner !== this.props.account.owner}
                fakeDisabled={true}
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteRecord(index)}
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
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={records} rowKey={(record) => `${record.owner}/${record.name}`} rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Records")}
              {Setting.isAdminUser(this.props.account) && (
                <span style={{marginLeft: 32}}>
                  {i18next.t("record:Enable cross-chain")}:
                  <Switch checked={this.state.enableCrossChain} onChange={this.toggleEnableCrossChain} style={{marginLeft: 8}} />
                </span>
              )}
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  renderComparisonResult(comparisonResult) {
    if (!comparisonResult) {
      return null;
    }

    const {status, blockId, differences} = comparisonResult;

    if (status === "matched") {
      return (
        <div className="comparison-result matched">
          <div className="result-header success">
            <div className="status-icon">🟢</div>
            <div className="status-info">
              <h3>{i18next.t("record:Data Verification")}</h3>
              <p>{i18next.t("general:Success")}</p>
            </div>
          </div>

          <div className="result-details">
            <div className="detail-item">
              <span className="label">📍 {i18next.t("general:Block")}:</span>
              <span className="value">{blockId}</span>
            </div>
            <div className="detail-item">
              <span className="label">✅ {i18next.t("general:Status")}:</span>
              <span className="value success">{i18next.t("general:Success")}</span>
            </div>
          </div>

          <div className="data-section">
            <h4>📋 {i18next.t("general:Data")}</h4>
            <div className="json-display">
              <pre>{comparisonResult.data}</pre>
            </div>
          </div>
        </div>
      );
    }

    if (status === "mismatched") {
      return (
        <div className="comparison-result mismatched">
          <div className="result-header error">
            <div className="status-icon">🔴</div>
            <div className="status-info">
              <h3>{i18next.t("record:Data Verification")}</h3>
              <p>{i18next.t("general:Error")}</p>
            </div>
          </div>

          <div className="result-details">
            <div className="detail-item">
              <span className="label">📍 {i18next.t("general:Block")}:</span>
              <span className="value">{blockId}</span>
            </div>
            <div className="detail-item">
              <span className="label">❌ {i18next.t("general:Status")}:</span>
              <span className="value error">{i18next.t("general:Error")}</span>
            </div>
          </div>

          <div className="data-comparison">
            <div className="comparison-section">
              <h4>🔗 {i18next.t("provider:Chain")}</h4>
              <div className="json-display">
                <pre>{comparisonResult.chainData}</pre>
              </div>
            </div>

            <div className="comparison-section">
              <h4>💾 {i18next.t("general:Local")}</h4>
              <div className="json-display">
                <pre>{comparisonResult.localData}</pre>
              </div>
            </div>
          </div>

          {differences && differences.length > 0 && (
            <div className="differences-section">
              <h4>🔍 {i18next.t("general:Result")}</h4>
              <div className="differences-list">
                {differences.map((diff, index) => (
                  <div key={index} className="difference-item">
                    <div className="difference-path">
                      <strong>{i18next.t("general:Data")} &quot;{this.formatFieldPath(diff.path)}&quot;:</strong>
                    </div>
                    <div className="difference-values">
                      <span className="chain-value">
                        {i18next.t("provider:Chain")}: <code>{this.formatFieldValue(diff.chainValue)}</code>
                      </span>
                      <span className="separator">→</span>
                      <span className="local-value">
                        {i18next.t("general:Local")}: <code>{this.formatFieldValue(diff.localValue)}</code>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="comparison-result unknown">
        <div className="result-header warning">
          <div className="status-icon">🟡</div>
          <div className="status-info">
            <h3>{i18next.t("general:Error")}</h3>
            <p>{i18next.t("general:Error")}</p>
          </div>
        </div>

        <div className="raw-data">
          <h4>{i18next.t("general:Data")}</h4>
          <pre>{comparisonResult.rawData || i18next.t("general:Data")}</pre>
        </div>
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
    RecordBackend.getRecords(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

const styles = `
  .comparison-result {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .comparison-result.matched {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #22c55e;
  }

  .comparison-result.mismatched {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 2px solid #ef4444;
    animation: pulse 2s infinite;
  }

  .comparison-result.unknown {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 2px solid #f59e0b;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .result-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    border-radius: 8px;
  }

  .result-header.success {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 1px solid #22c55e;
  }

  .result-header.error {
    background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
    border: 1px solid #ef4444;
  }

  .result-header.warning {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
  }

  .status-icon {
    font-size: 32px;
    margin-right: 16px;
  }

  .status-info h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .status-info p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }

  .result-details {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .detail-item:last-child {
    margin-bottom: 0;
  }

  .detail-item .label {
    font-weight: 600;
    color: #374151;
    min-width: 80px;
    margin-right: 12px;
  }

  .detail-item .value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
  }

  .detail-item .value.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #22c55e;
  }

  .detail-item .value.error {
    background: #fecaca;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  .data-section, .data-comparison, .differences-section {
    margin-bottom: 20px;
  }

  .data-section h4, .data-comparison h4, .differences-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
  }

  .json-display {
    background: #1e1e1e;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    max-height: 200px;
    border: 1px solid #374151;
  }

  .json-display pre {
    margin: 0;
    color: #e5e7eb;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .comparison-section {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .comparison-section:last-child {
    margin-bottom: 0;
  }

  .differences-list {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    padding: 16px;
    border: 1px solid #e5e7eb;
  }

  .difference-item {
    margin-bottom: 16px;
    padding: 12px;
    background: #fef2f2;
    border-radius: 6px;
    border-left: 4px solid #ef4444;
  }

  .difference-item:last-child {
    margin-bottom: 0;
  }

  .difference-path {
    margin-bottom: 8px;
    color: #991b1b;
    font-size: 14px;
  }

  .difference-values {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .chain-value, .local-value {
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }

  .chain-value {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #22c55e;
  }

  .local-value {
    background: #fecaca;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  .separator {
    color: #6b7280;
    font-weight: bold;
    font-size: 16px;
  }

  .raw-data {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    padding: 16px;
    border: 1px solid #e5e7eb;
  }

  .raw-data pre {
    background: #f3f4f6;
    padding: 12px;
    border-radius: 4px;
    overflow: auto;
    max-height: 200px;
    font-size: 12px;
    line-height: 1.4;
    border: 1px solid #d1d5db;
  }
`;

if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default RecordListPage;

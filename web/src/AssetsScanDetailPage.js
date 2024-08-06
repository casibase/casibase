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

import {Button, Col, Input, Modal, Row, Table, Tree} from "antd";
import i18next from "i18next";
import ReactMarkdown from "react-markdown";
import * as Setting from "./Setting";
import React from "react";
import * as AssetsScanBackend from "./backend/AssetsScanBackend";

class AssetsScanDetailPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: "Default Name",
      banEditing: false,
      showScanResultModal: false,
      scanResult: "",
      showAISuggestionModal: false,
      aisuggestion: "",
      data: [],
      history: [],
    };
  }

  componentDidMount() {
    const uris = location.pathname.split("/");
    const id = uris[uris.length - 1];
    this.setState({
      banEditing: id !== "0",
    });
    if (id !== "0") {
      this.getAssetsScan(id);
    }
  }

  saveAssetsConfig() {
    for (let i = 0; i < this.state.data.length; i++) {
      if (!this.checkHostValid(this.state.data[i].host)) {
        Setting.showMessage("error", "Invalid host format:" + this.state.data[i].host);
        return;
      }
      if (!this.checkPortValid(this.state.data[i].port)) {
        Setting.showMessage("error", "Invalid port of host:" + this.state.data[i].host + ", port:" + this.state.data[i].port);
        return;
      }
    }

    const result = {
      name: this.state.name,
      targets: this.state.data,
      status: "pending",
      scanResult: "no result",
    };
    AssetsScanBackend.saveAssetsScanConfig(result).then((data) => {
      if (data.status === "ok") {
        Setting.showMessage("success", "Scan Finished Successfully.");
      } else {
        Setting.showMessage("success", "Scan Failed.");
      }
    });
  }

  getAssetsScan(id) {
    AssetsScanBackend.getAScan(id).then((data) => {
      if (data.status === "ok") {
        if (data.data && data.data.targets) {
          this.setState({
            data: data.data.targets,
            history: data.data.scanHistoryList,
          });
        }
      } else {
        Setting.showMessage("error", `failed to get assets scan: ${data.msg}`);
      }
    });
  }

  startAssetsScan(id) {
    const onStart = (event) => {
      this.getAssetsScan(id);
    };

    const onMessage = (event) => {
      if (!event || !event.data) {
        return;
      }
      Setting.showMessage("success", event.data);
    };

    const onEnd = (event) => {
      Setting.showMessage("success", event.data);
      this.getAssetsScan(id);
    };

    const onError = (event) => {
      if (!event || !event.data) {
        Setting.showMessage("error", "Unknown error");
        return;
      }
      Setting.showMessage("error", event.data);
    };

    AssetsScanBackend.startScan(id, onStart, onMessage, onEnd, onError);
  }

  updateDataList(index, field, value) {
    const newData = this.state.data.map((data, i) => {
      if (i === index) {
        return {
          ...data,
          [field]: value,
        };
      }
      return data;
    });
    this.setState({
      data: newData,
    });
  }

  checkHostValid(host) {
    if (host === "*") {
      return true;
    }
    const ips = host.split(",");
    for (let i = 0; i < ips.length; i++) {
      const ip = ips[i];
      if (ip === "*") {
        continue;
      }
      const parts = ip.split(".");
      for (let j = 0; j < parts.length; j++) {
        if (parts[j] === "*") {
          continue;
        }
        if (parts[j].includes("-")) {
          const range = parts[j].split("-");
          if (range.length !== 2) {
            return false;
          }
          const start = parseInt(range[0]);
          const end = parseInt(range[1]);
          if (isNaN(start) || isNaN(end) || start < 0 || start > 255 || end < 0 || end > 255 || start > end) {
            return false;
          }
          continue;
        }
        const num = parseInt(parts[j]);
        if (isNaN(num) || num < 0 || num > 255) {
          return false;
        }
      }
    }
    return true;
  }

  checkPortValid(port) {
    if (port === "*") {
      return true;
    }
    const ports = port.split(",");
    for (let i = 0; i < ports.length; i++) {
      const p = ports[i];
      if (p === "*") {
        continue;
      }
      if (p.includes("-")) {
        const range = p.split("-");
        if (range.length !== 2) {
          return false;
        }
        const start = parseInt(range[0]);
        const end = parseInt(range[1]);
        if (isNaN(start) || isNaN(end) || start < 0 || start > 65535 || end < 0 || end > 65535 || start > end) {
          return false;
        }
      }
      const num = parseInt(p);
      if (isNaN(num) || num < 0 || num > 65535) {
        return false;
      }
    }
    return true;
  }

  renderHostAnswerTree(treeData) {
    if (!treeData) {
      return null;
    }

    function generateNode(treeData) {
      const result = [];
      treeData.forEach((item, itemIndex) => {
        const node = {
          title: `Host up ${item["stats"]["hosts"]["up"]} in ${item["stats"]["hosts"]["total"]} hosts and finished in ${item["stats"]["finished"]["elapsed"]} seconds.`,
          key: `${itemIndex}`,
          children: [],
        };
        if (Array.isArray(item.hosts)) {
          item.hosts.forEach((host, hostIndex) => {
            const hostNode = {
              title: host["addresses"][0]["addr"],
              key: `${itemIndex}-${hostIndex}`, // 修改这里
              children: [],
            };

            host["ports"].forEach((port, portIndex) => {
              const portNode = {
                title: port["id"] + "-" + port["protocol"] + "-" + port["state"]["state"],
                key: `${itemIndex}-${hostIndex}-${portIndex}`, // 修改这里
                children: [],
              };
              hostNode.children.push(portNode);
            });
            node.children.push(hostNode);
          });
        }
        result.push(node);
      });
      return result;
    }

    return (
      <Tree showLine treeData={generateNode(treeData)} defaultExpandAll>
      </Tree>
    );
  }

  renderScanResultModal() {
    return (
      <Modal
        title={i18next.t("general:Scan Result")}
        open={this.state.showScanResultModal}
        onOk={() => {
          this.setState({
            showScanResultModal: false,
          });
        }}
        onCancel={() => {
          this.setState({
            showScanResultModal: false,
          });
        }}
      >
        <div style={{height: "500px", overflow: "auto"}}>
          {this.renderHostAnswerTree(this.state.scanResult)}
        </div>
      </Modal>
    );
  }

  renderAIResultModal() {
    return (
      <Modal
        title={i18next.t("general:AI Suggestion")}
        open={this.state.showAISuggestionModal}
        onOk={() => {
          this.setState({
            showAISuggestionModal: false,
          });
        }}
        onCancel={() => {
          this.setState({
            showAISuggestionModal: false,
          });
        }}
      >
        <div style={{
          overflow: "auto",
          maxHeight: "70vh",
        }}>
          <ReactMarkdown key={this.state.aisuggestion}>
            {(this.state.aisuggestion)}
          </ReactMarkdown>
        </div>
      </Modal>
    );
  }

  // four status:pending、running、done、error
  renderScanHistory() {
    const columns = [
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "90px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Finished time"),
        dataIndex: "finishedTime",
        key: "finishedTime",
        width: "90px",
        render: (text, record, index) => {
          if (text === "") {
            return i18next.t("general:Pending");
          }
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "90px",
        render: (text, record, index) => {
          const color = record.status === "pending" ? "yellow" : record.status === "running" ? "blue" : record.status === "done" ? "green" : "red";
          return <div style={{color: color}}>{text}</div>;
        },
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "90px",
        render: (text, record, index) => {
          return (
            <div>
              <Button type="primary" size="small" onClick={() => {
                if (record.result === "" || record.status !== "done") {
                  Setting.showMessage("error", "No result yet.");
                } else {
                  this.setState({
                    showScanResultModal: true,
                    scanResult: record.result,
                  });
                }
              }}>{i18next.t("general:See Result")}</Button>
              <Button type="primary" size="small" onClick={() => {
                if (record.aiSuggestion === "") {
                  Setting.showMessage("error", "No Suggestion yet.");
                } else {
                  this.setState({
                    showAISuggestionModal: true,
                    aisuggestion: record.aiSuggestion,
                  });
                }
              }}>{i18next.t("general:See AI Suggestion")}</Button>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table rowKey="index" columns={columns} dataSource={this.state.history} size="middle" bordered
          pagination={false}
          style={{marginTop: "20px"}}
          title={() => (
            <div>
              {i18next.t("general:Assets Scan History")}&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          )}
        />
      </div>
    );
  }

  renderHostPortTable() {
    const hostPlaceholder = "*,127.0.0.*,127.0.0.1-24,192.168.11.1";
    const portPlaceholder = "*,80,443,8080,1-1024";
    const column = [
      {
        title: i18next.t("Host"),
        dataIndex: "host",
        key: "host",
        width: "30%",
        render: (text, record, index) => {
          if (this.state.banEditing) {
            return text;
          }
          return (<Input value={text} disabled={this.state.banEditing} onChange={(e) => {
            this.updateDataList(index, "host", e.target.value);
          }} placeHolder={hostPlaceholder} />);
        },
      },
      {
        title: i18next.t("Port"),
        dataIndex: "port",
        key: "port",
        width: "30%",
        render: (text, record, index) => {
          if (this.state.banEditing) {
            return text;
          }
          return (<Input value={text} disabled={this.state.banEditing} onChange={(e) => {
            this.updateDataList(index, "port", e.target.value);
          }} placeHolder={portPlaceholder} />);
        },
      },
      {
        title: i18next.t("Action"),
        key: "action",
        render: (text, record, index) => (
          <Button disabled={this.state.banEditing} type="primary" size="small" onClick={() => {
            const data = [...this.state.data];
            data.splice(index, 1);
            this.setState({
              data: data,
            });
          }}>{i18next.t("general:Delete")}</Button>
        ),
      },
    ];

    return (
      <div>
        <Button style={{marginRight: "5px"}} type="primary" size="Large" isabled={this.state.banEditing}
          onClick={() => {
            if (!this.state.banEditing) {
              this.saveAssetsConfig();
              this.props.history.push("/assets");
            }
          }}>{i18next.t("general:Save Assets")}</Button>
        <Button style={{marginRight: "5px"}} type="primary" size="Large"
          onClick={() => {
            this.props.history.push("/assets");
          }}>{i18next.t("general:Exit")}</Button>
        <Button style={{marginRight: "5px"}} type="primary" size="Large"
          onClick={() => {
            const id = location.pathname.split("/")[location.pathname.split("/").length - 1];
            this.startAssetsScan(id);
          }}>{i18next.t("general:Start Scan")}</Button>
        <div style={{
          flexDirection: "row",
          marginTop: "20px",
        }}>
          <Row style={{marginBottom: "10px"}}>
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {i18next.t("general:Name")}:
            </Col>
            <Col span={22}>
              <Input value={this.state.name} onChange={e => {
                this.setState({name: e.target.value});
              }} />
            </Col>
          </Row>
          <Table rowKey="index" columns={column} dataSource={this.state.data} size="middle" bordered
            pagination={false}
            title={() => (
              <div>
                {i18next.t("general:Assets")}&nbsp;&nbsp;&nbsp;&nbsp;
                <Button style={{marginRight: "5px"}} type="primary" size="small" disabled={this.state.banEditing}
                  onClick={() => {
                    this.setState({
                      data: [
                        ...this.state.data,
                        {
                          host: "127.0.0.1",
                          port: "*",
                        },
                      ],
                    });
                  }}>{i18next.t("general:Add")}</Button>
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div style={{
        position: "relative",
      }}>
        {this.renderHostPortTable()}
        {this.renderScanHistory()}
        {this.renderScanResultModal()}
        {this.renderAIResultModal()}
      </div>
    );
  }
}

export default AssetsScanDetailPage;

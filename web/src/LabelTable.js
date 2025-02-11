// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {DeleteOutlined} from "@ant-design/icons";
import {Button, Col, Input, InputNumber, Row, Switch, Table, Tooltip} from "antd";
import * as Setting from "./Setting";
import i18next from "i18next";
import XLSX from "xlsx";
import {sheet2blob, showMessage} from "./Setting";
import FileSaver from "file-saver";

const {TextArea} = Input;

class LabelTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };

    this.newInputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.table.length > prevProps.table.length) {
      this.newInputRef.current && this.newInputRef.current.focus();
    }
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
  }

  updateTagOnPause(tagOnPause) {
    this.props.onUpdateTagOnPause(tagOnPause);
  }

  parseField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateField(table, index, key, value) {
    value = this.parseField(key, value);

    table[index][key] = value;
    this.updateTable(table);
  }

  getOrderedTable(table) {
    return table.slice(0).sort((a, b) => {return a.startTime - b.startTime;});
  }

  reorderTable(table) {
    table = this.getOrderedTable(table);
    this.updateTable(table);
  }

  addRow(table) {
    const currentTime = this.props.currentTime;

    if (table.filter(row => row.startTime === currentTime).length !== 0) {
      Setting.showMessage("error", `Label with startTime: ${currentTime} already exists`);
      return;
    }

    let lastEndTime = 0;
    if (table.length > 0) {
      const lastRow = table[table.length - 1];
      lastEndTime = lastRow.endTime;
    }

    const row = {id: Setting.getRandomName(), startTime: lastEndTime, endTime: currentTime, text: ""};
    if (table === undefined) {
      table = [];
    }
    table = Setting.addRow(table, row);
    table = this.getOrderedTable(table);
    this.updateTable(table);
  }

  deleteRow(table, i) {
    table = Setting.deleteRow(table, i);
    this.updateTable(table);
  }

  upRow(table, i) {
    table = Setting.swapRow(table, i - 1, i);
    this.updateTable(table);
  }

  downRow(table, i) {
    table = Setting.swapRow(table, i, i + 1);
    this.updateTable(table);
  }

  downloadLabels(table) {
    const data = [];
    table.forEach((label, i) => {
      const row = {};

      row[0] = label.startTime;
      row[1] = label.endTime;
      row[2] = label.text;
      data.push(row);
    });

    const sheet = XLSX.utils.json_to_sheet(data, {skipHeader: true});
    try {
      const blob = sheet2blob(sheet, "labels");
      const fileName = `labels-${this.props.video.name}-${table.length}.xlsx`;
      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      showMessage("error", `failed to download: ${error.message}`);
    }
  }

  renderTable(table) {
    const columns = [
      {
        title: i18next.t("general:No."),
        dataIndex: "no",
        key: "no",
        width: "70px",
        render: (text, record, index) => {
          return (
            <Button type={"text"} style={{width: "50px"}} onClick={() => {
              this.props.player.seek(record.startTime);
              this.props.screen.clear();
              this.props.videoObj.clearMaps();
            }} >
              {index + 1}
            </Button>
          );
        },
      },
      {
        title: i18next.t("video:Start time (s)"),
        dataIndex: "startTime",
        key: "startTime",
        width: "120px",
        render: (text, record, index) => {
          return (
            <InputNumber style={{width: "100%"}} min={0} value={text} onChange={value => {
              this.updateField(table, index, "startTime", value);
              if (record.endTime <= value) {
                this.updateField(table, index, "endTime", Setting.toFixed(value + 1, 3));
              }
              this.reorderTable(table);
            }} />
          );
        },
      },
      {
        title: i18next.t("video:End time (s)"),
        dataIndex: "endTime",
        key: "endTime",
        width: "120px",
        render: (text, record, index) => {
          return (
            <InputNumber style={{width: "100%"}} min={record.startTime} value={text} onChange={value => {
              this.updateField(table, index, "endTime", value);
              this.reorderTable(table);
            }} />
          );
        },
      },
      {
        title: i18next.t("video:Text"),
        dataIndex: "text",
        key: "text",
        // width: '200px',
        render: (text, record, index) => {
          const isNewRow = index === table.length - 1;
          return (
            <TextArea showCount maxLength={250} autoSize={{minRows: 1, maxRows: 15}} value={text} ref={isNewRow ? this.newInputRef : null} onChange={(e) => {
              this.updateField(table, index, "text", e.target.value);
            }} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "50px",
        render: (text, record, index) => {
          return (
            <div>
              {/* <Tooltip placement="bottomLeft" title={"Up"}>*/}
              {/*  <Button style={{marginRight: "5px"}} disabled={index === 0} icon={<UpOutlined />} size="small" onClick={() => this.upRow(table, index)} />*/}
              {/* </Tooltip>*/}
              {/* <Tooltip placement="topLeft" title={"Down"}>*/}
              {/*  <Button style={{marginRight: "5px"}} disabled={index === table.length - 1} icon={<DownOutlined />} size="small" onClick={() => this.downRow(table, index)} />*/}
              {/* </Tooltip>*/}
              <Tooltip placement="right" title={"Delete"}>
                <Button icon={<DeleteOutlined />} size="small" onClick={() => this.deleteRow(table, index)} />
              </Tooltip>
            </div>
          );
        },
      },
    ];

    let highlightIndex = -1;
    table.forEach((label, i) => {
      if (highlightIndex === -1) {
        if (label.startTime > this.props.currentTime) {
          if (i > 0) {
            highlightIndex = i - 1;
          }
        }
      }
    });

    return (
      <Table rowKey={"id"} columns={columns} dataSource={table} size="middle" bordered pagination={false}
        title={() => (
          <div>
            {this.props.title}&nbsp;&nbsp;&nbsp;&nbsp;
            <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={() => this.addRow(table)}>{i18next.t("general:Add")}</Button>
            &nbsp;&nbsp;
            {
              table.length === 0 ? null : (
                <Button style={{marginLeft: "5px", marginRight: "5px"}} size="small" onClick={() => this.downloadLabels(table)}>{i18next.t("general:Download")}</Button>
              )
            }
            &nbsp;&nbsp;&nbsp;&nbsp;
            {i18next.t("video:Tag on pause")}:
            &nbsp;&nbsp;
            <Switch checked={this.props.video.tagOnPause} onChange={checked => {
              this.updateTagOnPause(checked);
            }} />
          </div>
        )}
        rowClassName={(record, index) => {
          return (highlightIndex === index) ? "alert-row" : "";
        }}
      />
    );
  }

  render() {
    return (
      <div>
        <Row style={{marginTop: "10px"}} >
          <Col span={24}>
            {
              this.renderTable(this.props.table)
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default LabelTable;

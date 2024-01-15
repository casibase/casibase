// Copyright 2024 The casbin Authors. All Rights Reserved.
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
import {Button, Col, Input, Row, Select, Table, Tooltip} from "antd";
import {DeleteOutlined, RedoOutlined} from "@ant-design/icons";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as MessageBackend from "./backend/MessageBackend";

class TagTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
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

  updateVideoField(key, value) {
    this.props.onUpdateVideoField(key, value);
  }

  getQuestion(task, example) {
    return `${task.text.replace("{example}", example).replace("{labels}", task.labels.map(label => `"${label}"`).join(", "))}`;
  }

  trimAnswer(s) {
    let res = Setting.trim(s, "[");
    res = Setting.trim(res, "]");
    res = Setting.trim(res, "\"");
    return res;
  }

  getAnswer(task, text, rowIndex, columnIndex) {
    const provider = task.provider;
    const question = this.getQuestion(task, text);
    MessageBackend.getAnswer(provider, question)
      .then((res) => {
        if (res.status === "ok") {
          this.updateField(this.props.table, rowIndex, `tag${columnIndex + 1}`, this.trimAnswer(res.data));
        } else {
          Setting.showMessage("error", `Failed to get answer: ${res.msg}`);
        }
      });
  }

  runTask(columnIndex) {
    const task = this.props.tasks[columnIndex];
    this.props.table.forEach((row, rowIndex) => {
      if (rowIndex >= 10) {
        return;
      }

      this.getAnswer(task, row.text, rowIndex, columnIndex);
    });
  }

  clearTask(columnIndex) {
    this.props.table.forEach((row, rowIndex) => {
      if (rowIndex >= 10) {
        return;
      }

      this.updateField(this.props.table, rowIndex, `tag${columnIndex + 1}`, "");
    });
  }

  renderTable(table) {
    const columns = [
      {
        title: i18next.t("general:No."),
        dataIndex: "no",
        key: "no",
        width: "50px",
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
        title: i18next.t("video:Time"),
        dataIndex: "startTime",
        key: "startTime",
        width: "100px",
        render: (text, record, index) => {
          return Setting.getTimeFromSeconds(text);
        },
      },
      {
        title: i18next.t("video:Role"),
        dataIndex: "speaker",
        key: "speaker",
        width: "50px",
        render: (text, record, index) => {
          return Setting.getSpeakerTag(text);
        },
      },
      {
        title: i18next.t("video:Text"),
        dataIndex: "text",
        key: "text",
        // width: "200px",
      },
      {
        title: (
          <React.Fragment>
            <Select virtual={false} size={"small"} style={{width: "160px"}} value={this.props.video.task1} onChange={(value => {this.updateVideoField("task1", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Run"}>
              <Button icon={<RedoOutlined />} size="small" onClick={() => this.runTask(0)} />
            </Tooltip>
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Clear"}>
              <Button icon={<DeleteOutlined />} size="small" onClick={() => this.clearTask(0)} />
            </Tooltip>
          </React.Fragment>
        ),
        dataIndex: "tag1",
        key: "tag1",
        width: "250px",
        render: (text, record, index) => {
          return (
            <Input value={text} onChange={e => {
              this.updateField(table, index, "tag1", e.target.value);
            }} />
          );
        },
      },
      {
        title: (
          <React.Fragment>
            <Select virtual={false} size={"small"} style={{width: "160px"}} value={this.props.video.task2} onChange={(value => {this.updateVideoField("task2", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Run"}>
              <Button icon={<RedoOutlined />} size="small" onClick={() => this.runTask(1)} />
            </Tooltip>
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Clear"}>
              <Button icon={<DeleteOutlined />} size="small" onClick={() => this.clearTask(1)} />
            </Tooltip>
          </React.Fragment>
        ),
        dataIndex: "tag2",
        key: "tag2",
        width: "250px",
        render: (text, record, index) => {
          return (
            <Input value={text} onChange={e => {
              this.updateField(table, index, "tag2", e.target.value);
            }} />
          );
        },
      },
      {
        title: (
          <React.Fragment>
            <Select virtual={false} size={"small"} style={{width: "160px"}} value={this.props.video.task3} onChange={(value => {this.updateVideoField("task3", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Run"}>
              <Button icon={<RedoOutlined />} size="small" onClick={() => this.runTask(2)} />
            </Tooltip>
            &nbsp;&nbsp;
            <Tooltip placement="right" title={"Clear"}>
              <Button icon={<DeleteOutlined />} size="small" onClick={() => this.clearTask(2)} />
            </Tooltip>
          </React.Fragment>
        ),
        dataIndex: "tag3",
        key: "tag3",
        width: "250px",
        render: (text, record, index) => {
          return (
            <Input value={text} onChange={e => {
              this.updateField(table, index, "tag3", e.target.value);
            }} />
          );
        },
      },
    ];

    let highlightIndex = -1;
    table.forEach((segment, i) => {
      if (highlightIndex === -1) {
        if (segment.startTime > this.props.currentTime) {
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

export default TagTable;

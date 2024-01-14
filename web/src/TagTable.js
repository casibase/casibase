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
import {Button, Col, Input, Row, Select, Table} from "antd";
import * as Setting from "./Setting";
import i18next from "i18next";

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
            {i18next.t("video:Tag1")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Select virtual={false} size={"small"} style={{width: "120px"}} value={this.props.video.task1} onChange={(value => {this.updateVideoField("task1", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
          </React.Fragment>
        ),
        dataIndex: "tag1",
        key: "tag1",
        width: "200px",
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
            {i18next.t("video:Tag2")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Select virtual={false} size={"small"} style={{width: "120px"}} value={this.props.video.task2} onChange={(value => {this.updateVideoField("task2", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
          </React.Fragment>
        ),
        dataIndex: "tag2",
        key: "tag2",
        width: "200px",
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
            {i18next.t("video:Tag3")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Select virtual={false} size={"small"} style={{width: "120px"}} value={this.props.video.task3} onChange={(value => {this.updateVideoField("task3", value);})}
              options={this.props.tasks.map((task) => Setting.getOption(task.displayName, task.name))
              } />
          </React.Fragment>
        ),
        dataIndex: "tag3",
        key: "tag3",
        width: "200px",
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

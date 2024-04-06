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
import {Button, Col, Row, Select, Table, Tooltip} from "antd";
import {BarsOutlined, DeleteOutlined, DownOutlined, TranslationOutlined, UpOutlined} from "@ant-design/icons";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as MessageBackend from "./backend/MessageBackend";
import MemoTextArea from "./MemoTextArea";

const {Option} = Select;

class ArticleTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
  }

  submitArticleEdit() {
    this.props.onSubmitArticleEdit();
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

  addRow(table) {
    const row = {no: table.length, type: "Text", text: `New Block - ${table.length}`, textEn: "", state: ""};
    if (table === undefined) {
      table = [];
    }
    table = Setting.addRow(table, row);
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

  parseTable(table, i) {
    const target = table[i];
    const splitTexts = target.text.split("\n").filter(t => t !== "");

    let updatedTable = Setting.deleteRow(table, i);

    splitTexts.reverse().forEach((text, index) => {
      const newRow = {
        ...target,
        text: text,
        textEn: "",
      };
      updatedTable = Setting.insertRow(updatedTable, newRow, i);
    });

    this.updateTable(updatedTable);
  }

  parseTableEn(table, i) {
    const target = table[i];
    const splitTexts = target.textEn.split("\n").filter(t => t !== "");

    let updatedTable = Setting.deleteRow(table, i);

    splitTexts.reverse().forEach((text, index) => {
      const newRow = {
        ...target,
        text: "",
        textEn: text,
      };
      updatedTable = Setting.insertRow(updatedTable, newRow, i);
    });

    this.updateTable(updatedTable);
  }

  translateTableToZh(article, table, i) {
    const provider = article.provider;
    const text = table[i].textEn;
    const question = `Translate the following text to Chinese, only respond with the translated text:\n${text}`;
    const framework = article.name;
    const video = "";
    this.updateField(this.props.table, i, "isLoading", true);
    MessageBackend.getAnswer(provider, question, framework, video)
      .then((res) => {
        this.updateField(this.props.table, i, "isLoading", false);
        if (res.status === "ok") {
          // Setting.showMessage("success", "Translated EN to ZH successfully");
          this.updateField(this.props.table, i, "text", res.data);
          this.submitArticleEdit();
        } else {
          Setting.showMessage("error", `Failed to get answer: ${res.msg}`);
        }
      });
  }

  translateTableToEn(article, table, i) {
    const provider = article.provider;
    const text = table[i].text;
    const question = `Translate the following text to English, only respond with the translated text:\n${text}`;
    const framework = article.name;
    const video = "";
    this.updateField(this.props.table, i, "isLoadingEn", true);
    MessageBackend.getAnswer(provider, question, framework, video)
      .then((res) => {
        this.updateField(this.props.table, i, "isLoadingEn", false);
        if (res.status === "ok") {
          // Setting.showMessage("success", "Translated ZH to EN successfully");
          this.updateField(this.props.table, i, "textEn", res.data);
          this.submitArticleEdit();
        } else {
          Setting.showMessage("error", `Failed to get answer: ${res.msg}`);
        }
      });
  }

  renderTable(table) {
    const columns = [
      {
        title: i18next.t("general:No."),
        dataIndex: "no",
        key: "no",
        width: "60px",
        render: (text, record, index) => {
          return (index + 1);
        },
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "110px",
        render: (text, record, index) => {
          return (
            <Select virtual={false} style={{width: "100%"}} value={text} onChange={(value => {
              this.updateField(table, index, "type", value);
            })}>
              {
                [
                  {id: "Title", name: i18next.t("article:Title")},
                  {id: "Abstract", name: i18next.t("article:Abstract")},
                  {id: "Header 1", name: i18next.t("article:Header 1")},
                  {id: "Header 2", name: i18next.t("article:Header 2")},
                  {id: "Header 3", name: i18next.t("article:Header 3")},
                  {id: "Text", name: i18next.t("article:Text")},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          );
        },
      },
      {
        title: i18next.t("article:Text"),
        dataIndex: "text",
        key: "text",
        // width: '300px',
        render: (text, record, index) => {
          return (
            <MemoTextArea value={text} onChange={(e) => {
              this.updateField(table, index, "text", e.target.value);
            }} />
          );

          // return (
          //   <TextArea autoSize={{minRows: 1}} showCount value={text} onChange={(e) => {
          //     this.updateField(table, index, "text", e.target.value);
          //   }} />
          // );
        },
        // shouldCellUpdate: (record, prevRecord) => {
        //   return record.text !== prevRecord.text;
        // },
      },
      {
        title: i18next.t("article:Text En"),
        dataIndex: "textEn",
        key: "textEn",
        // width: '300px',
        render: (text, record, index) => {
          return (
            <MemoTextArea value={text} onChange={(e) => {
              this.updateField(table, index, "textEn", e.target.value);
            }} />
          );

          // return (
          //   <TextArea autoSize={{minRows: 1}} showCount value={text} onChange={(e) => {
          //     this.updateField(table, index, "textEn", e.target.value);
          //   }} />
          // );
        },
        // shouldCellUpdate: (record, prevRecord) => {
        //   return record.textEn !== prevRecord.textEn;
        // },
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "100px",
        render: (text, record, index) => {
          return (
            <div>
              <Tooltip placement="bottomLeft" title={"Parse"}>
                <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "5px"}} disabled={!record.text.includes("\n")} icon={<BarsOutlined />} onClick={() => this.parseTable(table, index)} >
                  {i18next.t("article:Parse")}
                </Button>
              </Tooltip>
              <Tooltip placement="bottomLeft" title={"Parse"}>
                <Button style={{marginBottom: "10px", marginRight: "5px"}} disabled={!record.textEn.includes("\n")} icon={<BarsOutlined />} onClick={() => this.parseTableEn(table, index)} >
                  {i18next.t("article:Parse En")}
                </Button>
              </Tooltip>
              <Tooltip placement="bottomLeft" title={"Translate to EN"}>
                <Button type="primary" style={{marginBottom: "10px", marginRight: "5px"}} disabled={record.text === ""} loading={record.isLoadingEn === true} icon={<TranslationOutlined />} onClick={() => this.translateTableToEn(this.props.article, table, index)} >
                  {i18next.t("article:ZH 🡲 EN")}
                </Button>
              </Tooltip>
              <Tooltip placement="bottomLeft" title={"Translate to ZH"}>
                <Button type="primary" style={{marginBottom: "10px", marginRight: "5px"}} disabled={record.textEn === ""} loading={record.isLoading === true} icon={<TranslationOutlined />} onClick={() => this.translateTableToZh(this.props.article, table, index)} >
                  {i18next.t("article:ZH 🡰 EN")}
                </Button>
              </Tooltip>
              <Tooltip placement="bottomLeft" title={"Up"}>
                <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={index === 0} icon={<UpOutlined />} size="small" onClick={() => this.upRow(table, index)} />
              </Tooltip>
              <Tooltip placement="topLeft" title={"Down"}>
                <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={index === table.length - 1} icon={<DownOutlined />} size="small" onClick={() => this.downRow(table, index)} />
              </Tooltip>
              <Tooltip placement="topLeft" title={"Delete"}>
                <Button icon={<DeleteOutlined />} size="small" onClick={() => this.deleteRow(table, index)} />
              </Tooltip>
            </div>
          );
        },
      },
    ];

    return (
      <Table rowKey="index" columns={columns} dataSource={table} size="middle" bordered pagination={false}
        title={() => (
          <div>
            {this.props.title}&nbsp;&nbsp;&nbsp;&nbsp;
            <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={() => this.addRow(table)}>{i18next.t("general:Add")}</Button>
            {/* {*/}
            {/*  this.props.wordset === undefined ? null : (*/}
            {/*    <Button style={{marginLeft: "5px", marginRight: "5px"}} size="small" onClick={() => Setting.downloadXlsx(this.props.wordset)}>{i18next.t("general:Download")}</Button>*/}
            {/*  )*/}
            {/* }*/}
          </div>
        )}
      />
    );
  }

  render() {
    return (
      <div>
        <Row style={{marginTop: "20px"}} >
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

export default ArticleTable;

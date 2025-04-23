// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import {Button, Col, Row, Select, Table, Tag} from "antd";
import {DeleteOutlined, DeploymentUnitOutlined, DownOutlined, FileAddOutlined, OrderedListOutlined, TranslationOutlined, UnorderedListOutlined, UpOutlined} from "@ant-design/icons";
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
    const row = {no: table.length, type: "Text", text: "", textEn: "", state: ""};
    if (table === undefined) {
      table = [];
    }
    table = Setting.addRow(table, row);
    this.updateTable(table);
  }

  insertRow(table, i) {
    const row = {no: table.length, type: "Text", text: "", textEn: "", state: ""};
    if (table === undefined) {
      table = [];
    }
    table = Setting.insertRow(table, row, i + 1);
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

  goToRow(table, i) {
    const rowId = `row-${i}`;
    const element = document.getElementById(rowId);
    if (element) {
      const viewportHeight = window.innerHeight; // Height of the viewport
      const elementOffsetTop = element.offsetTop; // Element's top offset relative to the document
      const desiredTopPosition = viewportHeight / 4; // Target position for the element's top from the viewport's top

      // Calculate the desired scroll position to align the element as specified
      const scrollToPosition = elementOffsetTop - desiredTopPosition + 300;

      // Scroll immediately to the calculated position
      window.scrollTo({top: scrollToPosition, behavior: "auto"});
    }
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
    const question = `Translate the following text to Chinese, the words related to this glossary: ${JSON.stringify(article.glossary)} should not be translated. Only respond with the translated text:\n${text}`;
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
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
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
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  expandBlock(article, table, i) {
    const provider = article.provider;
    const text = table[i].text;
    const question = `Expand the following academic paper content in a creative manner, only respond with the expanded text:\n${text}`;
    const framework = article.name;
    const video = "";
    this.updateField(this.props.table, i, "isLoadingExpand", true);
    MessageBackend.getAnswer(provider, question, framework, video)
      .then((res) => {
        this.updateField(this.props.table, i, "isLoadingExpand", false);
        if (res.status === "ok") {
          this.updateField(this.props.table, i, "text", res.data);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  renderTable(table) {
    let columns = [
      {
        title: i18next.t("general:No."),
        dataIndex: "no",
        key: "no",
        width: "60px",
        render: (text, record, index) => {
          if (record.prefix !== "") {
            return (
              <Tag color={"processing"}>
                {record.prefix}
              </Tag>
            );
          } else {
            return `Txt.${index + 1}`;
          }
        },
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "110px",
        render: (text, record, index) => {
          return (
            <div>
              <Select virtual={false} style={{width: "100%", marginTop: "10px"}} value={text} onChange={(value => {
                this.updateField(table, index, "type", value);
              })}>
                {
                  [
                    {id: "Title", name: i18next.t("general:Title")},
                    {id: "Abstract", name: i18next.t("article:Abstract")},
                    {id: "Header 1", name: i18next.t("article:Header 1")},
                    {id: "Header 2", name: i18next.t("article:Header 2")},
                    {id: "Header 3", name: i18next.t("article:Header 3")},
                    {id: "Text", name: i18next.t("general:Text")},
                  ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                }
              </Select>
              <Button type="primary" style={{marginTop: "10px", marginBottom: "10px", marginRight: "5px"}} disabled={record.text === ""} loading={record.isLoadingExpand === true} icon={<DeploymentUnitOutlined />} onClick={() => this.expandBlock(this.props.article, table, index)} >
                {i18next.t("article:Expand")}
              </Button>
            </div>
          );
        },
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        // width: '300px',
        render: (text, record, index) => {
          return (
            <MemoTextArea value={text} onChange={(e) => {
              this.updateField(this.props.table, index, "text", e.target.value);
            }} />
          );
        },
      },
      {
        title: i18next.t("article:Text En"),
        dataIndex: "textEn",
        key: "textEn",
        // width: '300px',
        render: (text, record, index) => {
          return (
            <MemoTextArea value={text} onChange={(e) => {
              this.updateField(this.props.table, index, "textEn", e.target.value);
            }} />
          );
        },
      },
      {
        title: i18next.t("store:Prompt"),
        dataIndex: "prompt",
        key: "prompt",
        // width: '300px',
        render: (text, record, index) => {
          return (
            <MemoTextArea value={text} onChange={(e) => {
              this.updateField(this.props.table, index, "prompt", e.target.value);
            }} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "100px",
        render: (text, record, index) => {
          return (
            <div>
              <Button type="primary" style={{marginTop: "10px", marginBottom: "10px", marginRight: "5px"}} disabled={record.text === ""} loading={record.isLoadingEn === true} icon={<TranslationOutlined />} onClick={() => this.translateTableToEn(this.props.article, table, index)} >
                {i18next.t("article:ZH 🡲 EN")}
              </Button>
              <Button type="primary" style={{marginBottom: "10px", marginRight: "5px"}} disabled={record.textEn === ""} loading={record.isLoading === true} icon={<TranslationOutlined />} onClick={() => this.translateTableToZh(this.props.article, table, index)} >
                {i18next.t("article:ZH 🡰 EN")}
              </Button>
              <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={!record.text.includes("\n")} icon={<OrderedListOutlined />} size="small" onClick={() => this.parseTable(table, index)} />
              <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={!record.textEn.includes("\n")} icon={<UnorderedListOutlined />} size="small" onClick={() => this.parseTableEn(table, index)} />
              <Button style={{marginBottom: "5px", marginRight: "5px"}} icon={<FileAddOutlined />} size="small" onClick={() => this.insertRow(table, index)} />
              <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={index === 0} icon={<UpOutlined />} size="small" onClick={() => this.upRow(table, index)} />
              <Button style={{marginBottom: "5px", marginRight: "5px"}} disabled={index === table.length - 1} icon={<DownOutlined />} size="small" onClick={() => this.downRow(table, index)} />
              <Button icon={<DeleteOutlined />} size="small" onClick={() => this.deleteRow(table, index)} />
            </div>
          );
        },
      },
    ];

    if (this.props.article.displayName.endsWith("-P")) {
      columns = columns.filter(column => column.key !== "textEn");
    } else {
      columns = columns.filter(column => column.key !== "prompt");
    }

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
        onRow={(record, rowIndex) => {
          return {
            id: `row-${rowIndex}`,
          };
        }}
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

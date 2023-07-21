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
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as WordsetBackend from "./backend/WordsetBackend";
import i18next from "i18next";

class WordsetListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsets: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getWordsets();
  }

  getWordsets() {
    WordsetBackend.getWordsets(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            wordsets: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get wordsets: ${res.msg}`);
        }
      });
  }

  newWordset() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `wordset_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Wordset - ${randomName}`,
      distanceLimit: 14,
      factorset: "wordFactor_utf-8",
      factors: [],
    };
  }

  addWordset() {
    const newWordset = this.newWordset();
    WordsetBackend.addWordset(newWordset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Wordset added successfully");
          this.setState({
            wordsets: Setting.prependRow(this.state.wordsets, newWordset),
          });
        } else {
          Setting.showMessage("error", `Failed to add wordset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Wordset failed to add: ${error}`);
      });
  }

  deleteWordset(i) {
    WordsetBackend.deleteWordset(this.state.wordsets[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Wordset deleted successfully");
          this.setState({
            wordsets: Setting.deleteRow(this.state.wordsets, i),
          });
        } else {
          Setting.showMessage("error", `Failed to delete wordset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Wordset failed to delete: ${error}`);
      });
  }

  renderTable(wordsets) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "120px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/wordsets/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "150px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("wordset:Words"),
        dataIndex: "factors",
        key: "factors",
        width: "120px",
        sorter: (a, b) => a.factors.localeCompare(b.factors),
        render: (text, record, index) => {
          return Setting.getTags(text, "factors");
        },
      },
      {
        title: i18next.t("wordset:Factorset"),
        dataIndex: "factorset",
        key: "factorset",
        width: "140px",
        sorter: (a, b) => a.factorset.localeCompare(b.factorset),
        render: (text, record, index) => {
          return (
            <Link to={`/factorsets/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("wordset:Matched"),
        dataIndex: "matched",
        key: "matched",
        width: "140px",
        render: (text, record, index) => {
          const allWords = record.factors.length;
          const validWords = record.factors.filter(factor => factor.data.length !== 0).length;
          return `${Setting.getPercentage(allWords === 0 ? 0 : validWords / allWords)}% (${validWords} / ${allWords})`;
        },
      },
      {
        title: i18next.t("wordset:Distance limit"),
        dataIndex: "distanceLimit",
        key: "distanceLimit",
        width: "120px",
        sorter: (a, b) => a.distanceLimit - b.distanceLimit,
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "220px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} onClick={() => Setting.openLink(`/wordsets/${record.name}/graph`)}>{i18next.t("general:Result")}</Button>
              <Button style={{marginBottom: "10px", marginRight: "10px"}} onClick={() => Setting.downloadXlsx(record)}>{i18next.t("general:Download")}</Button>
              <Button style={{marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/wordsets/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete wordset: ${record.name} ?`}
                onConfirm={() => this.deleteWordset(index)}
                okText="OK"
                cancelText="Cancel"
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={wordsets} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Wordsets")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addWordset.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={wordsets === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.wordsets)
        }
      </div>
    );
  }
}

export default WordsetListPage;

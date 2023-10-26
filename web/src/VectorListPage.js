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
import {Button, Popconfirm, Table, Tooltip} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as VectorBackend from "./backend/VectorBackend";
import i18next from "i18next";

class VectorListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      vectors: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getVectors();
  }

  getVectors() {
    VectorBackend.getVectors(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            vectors: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get vectors: ${res.msg}`);
        }
      });
  }

  newVector() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `vector_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Vector - ${randomName}`,
      store: "default-store",
      file: "/aaa/casbin.txt",
      text: "The text of vector",
      data: [0.1, 0.2, 0.3],
    };
  }

  addVector() {
    const newVector = this.newVector();
    VectorBackend.addVector(newVector)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Vector added successfully");
          this.setState({
            vectors: Setting.prependRow(this.state.vectors, newVector),
          });
        } else {
          Setting.showMessage("error", `Failed to add vector: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Vector failed to add: ${error}`);
      });
  }

  deleteVector(i) {
    VectorBackend.deleteVector(this.state.vectors[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Vector deleted successfully");
          this.setState({
            vectors: Setting.deleteRow(this.state.vectors, i),
          });
        } else {
          Setting.showMessage("error", `Vector failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Vector failed to delete: ${error}`);
      });
  }

  renderTable(vectors) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "140px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/vectors/${text}`}>
              {text}
            </Link>
          );
        },
      },
      // {
      //   title: i18next.t("general:Display name"),
      //   dataIndex: "displayName",
      //   key: "displayName",
      //   width: "200px",
      //   sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      // },
      {
        title: i18next.t("vector:Store"),
        dataIndex: "store",
        key: "store",
        width: "130px",
        sorter: (a, b) => a.store.localeCompare(b.store),
        render: (text, record, index) => {
          return (
            <Link to={`/stores/${record.owner}/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("vector:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "200px",
        sorter: (a, b) => a.provider.localeCompare(b.provider),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("vector:File"),
        dataIndex: "file",
        key: "file",
        width: "200px",
        sorter: (a, b) => a.file.localeCompare(b.file),
      },
      {
        title: i18next.t("vector:Index"),
        dataIndex: "index",
        key: "index",
        width: "80px",
        sorter: (a, b) => a.index - b.index,
      },
      {
        title: i18next.t("vector:Text"),
        dataIndex: "text",
        key: "text",
        width: "200px",
        sorter: (a, b) => a.text.localeCompare(b.text),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" title={text}>
              <div style={{maxWidth: "200px"}}>
                {Setting.getShortText(text)}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("vector:Size"),
        dataIndex: "size",
        key: "size",
        width: "80px",
        sorter: (a, b) => a.size - b.size,
      },
      {
        title: i18next.t("vector:Data"),
        dataIndex: "data",
        key: "data",
        width: "200px",
        sorter: (a, b) => a.data.localeCompare(b.data),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" title={Setting.getShortText(JSON.stringify(text), 1000)}>
              <div style={{maxWidth: "200px"}}>
                {Setting.getShortText(JSON.stringify(text))}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("vector:Dimension"),
        dataIndex: "dimension",
        key: "dimension",
        width: "80px",
        sorter: (a, b) => a.dimension - b.dimension,
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "150px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/vectors/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteVector(index)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={vectors} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Vectors")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addVector.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={vectors === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.vectors)
        }
      </div>
    );
  }
}

export default VectorListPage;

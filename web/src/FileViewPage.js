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
import {Button, Card, Col, Descriptions, Input, Row, Spin, Table} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as FileBackend from "./backend/FileBackend";
import * as VectorBackend from "./backend/VectorBackend";

const {TextArea} = Input;

class FileViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileName: decodeURIComponent(props.match.params.fileName),
      file: null,
      vectors: [],
      loading: true,
    };
  }

  UNSAFE_componentWillMount() {
    this.getFile();
  }

  getFile() {
    const fileName = this.state.fileName;
    FileBackend.getFile("admin", fileName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            file: res.data,
            fileName: fileName,
          });
          this.getVectors(res.data);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
          this.setState({loading: false});
        }
      });
  }

  getVectors(file) {
    // Fetch vectors for this file
    VectorBackend.getVectors("admin", file.store, "", "", "file", file.name, "index", "asc")
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            vectors: res.data || [],
            loading: false,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get vectors")}: ${res.msg}`);
          this.setState({loading: false});
        }
      });
  }

  renderFileInfo() {
    if (!this.state.file) {
      return null;
    }

    return (
      <Card size="small" title={i18next.t("file:File Information")} style={{marginBottom: "20px"}}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label={i18next.t("general:Name")}>{this.state.file.name}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("file:Filename")}>{this.state.file.filename}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("file:Size")}>{Setting.getFormattedSize(this.state.file.size)}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Store")}>{this.state.file.store}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("file:Storage Provider")}>{this.state.file.storageProvider}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("file:Token Count")}>{this.state.file.tokenCount}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Status")}>{this.state.file.status}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Created time")}>{Setting.getFormattedDate(this.state.file.createdTime)}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  }

  renderSegments() {
    const columns = [
      {
        title: i18next.t("vector:Segment"),
        dataIndex: "index",
        key: "index",
        width: "100px",
        render: (text, record, index) => {
          return `${i18next.t("vector:Segment")} ${record.index + 1}`;
        },
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        render: (text, record, index) => {
          return (
            <TextArea
              style={{backgroundColor: "transparent", border: "none", resize: "none"}}
              autoSize={{minRows: 2, maxRows: 20}}
              value={text}
              readOnly
            />
          );
        },
      },
      {
        title: i18next.t("general:Size"),
        dataIndex: "size",
        key: "size",
        width: "100px",
        render: (text, record, index) => {
          return `${text} ${i18next.t("vector:characters")}`;
        },
      },
    ];

    return (
      <Card size="small" title={`${i18next.t("file:Segmented Content")} (${this.state.vectors.length} ${i18next.t("vector:segments")})`}>
        <Table
          columns={columns}
          dataSource={this.state.vectors}
          rowKey="name"
          size="middle"
          bordered
          pagination={{
            pageSize: 10,
            showTotal: (total) => i18next.t("general:{total} in total").replace("{total}", total),
          }}
        />
      </Card>
    );
  }

  render() {
    if (this.state.loading) {
      return (
        <div style={{textAlign: "center", marginTop: "100px"}}>
          <Spin size="large" tip={i18next.t("general:Loading")} />
        </div>
      );
    }

    return (
      <div>
        <Row style={{marginBottom: "20px"}}>
          <Col span={24}>
            <Button onClick={() => this.props.history.push("/files")}>{i18next.t("general:Back")}</Button>
          </Col>
        </Row>
        {this.renderFileInfo()}
        {this.renderSegments()}
      </div>
    );
  }
}

export default FileViewPage;

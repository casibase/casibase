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
import {
  Badge,
  Button,
  Col,
  Collapse,
  Descriptions,
  List,
  Pagination,
  Row,
  Spin,
  Tag,
  Typography
} from "antd";
import {
  DatabaseOutlined,
  LeftOutlined,
  UnorderedListOutlined
} from "@ant-design/icons";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as FileBackend from "./backend/FileBackend";
import * as VectorBackend from "./backend/VectorBackend";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const {Text, Title} = Typography;
const {Panel} = Collapse;

class FileViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      classes: props,
      fileName: decodeURIComponent(props.match.params.fileName),
      file: null,
      vectors: [],
      loading: true,
      pagination: {
        current: 1,
        pageSize: 10,
        pageSizeOptions: ["10", "20", "50", "100"],
      },
    };

    this.listScrollRef = null;
  }

  UNSAFE_componentWillMount() {
    this.getFile();
  }

  getFile = () => {
    const {fileName} = this.state;

    FileBackend.getFile("admin", fileName).then((res) => {
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
  };

  getVectors = (file) => {
    const objectKey = file.name.startsWith(`${file.store}_`)
      ? file.name.substring(file.store.length + 1)
      : file.name;

    VectorBackend
      .getVectors("admin", file.store, "", "", "file", objectKey, "index", "asc")
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            vectors: res.data || [],
            loading: false,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")} vectors: ${res.msg}`);
          this.setState({loading: false});
        }
      });
  };

  handlePageChange = (page, pageSize) => {
    this.setState({
      pagination: {
        ...this.state.pagination,
        current: page,
        pageSize: pageSize,
      },
    }, () => {
      if (this.listScrollRef) {
        this.listScrollRef.scrollTop = 0;
      }
    });
  };

  renderHeader = () => {
    const {file, fileName} = this.state;

    return (
      <div style={{
        backgroundColor: "#fff",
        padding: "0 24px",
        height: "64px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
          <Button
            type="text"
            icon={<LeftOutlined style={{fontSize: "18px"}} />}
            onClick={() => this.props.history.goBack()}
          />

          <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
            <Title level={4} style={{margin: 0, fontSize: "16px", lineHeight: "1.2"}}>
              {file?.filename || fileName}
            </Title>
            <Text type="secondary" style={{fontSize: "12px"}}>
              <UnorderedListOutlined /> {file?.store || "Universal Store"}
            </Text>
          </div>
        </div>

        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>

        </div>
      </div>
    );
  };

  renderRightSidebar = () => {
    const {file, vectors} = this.state;

    if (!file) {
      return null;
    }

    const sectionStyle = {marginBottom: "32px"};
    const labelTitleStyle = {
      color: "#8c8c8c",
      fontSize: "12px",
      fontWeight: 500,
      textTransform: "uppercase",
      marginBottom: "4px",
      letterSpacing: "0.5px",
    };
    const valueStyle = {
      color: "#262626",
      fontSize: "14px",
      fontWeight: 600,
      wordBreak: "break-all",
    };

    const InfoItem = ({label, value, renderValue}) => (
      <Col span={24} style={{marginBottom: "12px"}}>
        <div style={labelTitleStyle}>{label}</div>
        <div style={valueStyle}>{renderValue ? renderValue : value}</div>
      </Col>
    );

    return (
      <div style={{
        padding: "24px",
        borderLeft: "1px solid #f0f0f0",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        backgroundColor: "#fff",
      }}>
        <div style={sectionStyle}>
          <Title level={5} style={{
            ...labelTitleStyle,
            fontSize: "14px",
            color: "#262626",
            marginBottom: "16px",
          }}>
            DOCUMENTATION INFO
          </Title>
          <Row gutter={[0, 0]}>
            <InfoItem label="Original File Name" value={file.filename} />
            <InfoItem label="File Size" value={Setting.getFormattedSize(file.size)} />
            <InfoItem label="Upload Date" value={Setting.getFormattedDate(file.createdTime)} />
            <InfoItem label="Storage Provider" renderValue={<Tag color="blue">{file.storageProvider}</Tag>} />
          </Row>
        </div>

        <div style={{height: "1px", background: "#f0f0f0", marginBottom: "32px"}} />

        <div style={sectionStyle}>
          <Title level={5} style={{
            ...labelTitleStyle,
            fontSize: "14px",
            color: "#262626",
            marginBottom: "16px",
          }}>
            TECHNICAL SPECS
          </Title>
          <Row gutter={[0, 0]}>
            <InfoItem label="Store Name" value={file.store} />
            <InfoItem label="Total Segments" value={`${vectors.length} items`} />
            <InfoItem label="Token Count" value={`${file.tokenCount} tokens`} />
            <InfoItem
              label="Vector Dimension"
              value={vectors.length > 0 ? vectors[0].dimension : "-"}
            />
          </Row>
        </div>
      </div>
    );
  };

  renderVectorList = () => {
    const {vectors, pagination} = this.state;
    const {current, pageSize} = pagination;

    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = vectors.slice(startIndex, endIndex);

    return (
      <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          flexShrink: 0,
        }}>
          <Title level={4} style={{margin: 0}}>Segments ({vectors.length})</Title>

          <Pagination
            current={current}
            pageSize={pageSize}
            total={vectors.length}
            onChange={this.handlePageChange}
            showSizeChanger
            pageSizeOptions={["10", "20", "50", "100"]}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
          />
        </div>

        <div
          ref={(el) => this.listScrollRef = el}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            backgroundColor: "#fbfbfb",
          }}
        >
          <List
            itemLayout="vertical"
            size="large"
            dataSource={currentData}
            renderItem={(item) => (
              <div style={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
                marginBottom: "16px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                transition: "all 0.3s",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}>
                  <div style={{display: "flex", gap: "12px"}}>
                    <div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}>
                        <Text strong style={{fontSize: "16px", color: "#1890ff"}}>#{item.index}</Text>
                        <Text type="secondary" style={{fontSize: "13px"}}>· {item.tokenCount} tokens</Text>
                        {item.score > 0 && <Tag color="gold">Score: {item.score.toFixed(4)}</Tag>}
                      </div>
                      <div style={{marginTop: "4px"}}>
                        <Tag style={{border: "none", background: "#f5f5f5", color: "#595959"}}>
                          {item.provider}
                        </Tag>
                        <Tag style={{border: "none", background: "#f5f5f5", color: "#595959"}}>
                          {item.price} {item.currency}
                        </Tag>
                      </div>
                    </div>
                  </div>
                  <Badge
                    status="success"
                    text={<span style={{color: "#52c41a", fontSize: "12px"}}>Enabled</span>}
                  />
                </div>

                <div style={{paddingLeft: "36px", marginBottom: "12px"}}>
                  <div style={{fontSize: "14px", color: "#333", lineHeight: "1.8"}}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{

                        p: ({node, ...props}) => <p style={{margin: 0}} {...props} />,
                      }}
                    >

                      {item.text || ""}
                    </ReactMarkdown>
                  </div>
                </div>

                <div style={{paddingLeft: "36px"}}>
                  <Collapse ghost expandIconPosition="right" size="small">
                    <Panel
                      header={<span style={{color: "#8c8c8c", fontSize: "12px"}}>Show Data & Details</span>}
                      key="1"
                    >
                      <div style={{
                        background: "#fafafa",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #f0f0f0",
                      }}>
                        <Descriptions
                          column={2}
                          size="small"
                          style={{marginBottom: "12px"}}
                        >
                          <Descriptions.Item label="UUID">{item.name}</Descriptions.Item>
                          <Descriptions.Item label="Display Name">{item.displayName}</Descriptions.Item>
                          <Descriptions.Item label="Owner">{item.owner}</Descriptions.Item>
                          <Descriptions.Item label="Store">{item.store}</Descriptions.Item>
                        </Descriptions>

                        <div style={{marginBottom: "6px"}}>
                          <Text strong style={{fontSize: "12px"}}>
                            <DatabaseOutlined /> Vector Data ({item.dimension} dim)
                          </Text>
                        </div>

                        <div style={{
                          maxHeight: "120px",
                          overflowY: "auto",
                          backgroundColor: "#fff",
                          border: "1px solid #d9d9d9",
                          padding: "8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontFamily: "Menlo, monospace",
                          color: "#666",
                          wordBreak: "break-all",
                        }}>
                          [{item.data ? item.data.join(", ") : ""}]
                        </div>
                      </div>
                    </Panel>
                  </Collapse>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    );
  };

  render() {
    const {loading} = this.state;

    if (loading) {
      return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
          <Spin size="large" tip={i18next.t("general:Loading")} />
        </div>
      );
    }

    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#fbfbfb",
      }}>
        {this.renderHeader()}

        <div style={{flex: 1, overflow: "hidden"}}>
          <Row style={{height: "100%"}}>
            <Col xs={24} lg={18} style={{height: "100%"}}>
              {this.renderVectorList()}
            </Col>
            <Col xs={24} lg={6} style={{height: "100%"}}>
              {this.renderRightSidebar()}
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default FileViewPage;

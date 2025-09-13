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
import {Avatar, Button, Card, Col, Empty, Input, Layout, Pagination, Row, Spin, Tag, Typography, message} from "antd";
import {AppstoreOutlined} from "@ant-design/icons";
import * as TemplateBackend from "./backend/TemplateBackend";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import i18next from "i18next";
import * as Setting from "./Setting";
import moment from "moment";

const {Content} = Layout;
const {Search} = Input;
const {Title, Paragraph} = Typography;

class ApplicationStorePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: [],
      loading: false,
      searchText: "",
      pagination: {
        current: 1,
        pageSize: 12,
        total: 0,
      },
    };
  }

  componentDidMount() {
    this.fetchTemplates();
  }

  fetchTemplates = () => {
    this.setState({loading: true});
    const {pagination, searchText} = this.state;

    TemplateBackend.getTemplates(
      this.props.account?.name || "admin",
      pagination.current,
      pagination.pageSize,
      "name",
      searchText,
      "createdTime",
      "desc"
    )
      .then((res) => {
        this.setState({loading: false});
        if (res.status === "ok") {
          const templates = res.data || [];
          this.setState({
            templates: templates,
            pagination: {
              ...pagination,
              total: res.data2 || templates.length,
            },
          });
        } else {
          message.error(`${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        this.setState({loading: false});
        message.error(`${i18next.t("general:Failed to get")}: ${error}`);
      });
  };

  handleSearch = (value) => {
    this.setState({
      searchText: value,
      pagination: {...this.state.pagination, current: 1},
    }, () => {
      this.fetchTemplates();
    });
  };

  handlePaginationChange = (page, pageSize) => {
    this.setState({
      pagination: {
        ...this.state.pagination,
        current: page,
        pageSize: pageSize,
      },
    }, () => {
      this.fetchTemplates();
    });
  };

  handleAddApplication = (template) => {
    const randomName = Setting.getRandomName();
    const newApplication = {
      owner: this.props.account.name,
      name: `application_${randomName}`,
      createdTime: moment().format(),
      displayName: `${template.displayName} - ${randomName}`,
      description: template.description,
      template: template.name,
      namespace: `casibase-application-${randomName}`,
      parameters: "",
      status: "Not Deployed",
    };

    ApplicationBackend.addApplication(newApplication)
      .then((res) => {
        if (res.status === "ok") {
          message.success(i18next.t("general:Successfully added"));
          this.props.history.push(`/applications/${newApplication.name}`);
        } else {
          message.error(`${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        message.error(`${i18next.t("general:Failed to add")}: ${error}`);
      });
  };

  renderHeader = () => {
    const {searchText} = this.state;

    return (
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Title level={4} style={{margin: 0}}>
          <AppstoreOutlined style={{marginRight: 8}} />
          {i18next.t("general:Application Store")}
        </Title>

        <Search
          placeholder={i18next.t("general:Search")}
          allowClear
          value={searchText}
          onChange={(e) => this.setState({searchText: e.target.value})}
          onSearch={this.handleSearch}
          style={{width: 300}}
        />
      </div>
    );
  };

  renderTemplateCard = (template) => {
    return (
      <Col key={`${template.owner}/${template.name}`} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6}>
        <Card hoverable style={{height: 200, position: "relative"}} styles={{body: {padding: "16px", height: "100%", display: "flex", flexDirection: "column"}}} onClick={() => {
          this.handleAddApplication(template);
        }}
        >
          <div style={{display: "flex", alignItems: "center", marginBottom: "8px"}}>
            <Avatar size={42} src={template.icon} icon={<AppstoreOutlined />} style={{marginRight: 12, flexShrink: 0}} shape="square" />
            <Title level={5} style={{margin: 0, flex: 1, fontSize: "16px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
              {template.displayName || template.name}
            </Title>
          </div>

          <div style={{flex: 1}}>
            <Paragraph type="secondary" ellipsis={{rows: 3, expandable: false}} >
              {template.description || ""}
            </Paragraph>
          </div>

          <div style={{marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              {template.version && (
                <Tag color="processing" size="small" >
                  {template.version}
                </Tag>
              )}
            </div>
            <Button type="primary" size="small" onClick={(e) => {
              e.stopPropagation();
              this.handleAddApplication(template);
            }}
            >
              {i18next.t("general:Add")}
            </Button>
          </div>
        </Card>
      </Col>
    );
  };

  render() {
    const {templates, loading, pagination} = this.state;

    return (
      <Layout style={{minHeight: "100vh-135px", background: "transparent"}}>
        {this.renderHeader()}

        <Content style={{marginTop: 16}}>
          <Card>
            <Spin spinning={loading}>
              {templates.length === 0 && !loading ? (
                <Empty description={i18next.t("general:No data")} style={{margin: "40px 0"}} />
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    {templates.map(this.renderTemplateCard)}
                  </Row>

                  <div style={{display: "flex", justifyContent: "flex-end", marginTop: "24px"}}>
                    <Pagination
                      current={pagination.current}
                      total={pagination.total}
                      pageSize={pagination.pageSize}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total)}
                      onChange={this.handlePaginationChange}
                      pageSizeOptions={["12", "24", "50", "100"]}
                    />
                  </div>
                </>
              )}
            </Spin>
          </Card>
        </Content>
      </Layout>
    );
  }
}

export default ApplicationStorePage;

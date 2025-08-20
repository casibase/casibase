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
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Pagination,
  Row,
  Spin,
  Tag,
  Typography,
  message,
  theme
} from "antd";
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  MoreOutlined,
  PlusOutlined
} from "@ant-design/icons";
import * as ApplicationStoreBackend from "./backend/ApplicationStoreBackend";
import i18next from "i18next";
import * as Setting from "./Setting";
import {Link} from "react-router-dom/cjs/react-router-dom";
import ApplicationDetailComponent from "./component/application/ApplicationDetailComponent";
import ApplicationStoreEditPage from "./ApplicationStoreEditPage";
const {Sider} = Layout;
const {Search} = Input;
const {Title, Paragraph} = Typography;

class ApplicationStorePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      applicationCharts: [],
      loading: false,
      searchText: "",
      selectedCategory: "all",
      addRepoModalVisible: false,
      addRepoForm: {},
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
    };
    this.tagScrollerRef = React.createRef();
    this._touchStartX = 0;
    this._touchStartY = 0;
  }

  componentDidMount() {
    this.fetchApplicationCharts();
  }

  fetchApplicationCharts = () => {
    this.setState({loading: true});
    const {pagination, searchText} = this.state;
    ApplicationStoreBackend.getApplicationCharts(
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
          const charts = res.data || [];
          this.setState({
            applicationCharts: charts,
            pagination: {
              ...pagination,
              total: res.data2 || charts.length,
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

  breadcrumbItemRender(currentRoute, params, items, paths) {
    const isLast = currentRoute?.path === items[items.length - 1]?.path;

    return isLast ? (
      <span>{currentRoute.title}</span>
    ) : (
      <Link to={`/${paths.join("/")}`}>{currentRoute.title}</Link>
    );
  }

  handleSearch = (value) => {
    this.setState({
      searchText: value,
      pagination: {...this.state.pagination, current: 1},
    }, () => {
      this.fetchApplicationCharts();
    });
  };

  showAddRepoModal = () => {
    this.setState({
      addRepoModalVisible: true,
      addRepoForm: {},
    });
  };

  handleAddRepoCancel = () => {
    this.setState({
      addRepoModalVisible: false,
      addRepoForm: {},
    });
  };

  handleAddRepoSubmit = () => {
    const {addRepoForm} = this.state;
    if (!addRepoForm.repoUrl) {
      message.error(i18next.t("application:Please input repository URL"));
      return;
    }

    this.setState({loading: true});
    ApplicationStoreBackend.addApplicationCharts(
      this.props.account?.name || "admin",
      addRepoForm.repoUrl
    )
      .then((res) => {
        this.setState({loading: false});
        if (res.status === "ok") {
          message.success(i18next.t("general:Successfully added"));
          this.setState({addRepoModalVisible: false});
          this.fetchApplicationCharts();
        } else {
          message.error(`${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        this.setState({loading: false});
        message.error(`${i18next.t("general:Failed to add")}: ${error}`);
      });
  };

  handleCardClick = (chart) => {
    this.props.history.push(`/application-store/${chart.owner}/${chart.name}`);
  };
  handleEditApplication = (chart) => {
    // navigate to edit via query param ?edit=true
    this.props.history.push(`/application-store/${chart.owner}/${chart.name}?edit=true`);
  };

  handleDeleteApplication = (chart) => {
    Modal.confirm({
      title: i18next.t("general:Sure to delete"),
      content: `${chart.displayName || chart.name}`,
      okText: i18next.t("general:Delete"),
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
      onOk: () => {
        this.setState({loading: true});
        return ApplicationStoreBackend.deleteApplicationChart(chart)
          .then((res) => {
            this.setState({loading: false});
            if (res.status === "ok") {
              message.success(`${i18next.t("general:Successfully deleted")} ${chart.displayName || chart.name}`);
              this.fetchApplicationCharts();
            } else {
              message.error(`${i18next.t("general:Failed to delete")}: ${res.msg}`);
            }
          })
          .catch((error) => {
            this.setState({loading: false});
            message.error(`${i18next.t("general:Failed to delete")}: ${error}`);
          });
      },
    });
  };

  getMenuItems = (chart) => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: i18next.t("general:Edit"),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: i18next.t("general:Delete"),
      danger: true,
    },
  ];

  handleMenuClick = (chart, menuInfo) => {
    const {key} = menuInfo;

    if (menuInfo.domEvent) {
      menuInfo.domEvent.stopPropagation();
    }

    switch (key) {
    case "edit":
      this.handleEditApplication(chart);
      break;
    case "delete":
      this.handleDeleteApplication(chart);
      break;
    default:
      break;
    }
  };

  handlePageChange = (page, pageSize) => {
    this.setState({pagination: {...this.state.pagination, current: page, pageSize: pageSize}}, () => {
      this.fetchApplicationCharts();
    });
  };

  handlePageSizeChange = (value) => {
    this.setState({pagination: {...this.state.pagination, pageSize: value, current: 1}}, () => {
      this.fetchApplicationCharts();
    });
  };

  renderSidebar = () => {
    const {searchText} = this.state;
    const isMobile = Setting.isMobile();
    const menuItems = [
      {
        key: "all",
        label: i18next.t("application:All Applications"),
      },
    ];

    if (isMobile) {
      return (
        <Sider
          width={"100%"}
          style={{
            padding: "12px",
            paddingBottom: 0,
            backgroundColor: "transparent",
            position: "static",
          }}
          theme="light"
        >
          <div style={{display: "flex", alignItems: "center", gap: 24}}>
            <Search
              placeholder={i18next.t("general:Search")}
              allowClear
              value={searchText}
              onChange={(e) => this.setState({searchText: e.target.value})}
              onSearch={this.handleSearch}
              style={{flex: 1}}
            />

            <Button type="primary" icon={<PlusOutlined />} onClick={this.showAddRepoModal} shape="circle" size="middle" />
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[this.state.selectedCategory]}
            style={{border: "none", backgroundColor: "transparent"}}
            onClick={(info) => this.setState({selectedCategory: info.key})}
            items={menuItems}
          />
        </Sider>
      );
    }

    // Desktop layout
    return (
      <Sider
        width={280}
        style={{
          padding: "24px",
          backgroundColor: "transparent",
          position: "sticky",
          top: 0,
          height: "100%",
          overflowY: "auto",
        }}
        theme="light"
      >
        <div style={{marginBottom: 24}}>
          <Title level={4} style={{margin: 0, marginBottom: 16}}>
            <AppstoreOutlined style={{marginRight: 8}} />
            {i18next.t("application:Application Store")}
          </Title>

          <Search
            placeholder={i18next.t("general:Search")}
            allowClear
            value={searchText}
            onChange={(e) => this.setState({searchText: e.target.value})}
            onSearch={this.handleSearch}
            style={{marginBottom: 16}}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={this.showAddRepoModal}
            block
          >
            {i18next.t("application:Add Repository")}
          </Button>
        </div>

        <Divider />

        <div>
          <Title level={5} style={{marginBottom: 16, marginTop: 0}}>
            <FolderOutlined style={{marginRight: 8}} />
            {i18next.t("general:Category")}
          </Title>

          <Menu
            mode="inline"
            selectedKeys={[this.state.selectedCategory]}
            style={{border: "none", backgroundColor: "transparent"}}
            items={menuItems}
          />
        </div>
      </Sider>
    );
  };

  renderApplicationCard = (chart) => {
    return (
      <Col
        key={`${chart.owner}/${chart.name}`}
        xs={24}
        sm={24}
        md={12}
        lg={12}
        xl={8}
        xxl={6}
      >
        <Card
          hoverable
          style={{
            height: 150,
            position: "relative",
          }}
          styles={{
            body: {
              padding: "16px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            },
          }}
          onClick={() => {
            this.handleCardClick(chart);
          }}
        >
          <div style={{display: "flex", alignItems: "center", marginBottom: "8px", position: "relative"}}>
            <Avatar
              size={42}
              src={chart.iconUrl}
              icon={<AppstoreOutlined />}
              style={{
                marginRight: 12,
                flexShrink: 0,
                backgroundColor: "#ffffffd9",
                color: "#141414",
              }}
              shape="square"
            />
            <Title
              level={5}
              style={{
                margin: 0,
                flex: 1,
                fontSize: "16px",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingRight: "24px",
              }}
            >
              {chart.displayName || chart.name}
            </Title>
            <Dropdown
              menu={{
                items: this.getMenuItems(chart),
                onClick: (menuInfo) => this.handleMenuClick(chart, menuInfo),
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                size="small"
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "auto",
                  padding: "4px",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>

          <div style={{flex: 1}}>
            <Paragraph
              type="secondary"
              ellipsis={{rows: 2, expandable: false}}
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "18px",
              }}
            >
              {chart.description || ""}
            </Paragraph>
          </div>

          <div
            ref={this.tagScrollerRef}
            style={{display: "flex", overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch"}}
            onClick={(e) => e.stopPropagation()}
          >
            <Tag
              color="processing"
              size="small"
              style={{flex: "0 0 auto"}}
            >
              {chart.appVersion}
            </Tag>
            {chart.keywords && chart.keywords.split(",").map((keyword, idx) => (
              <Tag
                key={keyword + idx}
                color="default"
                size="small"
                style={{flex: "0 0 auto"}}
              >
                {keyword}
              </Tag>
            ))}
          </div>
        </Card>
      </Col>
    );
  };

  renderContent = () => {
    const {applicationCharts, loading} = this.state;
    const {owner, name} = this.props.match.params;

    const search = this.props.location?.search || "";
    const params = new URLSearchParams(search);
    const editMode = params.get("edit") === "true";

    if (owner && name) {
      if (editMode) {
        // Application edit component
        return (
          <Card style={{flex: 1}}>
            <ApplicationStoreEditPage
              {...this.props}
            />
          </Card>
        );
      } else {
        // Application detail component
        return (
          <Card style={{flex: 1}}>
            <ApplicationDetailComponent
              {...this.props}
              token={this.props.token}
              owner={owner}
              name={name}
              account={this.props.account}
            />
          </Card>
        );
      }
    }

    // Application Store component
    const {pagination} = this.state;

    return (
      <Card style={{flex: 1}}>
        <Spin spinning={loading}>
          {applicationCharts.length === 0 && !loading ? (
            <Empty
              description={i18next.t("application:No applications found")}
              style={{margin: "40px 0"}}
            >
              <Button type="primary" onClick={this.showAddRepoModal}>
                {i18next.t("application:Add Repository")}
              </Button>
            </Empty>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {applicationCharts.map(this.renderApplicationCard)}
              </Row>

              <div style={{display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 16}}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  showTotal={() => i18next.t("general:{total} in total").replace("{total}", pagination.total)}
                  total={pagination.total}
                  onChange={this.handlePageChange}
                  showSizeChanger
                  showQuickJumper
                />
              </div>
            </>
          )}
        </Spin>
      </Card>
    );
  };

  render() {
    const {addRepoModalVisible, loading} = this.state;
    const {owner, name} = this.props.match.params;

    const isMobile = Setting.isMobile();

    const layoutStyle = {
      minHeight: "calc(100vh - 135px)",
      background: "transparent",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
    };

    const contentLayoutStyle = isMobile
      ? {padding: "12px", paddingBottom: 0, flex: 1, width: "100%"}
      : {padding: "24px", paddingBottom: 0, flex: 1};

    const search = this.props.location?.search || "";
    const params = new URLSearchParams(search);
    const editMode = params.get("edit") === "true";
    const breadcrumbItems = [
      {
        title: (
          <>
            <AppstoreOutlined />
            <span style={{marginLeft: "4px"}}>{i18next.t("application:Application Store")}</span>
          </>),
        path: "/application-store",
      },
    ];

    if (owner && name) {
      breadcrumbItems.push({
        title: name,
        path: `/${owner}/${name}`,
      });
    }

    if (editMode) {
      breadcrumbItems.push({
        title: i18next.t("general:Edit"),
        path: `/${owner}/${name}?edit=true`,
      });
    }

    return (
      <Layout style={layoutStyle}>
        {!(isMobile && owner && name) && this.renderSidebar()}

        <Layout style={contentLayoutStyle}>
          {(!isMobile || owner && name) && (
            <Breadcrumb
              style={{marginBottom: isMobile ? 12 : 24}}
              items={breadcrumbItems}
              itemRender={this.breadcrumbItemRender}
            />
          )}

          {this.renderContent()}
        </Layout>

        <Modal
          title={i18next.t("application:Add Helm Repository")}
          open={addRepoModalVisible}
          onOk={this.handleAddRepoSubmit}
          onCancel={this.handleAddRepoCancel}
          confirmLoading={loading}
        >
          <Form layout="vertical">
            <Form.Item
              label={i18next.t("application:Repository URL")}
              required
            >
              <Input
                placeholder="https://charts.helm.sh/stable"
                value={this.state.addRepoForm.repoUrl}
                onChange={(e) =>
                  this.setState({
                    addRepoForm: {
                      ...this.state.addRepoForm,
                      repoUrl: e.target.value,
                    },
                  })
                }
              />
            </Form.Item>
            <Form.Item>
              <div style={{color: this.props.token.colorTextSecondary}}>
                {i18next.t("application:Enter a Helm repository URL to load application charts")}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    );
  }

}

const ApplicationStorePageWithToken = React.memo((props) => {
  const {token} = theme.useToken();
  return <ApplicationStorePage {...props} token={token} />;
});

ApplicationStorePageWithToken.displayName = "ApplicationStorePage";

export default ApplicationStorePageWithToken;

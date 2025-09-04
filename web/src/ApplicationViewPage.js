// Copyright 2025 The Casibase Authors. All Rights Reserved.

import React from "react";
import {Button, Card, Descriptions, Table, Tag, Typography} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import copy from "copy-to-clipboard";

const {Text} = Typography;

class ApplicationViewPage extends React.Component {
  constructor(props) {
    super(props);
    const application = props.application || (props.location && props.location.state ? props.location.state.application : null);
    this.state = {
      application: application,
      loading: false,
      error: null,
    };
  }

  componentDidMount() {
    this.getApplication();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.application !== this.props.application) {
      this.setState({application: this.props.application});
      this.getApplication();
    }
  }

  getApplication() {
    if (!this.state.application) {
      return;
    }

    this.setState({loading: true, error: null});

    ApplicationBackend.getApplication(this.state.application.owner, this.state.application.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({application: res.data, loading: false});
        } else {
          this.setState({error: res.msg, loading: false});
        }
      })
      .catch(error => {
        this.setState({error: error.toString(), loading: false});
      });
  }

  copyToClipboard = (text) => {
    copy(text);
    Setting.showMessage("success", i18next.t("general:Successfully copied"));
  };

  renderBasic() {
    const details = this.state.application?.details;
    if (!details) {
      return null;
    }

    return (
      <Card size="small" title={i18next.t("general:Description")} style={{marginBottom: 16}}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label={i18next.t("general:Name")}>
            <Text>{this.state.application.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Namespace")}>
            <Text>{details.namespace}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Status")}>
            {Setting.getApplicationStatusTag(details.status)}
          </Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Created time")}>
            <Text>{details.createdTime}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  }

  renderDeployments() {
    const details = this.state.application?.details;
    if (!details || !details.deployments || details.deployments.length === 0) {
      return null;
    }

    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        render: (text) => <Text>{text}</Text>,
      },
      {
        title: i18next.t("application:Replicas"),
        dataIndex: "replicas",
        key: "replicas",
        width: "80px",
        render: (text, record) => <Text>{record.readyReplicas}/{text}</Text>,
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        render: (text) => {
          let color = "default";
          if (text === "Running") {
            color = "green";
          } else if (text === "Partially Ready") {
            color = "orange";
          } else if (text === "Not Ready") {
            color = "red";
          }
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: i18next.t("general:Containers"),
        dataIndex: "containers",
        key: "containers",
        width: "280px",
        render: (containers) => (
          <div>
            {containers.map((container, index) => (
              <div key={index} style={{marginBottom: 4}}>
                <Text style={{fontSize: "12px"}}>{container.image}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        render: (text) => <Text style={{fontSize: "12px"}}>{text}</Text>,
      },
    ];

    return (
      <Card size="small" title={i18next.t("application:Deploy")} style={{marginBottom: 16}}>
        <Table dataSource={details.deployments} columns={columns} pagination={false} size="small" rowKey="name" />
      </Card>
    );
  }

  renderConnections() {
    const details = this.state.application?.details;
    if (!details || !details.services || details.services.length === 0) {
      return null;
    }

    return (
      <Card size="small" title={i18next.t("general:Connections")} style={{marginBottom: 16}}>
        {details.services.map((service, index) => (
          <Card key={index} size="small"
            title={<span>{service.name}<Tag style={{marginLeft: 8}} color="blue">{service.type}</Tag></span>}
            style={{marginBottom: 12}} type="inner">

            {/* Internal Access */}
            <div style={{marginBottom: 16}}>
              <Text strong style={{display: "block", marginBottom: 8}}>{i18next.t("machine:Private IP")}</Text>
              <div style={{display: "flex", alignItems: "center"}}>
                <Text style={{marginRight: 8, flex: 1}}>{service.internalHost}</Text>
                <Button icon={<CopyOutlined />} size="small"
                  disabled={!service.internalHost}
                  onClick={() => this.copyToClipboard(service.internalHost)}>
                  {i18next.t("general:Copy")}
                </Button>
              </div>
            </div>

            {/* External Access */}
            {service.externalHost && service.type !== "ClusterIP" && (
              <div style={{marginBottom: 16}}>
                <Text strong style={{display: "block", marginBottom: 8}}>{i18next.t("machine:Public IP")}</Text>
                <div style={{display: "flex", alignItems: "center"}}>
                  <Text style={{marginRight: 8, flex: 1}}>{service.externalHost}</Text>
                  <Button icon={<CopyOutlined />} size="small"
                    disabled={!service.externalHost}
                    onClick={() => this.copyToClipboard(service.externalHost)}>
                    {i18next.t("general:Copy")}
                  </Button>
                </div>
              </div>
            )}

            {/* Port Mappings */}
            {service.ports && service.ports.length > 0 && (
              <div>
                <Text strong style={{display: "block", marginBottom: 8}}>{i18next.t("container:Ports")}</Text>
                {service.ports.map((port, portIndex) => (
                  <div key={portIndex} style={{marginBottom: 4}}>
                    <div style={{display: "flex", alignItems: "center"}}>
                      <Text style={{marginRight: 8, flex: 1}}>
                        {port.name ? `${port.name}: ` : ""}
                        {port.port}/{port.protocol}
                        {port.nodePort && ` → ${port.nodePort}`}
                      </Text>
                      {port.url && (
                        <Button icon={<CopyOutlined />} size="small"
                          onClick={() => this.copyToClipboard(port.url)}>
                          {i18next.t("general:Copy")}
                        </Button>
                      )}
                    </div>
                    {port.url && (
                      <div style={{marginTop: 4}}>
                        <Text type="secondary" style={{fontSize: "12px"}}>
                          <a target="_blank" rel="noreferrer" href={`http://${port.url}`}>
                            {port.url}
                          </a>
                        </Text>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </Card>
    );
  }

  renderCredentials() {
    const details = this.state.application?.details;
    if (!details || !details.credentials || details.credentials.length === 0) {
      return null;
    }

    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "200px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => <Text>{text}</Text>,
      },
      {
        title: i18next.t("general:Data"),
        dataIndex: "value",
        key: "value",
        width: "300px",
        render: (text) => (
          <Text style={{wordBreak: "break-all"}}>{text}</Text>
        ),
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "80px",
        render: (text, record) => (
          <Button icon={<CopyOutlined />} size="small"
            disabled={!record.value}
            onClick={() => this.copyToClipboard(record.value)}>
            {i18next.t("general:Copy")}
          </Button>
        ),
      },
    ];

    return (
      <Card size="small" title={i18next.t("general:Resources")} style={{marginBottom: 16}}>
        <Table dataSource={details.credentials} columns={columns}
          pagination={false} size="small" rowKey="name" />
      </Card>
    );
  }

  render() {
    if (!this.state.application) {
      return null;
    }

    if (this.state.application.status === "Not Deployed") {
      return (
        <Card title={i18next.t("general:Applications")} style={{margin: "0 32px"}}>
          <div style={{textAlign: "center", padding: "20px"}}>
            <Text type="secondary">{i18next.t("application:Not Deployed")}</Text>
          </div>
        </Card>
      );
    }

    if (this.state.error) {
      return (
        <Card title={i18next.t("general:Applications")} style={{margin: "0 32px"}}>
          <div style={{textAlign: "center", padding: "20px"}}>
            <Text type="danger">{i18next.t("general:Error")}: {this.state.error}</Text>
          </div>
        </Card>
      );
    }

    return (
      <div style={{margin: "32px"}}>
        {this.renderBasic()}
        {this.renderDeployments()}
        {this.renderConnections()}
        {this.renderCredentials()}
      </div>
    );
  }
}

export default ApplicationViewPage;

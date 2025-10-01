// Copyright 2025 The Casibase Authors. All Rights Reserved.

import React from "react";
import {Button, Card, Col, Descriptions, Progress, Row, Statistic, Tag, Typography} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as Setting from "./Setting";
import EventTable from "./table/EventTable";
import DeploymentTable from "./table/DeploymentTable";
import CredentialsTable from "./table/CredentialTable";
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

  renderMetrics() {
    const details = this.state.application?.details;
    if (!details || !details.metrics) {
      return null;
    }

    const metrics = details.metrics;

    const getProgressColor = (percentage) => {
      if (percentage < 50) {return "#52c41a";}
      if (percentage < 80) {return "#faad14";}
      return "#f5222d";
    };

    return (
      <Card size="small" title={i18next.t("general:Usages")} style={{marginBottom: 16}}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" type="inner" style={{minHeight: 120}}>
              <Statistic title={i18next.t("system:CPU Usage")} value={metrics.cpuUsage} suffix={metrics.cpuPercentage > 0 ? `(${metrics.cpuPercentage.toFixed(1)}%)` : ""} />
              {metrics.cpuPercentage > 0 ? (
                <Progress percent={metrics.cpuPercentage} size="small" strokeColor={getProgressColor(metrics.cpuPercentage)} showInfo={false} style={{marginTop: 8}} />
              ) : (
                <div style={{height: 14, marginTop: 8}}></div>
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Card size="small" type="inner" style={{minHeight: 120}}>
              <Statistic title={i18next.t("system:Memory Usage")} value={metrics.memoryUsage} suffix={metrics.memoryPercentage > 0 ? `(${metrics.memoryPercentage.toFixed(1)}%)` : ""} />
              {metrics.memoryPercentage > 0 ? (
                <Progress percent={metrics.memoryPercentage} size="small" strokeColor={getProgressColor(metrics.memoryPercentage)} showInfo={false} style={{marginTop: 8}} />
              ) : (
                <div style={{height: 14, marginTop: 8}}></div>
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Card size="small" type="inner" style={{minHeight: 120}}>
              <Statistic title={i18next.t("general:Pods")} value={metrics.podCount} />
              <div style={{height: 14, marginTop: 8}}></div>
            </Card>
          </Col>
        </Row>
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
                          <a target="_blank" rel="noreferrer" href={port.url}>
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

    const details = this.state.application?.details;

    return (
      <div style={{margin: "32px"}}>
        {this.renderBasic()}
        {this.renderMetrics()}
        <DeploymentTable deployments={details?.deployments} />
        {this.renderConnections()}
        <EventTable events={details?.events} />
        <CredentialsTable credentials={details?.credentials} />
      </div>
    );
  }
}

export default ApplicationViewPage;

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
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Space,
  Spin,
  Steps,
  Switch,
  Tag,
  Typography,
  message
} from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  CopyOutlined,
  DeploymentUnitOutlined,
  DownloadOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  SecurityScanOutlined,
  SettingOutlined
} from "@ant-design/icons";
import * as ApplicationStoreBackend from "../../backend/ApplicationStoreBackend";
import * as ApplicationBackend from "../../backend/ApplicationBackend";
import * as TemplateBackend from "../../backend/TemplateBackend";
import i18next from "i18next";
import * as Setting from "../../Setting";
import {renderText} from "../../ChatMessageRender";
import Link from "antd/es/typography/Link";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/idea.css");
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

const {Text, Title, Paragraph} = Typography;

class ApplicationDetailComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chartContent: null,
      loading: false,
      activeTab: "overview",
      configForm: {},
      renderResult: null,
      parsedResources: [],
    };
  }

  componentDidMount() {
    this.fetchChartContent();
  }

  // Simplified color detection
  isDarkColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const avg = (r + g + b) / 3;
    return avg < 128;
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.applicationName !== this.props.applicationName
    ) {
      this.fetchChartContent();
    }
  }

  fetchChartContent = () => {
    const {applicationName} = this.props;
    this.setState({loading: true});

    ApplicationStoreBackend.getApplicationChartContent(this.props.account.name, applicationName)
      .then((res) => {
        this.setState({loading: false});
        if (res.status === "ok") {
          this.setState({
            chartContent: res.data,
            configForm: res.data?.values || {},
          });
        } else {
          message.error(`${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        this.setState({loading: false});
        message.error(`${i18next.t("general:Failed to get")}: ${error}`);
        this.props.history.push("/application-store");
      });
  };

  decodeBase64 = (base64String) => {
    try {
      return atob(base64String);
    } catch (error) {
      return "Unable to decode content";
    }
  };

  getReadmeContent = () => {
    const {chartContent} = this.state;
    if (!chartContent?.files) {
      return "";
    }

    const readmeFile = chartContent.files.find(file => file.name === "README.md");
    return readmeFile ? this.decodeBase64(readmeFile.data) : "";
  };

  handleRenderClick = () => {
    const {applicationName} = this.props;
    const {configForm} = this.state;
    const {chartContent} = this.state;

    this.setState({loading: true});

    ApplicationStoreBackend.updateApplicationChartContent(this.props.account.name, applicationName, configForm, chartContent)
      .then((res) => {
        this.setState({loading: false});
        if (res.status === "ok") {
          this.setState({
            renderResult: res.data,
            activeTab: "render-result",
            parsedResources: this.parseKubernetesResources(res.data),
          });
          message.success(`${i18next.t("application:Successfully rendered")} ${applicationName}`);
        } else {
          message.error(`${i18next.t("general:Failed to deploy")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        this.setState({loading: false});
        message.error(`${i18next.t("general:Failed to deploy")}: ${error}`);
      });
  };

  parseKubernetesResources = (renderResult) => {
    if (!renderResult?.renderedYaml) {
      return [];
    }

    try {
      // Split YAML documents (using --- separator)
      const yamlDocs = renderResult.renderedYaml
        .split(/^---$/m)
        .filter(doc => doc.trim())
        .map(doc => doc.trim());

      const resources = [];

      yamlDocs.forEach((doc, index) => {
        const apiVersionMatch = doc.match(/^apiVersion:\s*(.+)$/m);
        const kindMatch = doc.match(/^kind:\s*(.+)$/m);
        const nameMatch = doc.match(/^\s*name:\s*(.+)$/m);
        const namespaceMatch = doc.match(/^\s*namespace:\s*(.+)$/m);

        if (apiVersionMatch && kindMatch) {
          const resource = {
            id: index,
            apiVersion: apiVersionMatch[1].trim(),
            kind: kindMatch[1].trim(),
            name: nameMatch ? nameMatch[1].trim() : "Unknown",
            namespace: namespaceMatch ? namespaceMatch[1].trim() : renderResult.namespace || "Unknown",
            yaml: doc,
          };

          resources.push(resource);
        }
      });

      return resources;
    } catch (error) {
      message.error(i18next.t("application:Failed to parse deployment resources"));
      return [];
    }
  };

  getKindIcon = (kind) => {
    switch (kind) {
    case "Deployment":
      return <DeploymentUnitOutlined style={{color: "#1890ff"}} />;
    case "Service":
      return <CloudServerOutlined style={{color: "#52c41a"}} />;
    case "ConfigMap":
      return <SettingOutlined style={{color: "#faad14"}} />;
    case "Secret":
      return <SecurityScanOutlined style={{color: "#f5222d"}} />;
    case "Ingress":
      return <NodeIndexOutlined style={{color: "#722ed1"}} />;
    default:
      return <FileTextOutlined style={{color: "#8c8c8c"}} />;
    }
  };

  getKindColor = (kind) => {
    switch (kind) {
    case "Deployment":
      return "blue";
    case "Service":
      return "green";
    case "ConfigMap":
      return "orange";
    case "Secret":
      return "red";
    case "Ingress":
      return "purple";
    default:
      return "default";
    }
  };

  handleCopyYamlClick = (yaml) => {
    navigator.clipboard.writeText(yaml).then(() => {
      message.success(i18next.t("application:Copied to clipboard"));
    }).catch(() => {
      message.error(i18next.t("application:Failed to copy"));
    });
  };

  handleDownloadYamlClick = () => {
    const {renderResult} = this.state;
    const filename = `${renderResult.chartName}-${renderResult.chartVersion || "latest"}.yaml`;

    const blob = new Blob([renderResult.renderedYaml], {type: "text/yaml"});
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(i18next.t("general:Successfully downloaded"));
  };

  createTemplate = () => {
    const {account} = this.props;
    const {renderResult} = this.state;
    const randomName = Setting.getRandomName();
    const templateName = `${renderResult.chartName}-app-template-${randomName}`;

    const newTemplate = {
      owner: account.name,
      name: templateName,
      createdTime: new Date().toISOString(),
      displayName: `${renderResult.chartName} Application Template`,
      description: `Auto-generated template for ${renderResult.chartName} (${renderResult.chartVersion})`,
      version: renderResult.chartVersion || "1.0.0",
      icon: Setting.getDefaultAiAvatar(),
      manifest: renderResult.renderedYaml,
    };

    return TemplateBackend.addTemplate(newTemplate)
      .then((res) => {
        if (res.status === "ok") {
          return templateName;
        } else {
          throw new Error(res.msg);
        }
      });
  };

  createApplication = (templateName) => {
    const {account} = this.props;
    const {renderResult} = this.state;
    const randomName = Setting.getRandomName();
    const applicationName = `${renderResult.chartName}-app-${randomName}`;

    const newApplication = {
      owner: account.name,
      name: applicationName,
      createdTime: new Date().toISOString(),
      displayName: `${renderResult.chartName} Application`,
      description: `Auto-generated application for ${renderResult.chartName} (${renderResult.chartVersion})`,
      template: templateName,
      namespace: renderResult.namespace || `${renderResult.chartName}-${randomName}`,
      parameters: "",
      status: "Not Deployed",
    };

    return ApplicationBackend.addApplication(newApplication)
      .then((res) => {
        if (res.status === "ok") {
          return applicationName;
        } else {
          throw new Error(res.msg);
        }
      });
  };

  redirectToApplicationEdit = (applicationName) => {
    this.setState({deploying: false});
    message.success(i18next.t("general:Successfully deployed"));

    this.props.history.push(`/applications/${applicationName}`);
  };

  handleDeployClick = () => {
    const {account} = this.props;
    const {renderResult} = this.state;

    if (!renderResult || !account) {
      message.error(i18next.t("application:Missing required data for deployment"));
      return;
    }

    this.setState({deploying: true});

    // Step 1
    this.createTemplate()
      .then((templateName) => {
        // Step 2
        return this.createApplication(templateName);
      })
      .then((applicationName) => {
        // Step 3
        this.redirectToApplicationEdit(applicationName);
      })
      .catch((error) => {
        this.setState({deploying: false});
        message.error(`${i18next.t("general:Failed to deploy")}: ${error}`);
      });
  };

  getStepKeys = () => {
    const keys = ["overview", "config"];
    if (this.state.renderResult) {
      keys.push("render-result");
    }
    return keys;
  };

  getAllStepKeys = () => ["overview", "config", "render-result"];

  handleNextStep = () => {
    const stepKeys = this.getAllStepKeys();
    const {activeTab} = this.state;
    const idx = stepKeys.indexOf(activeTab);
    const nextIdx = Math.min(idx + 1, stepKeys.length - 1);
    const nextKey = stepKeys[nextIdx];
    if (nextKey === "render-result") {
      this.handleRenderClick();
    } else {
      this.setState({activeTab: nextKey});
    }
  };

  renderConfigForm = (values) => {
    if (!values || typeof values !== "object") {
      return null;
    }

    return Object.entries(values).map(([key, value]) => {
      return (
        <Form.Item
          key={key}
          label={key}
          style={{marginBottom: 16}}
        >
          {this.renderFormControl(key, value)}
        </Form.Item>
      );
    });
  };

  renderFormControl = (key, value) => {
    const {token} = this.props;
    const isDarkMode = this.isDarkColor(token.colorBgContainer);
    if (typeof value === "boolean") {
      return (
        <Switch
          checked={this.getNestedValue(this.state.configForm, key)}
          onChange={(checked) => this.setNestedValue(key, checked)}
        />
      );
    }

    if (typeof value === "number") {
      return (
        <InputNumber
          value={this.getNestedValue(this.state.configForm, key)}
          onChange={(val) => this.setNestedValue(key, val)}
          style={{width: "100%"}}
        />
      );
    }

    if (typeof value === "string") {
      const stringVal = this.getNestedValue(this.state.configForm, key);
      return (
        <CodeMirror
          value={stringVal}
          options={{
            theme: isDarkMode ? "material-darker" : "idea",
            lineNumbers: true,
            indentUnit: 2,
            tabSize: 2,
          }}
          onBeforeChange={(editor, data, value) => {
            this.setNestedValue(key, value);
          }}
        />
      );
    }

    if (typeof value === "object" && value !== null) {
      const jsonValue = this.getNestedValue(this.state.configForm, key);
      const displayValue = typeof jsonValue === "object" ? JSON.stringify(jsonValue, null, 2) : String(jsonValue || "");

      return (
        <CodeMirror
          value={displayValue}
          options={{
            mode: {name: "javascript", json: true},
            theme: isDarkMode ? "material-darker" : "idea",
            lineNumbers: true,
            indentUnit: 2,
            tabSize: 2,
          }}
          onBeforeChange={(editor, data, value) => {
            this.setNestedValue(key, value);
          }}
          onBlur={(editor, event) => {
            const jsonValue = editor.getValue();
            try {
              this.setNestedValue(key, JSON.parse(jsonValue));
              message.info(`${i18next.t("general:Successfully formatted")} ${key}`);
            } catch (e) {
              message.error(`${i18next.t("general:Failed to format")} ${key}. ${e.message}`);
            }
          }}
        />
      );
    }

    // Fallback for arrays or other types
    return (
      <Input
        value={String(this.getNestedValue(this.state.configForm, key) || "")}
        onChange={(e) => this.setNestedValue(key, e.target.value)}
      />
    );
  };

  getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  setNestedValue = (path, value) => {
    const keys = path.split(".");
    const newConfigForm = {...this.state.configForm};
    let current = newConfigForm;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    this.setState({configForm: newConfigForm});
  };

  renderOverviewTab = () => {
    const {chartContent} = this.state;
    const metadata = chartContent?.metadata;
    const readmeContent = this.getReadmeContent();
    const shortItems = [
      {label: i18next.t("general:Name"), children: metadata?.name},
      {label: i18next.t("general:Home"), children: metadata?.home},
      {label: i18next.t("application:Sources"), children: metadata?.sources ? (
        <div style={{display: "flex", flexDirection: "column"}}>
          {metadata.sources.map((s, i) => <Link key={i} href={s}>{s}</Link>)}
        </div>
      ) : null},
      {label: ("Api" + i18next.t("general:Version")), children: metadata?.apiVersion ? <Tag>{metadata.apiVersion}</Tag> : null},
      {label: i18next.t("general:Version"), children: metadata?.version ? <Tag>{metadata.version}</Tag> : null},
      {label: ("App" + i18next.t("general:Version")), children: metadata?.appVersion ? <Tag>{metadata.appVersion}</Tag> : null},
      {label: i18next.t("video:Keywords"), children: metadata?.keywords ? (
        <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          {metadata.keywords.map((k, i) => <Tag key={i} color="blue" style={{margin: 0}}>{k}</Tag>)}
        </div>
      ) : null},
    ];

    const longItems = [
      {label: i18next.t("application:Description"), children: metadata?.description},
      {label: i18next.t("application:Annotations"), children: metadata?.annotations ? (
        <div>
          {Object.entries(metadata.annotations).map(([k, v]) => (
            <div key={k}>
              <strong>{k}</strong>
              <div style={{marginLeft: 8}}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
            </div>
          ))}
        </div>
      ) : null},
      {label: i18next.t("application:Dependencies"), children: metadata?.dependencies ? (
        <div>
          {metadata.dependencies.map((dep, i) => (
            <div key={i}>
              <strong>{dep.name || `dependency-${i}`}</strong>
              <div>
                {Object.entries(dep).map(([k, v]) => (
                  <div key={k}>
                    <strong style={{marginLeft: 8}}>{k}</strong>
                    <div style={{marginLeft: 16}}>
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null},
      {label: i18next.t("application:Maintainers"), children: metadata?.maintainers ?
        <List
          size="small"
          dataSource={metadata.maintainers}
          renderItem={(item, index) => (
            <List.Item.Meta
              description={
                <>
                  <strong><a href={item.url} >{item.name}</a></strong>
                  <br />
                  <a href={`mailto:${item.email}`}>{item.email}</a>
                </>
              }
            />
          )}
        /> : null},
    ];

    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={16} lg={16} xl={18}>
          <Card
            title={
              <span>
                <FileTextOutlined style={{marginRight: 8}} />
          README
              </span>
            }
            size="small"
          >
            <div style={{wordBreak: "break-word"}}>
              {renderText(readmeContent)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={6}>
          <Card size="small">
            <Descriptions column={1} size="small" title={i18next.t("application:Application Info")} items={shortItems} />
            <Divider />
            <Descriptions column={1} size="small" layout="vertical" items={longItems} />
          </Card>
        </Col>
      </Row>
    );
  };

  renderConfigTab = () => {
    const {chartContent} = this.state;

    return (
      <Card
        title={
          <span>
            <SettingOutlined style={{marginRight: 8}} />
            {i18next.t("general:Configuration")}
          </span>
        }
        size="small"
      >
        <Form layout="vertical">
          {this.renderConfigForm(chartContent?.values)}
        </Form>
      </Card>
    );
  };

  renderConfirmTab = () => {
    const {renderResult, parsedResources} = this.state;
    const {token} = this.props;
    const isDarkMode = this.isDarkColor(token.colorBgContainer);

    if (!renderResult) {
      return null;
    }

    return <>
      <Card
        title={
          <Space>
            <CheckCircleOutlined style={{color: "#52c41a"}} />
            {i18next.t("application:Rendered Preview")}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => this.handleCopyYamlClick(renderResult.renderedYaml)}
            >
              {this.state.isMobile ? "" : i18next.t("general:Copy")}
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={this.handleDownloadYamlClick}
            >
              {this.state.isMobile ? "" : i18next.t("application:Download YAML")}
            </Button>

            <Button
              type="primary"
              icon={<DeploymentUnitOutlined />}
              loading={this.state.deploying}
              onClick={this.handleDeployClick}
            >
              {this.state.deploying ? i18next.t("application:Deploying") : i18next.t("application:Deploy")}
            </Button>
          </Space>
        }
        style={{marginBottom: 24}}
      >
        <Alert
          message={i18next.t("application:Deployment Configuration")}
          description={i18next.t("application:The following Kubernetes resources will be created when you deploy this application")}
          type="success"
          showIcon
          style={{marginBottom: 16}}
        />

        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Text strong>{i18next.t("general:Name")}: </Text>
            <Text>{renderResult.chartName}</Text>
          </Col>
          <Col span={8}>
            <Text strong>{i18next.t("general:Version")}: </Text>
            <Tag color="blue">{renderResult.chartVersion}</Tag>
          </Col>
          <Col span={8}>
            <Text strong>{i18next.t("general:Namespace")}: </Text>
            <Tag color="green">{renderResult.namespace}</Tag>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <CodeOutlined />
            {i18next.t("application:Kubernetes Resources")} ({parsedResources.length})
          </Space>
        }
        style={{marginBottom: 24}}
      >
        <Row gutter={[16, 16]}>
          {parsedResources.map((resource) => (
            <Col span={24} key={resource.id}>
              <Card
                size="small"
                title={
                  <Space>
                    {this.getKindIcon(resource.kind)}
                    <Text strong>{resource.name}</Text>
                    <Tag color={this.getKindColor(resource.kind)}>{resource.kind}</Tag>
                    <Text type="secondary">({resource.apiVersion})</Text>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => this.handleCopyYamlClick(resource.yaml)}
                  >
                    {i18next.t("general:Copy")}
                  </Button>
                }
                style={{marginBottom: 8}}
              >
                <Row gutter={16}>
                  <CodeMirror
                    value={resource.yaml}
                    options={{
                      mode: "yaml",
                      lineNumbers: true,
                      theme: isDarkMode ? "material-darker" : "idea",
                    }}
                  />
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            {i18next.t("application:Rendered YAML")}
          </Space>
        }
        size="small"
      >
        <CodeMirror
          value={renderResult.renderedYaml}
          options={{
            mode: "yaml",
            lineNumbers: true,
            theme: isDarkMode ? "material-darker" : "idea",
          }}
        />
      </Card>
    </>;
  };

  render() {
    const {chartContent, loading, activeTab} = this.state;

    return (
      <Spin spinning={loading}>
        {chartContent && (
          <>
            <div style={{marginBottom: 16}}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div style={{display: "flex", alignItems: "center"}}>
                  <Avatar
                    size={48}
                    src={chartContent.applicationChart?.iconUrl}
                    icon={<AppstoreOutlined />}
                    style={{
                      marginRight: 12,
                      flexShrink: 0,
                      backgroundColor: "#ffffffd9",
                      color: "#141414",
                    }}
                    shape="square"
                  />
                  <div>
                    <Title level={3} style={{margin: 0}}>
                      {chartContent.applicationChart?.displayName || chartContent.metadata?.name}
                    </Title>
                    <Paragraph type="secondary" style={{margin: 0, fontSize: "14px"}}>
                      {chartContent.applicationChart?.description || chartContent.metadata?.description}
                    </Paragraph>
                  </div>
                </div>

                {!Setting.isMobile() && (
                  (() => {
                    return (
                      <Button
                        type="primary"
                        icon={<DeploymentUnitOutlined />}
                        loading={this.state.loading || this.state.deploying}
                        onClick={activeTab === "render-result" ? this.handleDeployClick : this.handleNextStep}
                      >
                        {activeTab === "render-result" ? i18next.t("application:Deploy") : i18next.t("application:Next Step")}
                      </Button>
                    );
                  })()
                )}
              </div>

              {Setting.isMobile() && (
                (() => {
                  return (
                    <Button
                      type="primary"
                      icon={<DeploymentUnitOutlined />}
                      loading={this.state.loading || this.state.deploying}
                      onClick={activeTab === "render-result" ? this.handleDeployClick : this.handleNextStep}
                      style={{marginTop: 12}}
                      block
                      size="large"
                    >
                      {activeTab === "render-result" ? i18next.t("application:Deploy") : i18next.t("application:Next Step")}
                    </Button>
                  );
                })()
              )}
            </div>

            <Steps
              type="navigation"
              size="small"
              current={this.getAllStepKeys().indexOf(activeTab)}
              onChange={(current) => {
                const allKeys = this.getAllStepKeys();
                const key = allKeys[current];
                // prevent selecting final step unless renderResult exists
                if (key === "render-result" && !this.state.renderResult) {
                  message.info(i18next.t("application:Please complete configuration and click Next Step to proceed"));
                  return;
                }
                if (key === "render-result") {
                  this.setState({activeTab: "render-result"});
                } else {
                  this.setState({activeTab: key});
                }
              }}
              className="site-navigation-steps"
              items={this.getAllStepKeys().map((k) => ({
                key: k,
                title: k === "overview" ? i18next.t("general:Overview") : (k === "config" ? i18next.t("general:Configuration") : i18next.t("general:Confirm Configuration")),
              }))}
              style={{marginBottom: 12}}
            />

            {/* Render content based on active step */}
            {activeTab === "overview" && this.renderOverviewTab()}
            {activeTab === "config" && this.renderConfigTab()}
            {activeTab === "render-result" && this.renderConfirmTab()}
          </>
        )}
      </Spin>
    );
  }
}

export default ApplicationDetailComponent;

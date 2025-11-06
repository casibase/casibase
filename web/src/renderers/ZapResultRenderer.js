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
import {Badge, Card, Collapse, Descriptions, Empty, Tag} from "antd";
import {BugOutlined, GlobalOutlined, SafetyCertificateOutlined} from "@ant-design/icons";

const {Panel} = Collapse;

/**
 * ZapResultRenderer - Renders structured ZAP scan results
 * @param {string} result - JSON string containing ZAP scan results
 */
function ZapResultRenderer({result}) {
  if (!result) {
    return <Empty description="No scan results available" />;
  }

  let scanData;
  try {
    scanData = JSON.parse(result);
  } catch (e) {
    return <Empty description="Invalid scan result format" />;
  }

  const {sites = [], summary = {}} = scanData;

  // Get risk level color
  const getRiskColor = (riskDesc) => {
    const riskLower = (riskDesc || "").toLowerCase();
    if (riskLower.includes("high")) {
      return "red";
    } else if (riskLower.includes("medium")) {
      return "orange";
    } else if (riskLower.includes("low")) {
      return "blue";
    } else if (riskLower.includes("informational")) {
      return "green";
    }
    return "default";
  };

  // Get risk badge status
  const getRiskStatus = (riskDesc) => {
    const riskLower = (riskDesc || "").toLowerCase();
    if (riskLower.includes("high")) {
      return "error";
    } else if (riskLower.includes("medium")) {
      return "warning";
    } else if (riskLower.includes("low")) {
      return "processing";
    } else if (riskLower.includes("informational")) {
      return "success";
    }
    return "default";
  };

  // If no sites or alerts found
  if (sites.length === 0 || summary.totalAlerts === 0) {
    return (
      <Card>
        <Empty
          image={<SafetyCertificateOutlined style={{fontSize: 64, color: "#52c41a"}} />}
          description={
            <span style={{fontSize: 16, color: "#52c41a"}}>
              <strong>No security alerts found</strong>
            </span>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      {/* Summary Card */}
      <Card
        title={
          <span>
            <BugOutlined /> Scan Summary
          </span>
        }
        style={{marginBottom: 16}}
        size="small"
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Total Alerts">
            <Badge count={summary.totalAlerts || 0} showZero style={{backgroundColor: "#108ee9"}} />
          </Descriptions.Item>
          <Descriptions.Item label="Sites Scanned">
            <Badge count={sites.length || 0} showZero style={{backgroundColor: "#87d068"}} />
          </Descriptions.Item>
          <Descriptions.Item label="By Risk Level">
            {summary.byRisk && Object.keys(summary.byRisk).length > 0 ? (
              <span>
                {Object.entries(summary.byRisk).map(([risk, count]) => (
                  <Tag key={risk} color={getRiskColor(risk)} style={{marginRight: 4}}>
                    {risk}: {count}
                  </Tag>
                ))}
              </span>
            ) : (
              <span>N/A</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="By Confidence">
            {summary.byConfidence && Object.keys(summary.byConfidence).length > 0 ? (
              <span>
                {Object.entries(summary.byConfidence).map(([confidence, count]) => (
                  <Tag key={confidence} style={{marginRight: 4}}>
                    {confidence}: {count}
                  </Tag>
                ))}
              </span>
            ) : (
              <span>N/A</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Sites and Alerts */}
      {sites.map((site, siteIndex) => (
        <Card
          key={siteIndex}
          title={
            <span>
              <GlobalOutlined /> {site.name || site.host || "Unknown Site"}
            </span>
          }
          extra={
            <span>
              {site.alerts && site.alerts.length > 0 && (
                <Badge count={site.alerts.length} style={{backgroundColor: "#108ee9"}} />
              )}
            </span>
          }
          style={{marginBottom: 16}}
          size="small"
        >
          {site.host && (
            <div style={{marginBottom: 12}}>
              <strong>Host:</strong> {site.host}
              {site.port && <span> | <strong>Port:</strong> {site.port}</span>}
              {site.ssl && <span> | <strong>SSL:</strong> {site.ssl}</span>}
            </div>
          )}

          {/* Alerts for this site */}
          {site.alerts && site.alerts.length > 0 ? (
            site.alerts.map((alert, alertIndex) => (
              <Card
                key={alertIndex}
                title={
                  <span>
                    <Badge status={getRiskStatus(alert.riskdesc)} />
                    {alert.alert || alert.name || "Unknown Alert"}
                  </span>
                }
                extra={
                  <Tag color={getRiskColor(alert.riskdesc)}>
                    {alert.riskdesc || "Unknown Risk"}
                  </Tag>
                }
                style={{marginBottom: 12}}
                size="small"
                type="inner"
              >
                <Descriptions column={1} size="small">
                  {alert.pluginid && (
                    <Descriptions.Item label="Plugin ID">
                      <code>{alert.pluginid}</code>
                    </Descriptions.Item>
                  )}
                  {alert.desc && (
                    <Descriptions.Item label="Description">
                      <div dangerouslySetInnerHTML={{__html: alert.desc.replace(/\n/g, "<br/>")}} />
                    </Descriptions.Item>
                  )}
                  {alert.solution && (
                    <Descriptions.Item label="Solution">
                      <div dangerouslySetInnerHTML={{__html: alert.solution.replace(/\n/g, "<br/>")}} />
                    </Descriptions.Item>
                  )}
                  {alert.reference && (
                    <Descriptions.Item label="Reference">
                      {alert.reference.split("\n").map((ref, idx) => (
                        <div key={idx}>
                          <a href={ref.trim()} target="_blank" rel="noopener noreferrer">
                            {ref.trim()}
                          </a>
                        </div>
                      ))}
                    </Descriptions.Item>
                  )}
                  {alert.cweid && (
                    <Descriptions.Item label="CWE ID">
                      <Tag>{alert.cweid}</Tag>
                    </Descriptions.Item>
                  )}
                  {alert.wascid && (
                    <Descriptions.Item label="WASC ID">
                      <Tag>{alert.wascid}</Tag>
                    </Descriptions.Item>
                  )}
                  {alert.confidence && (
                    <Descriptions.Item label="Confidence">
                      <Tag color="blue">{alert.confidence}</Tag>
                    </Descriptions.Item>
                  )}
                  {alert.count && (
                    <Descriptions.Item label="Count">
                      <Badge count={alert.count} showZero style={{backgroundColor: "#108ee9"}} />
                    </Descriptions.Item>
                  )}
                  {alert.instances && alert.instances.length > 0 && (
                    <Descriptions.Item label="Instances">
                      <Collapse size="small">
                        {alert.instances.map((instance, instIndex) => (
                          <Panel
                            header={`Instance ${instIndex + 1}: ${instance.uri || "N/A"}`}
                            key={instIndex}
                          >
                            <Descriptions column={1} size="small">
                              {instance.uri && (
                                <Descriptions.Item label="URI">
                                  <a href={instance.uri} target="_blank" rel="noopener noreferrer">
                                    {instance.uri}
                                  </a>
                                </Descriptions.Item>
                              )}
                              {instance.method && (
                                <Descriptions.Item label="Method">
                                  <Tag>{instance.method}</Tag>
                                </Descriptions.Item>
                              )}
                              {instance.param && (
                                <Descriptions.Item label="Parameter">
                                  <code>{instance.param}</code>
                                </Descriptions.Item>
                              )}
                              {instance.attack && (
                                <Descriptions.Item label="Attack">
                                  <code style={{whiteSpace: "pre-wrap", wordBreak: "break-all"}}>
                                    {instance.attack}
                                  </code>
                                </Descriptions.Item>
                              )}
                              {instance.evidence && (
                                <Descriptions.Item label="Evidence">
                                  <code style={{whiteSpace: "pre-wrap", wordBreak: "break-all"}}>
                                    {instance.evidence}
                                  </code>
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </Panel>
                        ))}
                      </Collapse>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            ))
          ) : (
            <Empty description="No alerts for this site" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      ))}
    </div>
  );
}

export default ZapResultRenderer;

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
import {Badge, Card, Descriptions, Empty, Tag} from "antd";
import {BugOutlined, SafetyCertificateOutlined} from "@ant-design/icons";

/**
 * NucleiResultRenderer - Renders structured Nuclei scan results
 * @param {string} result - JSON string containing Nuclei scan results
 */
function NucleiResultRenderer({result}) {
  if (!result) {
    return <Empty description="No scan results available" />;
  }

  let scanData;
  try {
    scanData = JSON.parse(result);
  } catch (e) {
    return <Empty description="Invalid scan result format" />;
  }

  const {vulnerabilities = [], summary = {}} = scanData;

  // Get severity color
  const getSeverityColor = (severity) => {
    const severityLower = (severity || "").toLowerCase();
    switch (severityLower) {
    case "critical":
      return "red";
    case "high":
      return "orange";
    case "medium":
      return "gold";
    case "low":
      return "blue";
    case "info":
      return "green";
    default:
      return "default";
    }
  };

  // Get severity badge status
  const getSeverityStatus = (severity) => {
    const severityLower = (severity || "").toLowerCase();
    switch (severityLower) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "processing";
    case "low":
      return "default";
    case "info":
      return "success";
    default:
      return "default";
    }
  };

  // If no vulnerabilities found
  if (vulnerabilities.length === 0) {
    return (
      <Card>
        <Empty
          image={<SafetyCertificateOutlined style={{fontSize: 64, color: "#52c41a"}} />}
          description={
            <span style={{fontSize: 16, color: "#52c41a"}}>
              <strong>No vulnerabilities found</strong>
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
          <Descriptions.Item label="Total Vulnerabilities">
            <Badge count={summary.totalVulnerabilities || 0} showZero style={{backgroundColor: "#108ee9"}} />
          </Descriptions.Item>
          <Descriptions.Item label="By Severity">
            {summary.bySeverity && Object.keys(summary.bySeverity).length > 0 ? (
              <span>
                {Object.entries(summary.bySeverity).map(([severity, count]) => (
                  <Tag key={severity} color={getSeverityColor(severity)} style={{marginRight: 4}}>
                    {severity}: {count}
                  </Tag>
                ))}
              </span>
            ) : (
              <span>N/A</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Vulnerabilities List */}
      {vulnerabilities.map((vuln, index) => (
        <Card
          key={index}
          title={
            <span>
              <Badge status={getSeverityStatus(vuln.severity)} />
              {vuln.name || vuln.templateID || "Unknown Vulnerability"}
            </span>
          }
          extra={
            <Tag color={getSeverityColor(vuln.severity)}>
              {(vuln.severity || "unknown").toUpperCase()}
            </Tag>
          }
          style={{marginBottom: 12}}
          size="small"
        >
          <Descriptions column={1} size="small">
            {vuln.templateID && (
              <Descriptions.Item label="Template ID">
                <code>{vuln.templateID}</code>
              </Descriptions.Item>
            )}
            {vuln.description && (
              <Descriptions.Item label="Description">
                {vuln.description}
              </Descriptions.Item>
            )}
            {vuln.type && (
              <Descriptions.Item label="Type">
                <Tag>{vuln.type}</Tag>
              </Descriptions.Item>
            )}
            {vuln.host && (
              <Descriptions.Item label="Host">
                {vuln.host}
              </Descriptions.Item>
            )}
            {vuln.matchedAt && (
              <Descriptions.Item label="Matched At">
                <a href={vuln.matchedAt} target="_blank" rel="noopener noreferrer">
                  {vuln.matchedAt}
                </a>
              </Descriptions.Item>
            )}
            {vuln.ip && (
              <Descriptions.Item label="IP Address">
                {vuln.ip}
              </Descriptions.Item>
            )}
            {vuln.timestamp && (
              <Descriptions.Item label="Timestamp">
                {new Date(vuln.timestamp).toLocaleString()}
              </Descriptions.Item>
            )}
            {vuln.extractedResults && vuln.extractedResults.length > 0 && (
              <Descriptions.Item label="Extracted Results">
                {vuln.extractedResults.map((result, idx) => (
                  <div key={idx}>
                    <code>{result}</code>
                  </div>
                ))}
              </Descriptions.Item>
            )}
            {vuln.reference && vuln.reference.length > 0 && (
              <Descriptions.Item label="References">
                {vuln.reference.map((ref, idx) => (
                  <div key={idx}>
                    <a href={ref} target="_blank" rel="noopener noreferrer">
                      {ref}
                    </a>
                  </div>
                ))}
              </Descriptions.Item>
            )}
            {vuln.curlCommand && (
              <Descriptions.Item label="cURL Command">
                <code style={{fontSize: 11, display: "block", whiteSpace: "pre-wrap", wordBreak: "break-all"}}>
                  {vuln.curlCommand}
                </code>
              </Descriptions.Item>
            )}
            {vuln.classification && Object.keys(vuln.classification).length > 0 && (
              <Descriptions.Item label="Classification">
                {Object.entries(vuln.classification).map(([key, value]) => (
                  <Tag key={key}>
                    {key}: {String(value)}
                  </Tag>
                ))}
              </Descriptions.Item>
            )}
            {vuln.metadata && Object.keys(vuln.metadata).length > 0 && (
              <Descriptions.Item label="Metadata">
                {Object.entries(vuln.metadata).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      ))}
    </div>
  );
}

export default NucleiResultRenderer;

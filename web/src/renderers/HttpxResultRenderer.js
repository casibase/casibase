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
import {Badge, Card, Descriptions, Empty, Table, Tag} from "antd";
import {GlobalOutlined, LinkOutlined} from "@ant-design/icons";

/**
 * HttpxResultRenderer - Renders structured httpx scan results
 * @param {string} result - JSON string containing httpx scan results
 */
function HttpxResultRenderer({result}) {
  if (!result) {
    return <Empty description="No scan results available" />;
  }

  let scanData;
  try {
    scanData = JSON.parse(result);
  } catch (e) {
    return <Empty description="Invalid scan result format" />;
  }

  const {hosts = [], summary = {}} = scanData;

  // If no hosts found
  if (hosts.length === 0) {
    return (
      <Card>
        <Empty
          image={<GlobalOutlined style={{fontSize: 64, color: "#52c41a"}} />}
          description={
            <span style={{fontSize: 16, color: "#52c41a"}}>
              <strong>No hosts found</strong>
            </span>
          }
        />
      </Card>
    );
  }

  // Helper function to get status color
  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "success";
    } else if (statusCode >= 300 && statusCode < 400) {
      return "processing";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "warning";
    } else if (statusCode >= 500) {
      return "error";
    }
    return "default";
  };

  // Define table columns
  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (text, record, index) => index + 1,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url) => (
        <span>
          <LinkOutlined style={{marginRight: 8, color: "#1890ff"}} />
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status_code",
      key: "status_code",
      width: 100,
      render: (statusCode) => (
        <Badge
          status={getStatusColor(statusCode)}
          text={statusCode || "N/A"}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title) => title || "-",
    },
    {
      title: "Webserver",
      dataIndex: "webserver",
      key: "webserver",
      width: 120,
      render: (webserver) => webserver ? <Tag color="blue">{webserver}</Tag> : "-",
    },
    {
      title: "Technologies",
      dataIndex: "technologies",
      key: "technologies",
      render: (technologies) => (
        <>
          {technologies && technologies.length > 0 ? (
            technologies.map((tech, index) => (
              <Tag color="green" key={index} style={{marginBottom: 4}}>
                {tech}
              </Tag>
            ))
          ) : (
            "-"
          )}
        </>
      ),
    },
    {
      title: "Content Length",
      dataIndex: "content_length",
      key: "content_length",
      width: 120,
      render: (length) => (length ? `${length} bytes` : "-"),
    },
  ];

  // Calculate additional summary statistics
  const totalHosts = summary.totalHosts || 0;
  const successfulHosts = Object.keys(summary.byStatusCode || {})
    .filter(code => code.startsWith("2"))
    .reduce((sum, code) => sum + (summary.byStatusCode[code] || 0), 0);

  return (
    <div>
      {/* Summary Card */}
      <Card
        title={
          <span>
            <GlobalOutlined /> Scan Summary
          </span>
        }
        style={{marginBottom: 16}}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Total Hosts">
            <Badge count={totalHosts} showZero style={{backgroundColor: "#1890ff"}} />
          </Descriptions.Item>
          <Descriptions.Item label="Successful Responses">
            <Badge
              count={successfulHosts}
              showZero
              style={{backgroundColor: "#52c41a"}}
            />
          </Descriptions.Item>
          <Descriptions.Item label="With Technologies">
            <Badge
              count={summary.withTech || 0}
              showZero
              style={{backgroundColor: "#722ed1"}}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Status Codes">
            {Object.keys(summary.byStatusCode || {}).length > 0 ? (
              Object.entries(summary.byStatusCode)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([code, count]) => (
                  <Tag key={code} color={getStatusColor(parseInt(code))}>
                    {code}: {count}
                  </Tag>
                ))
            ) : (
              <span>-</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Schemes" span={2}>
            {Object.keys(summary.byScheme || {}).length > 0 ? (
              Object.entries(summary.byScheme)
                .map(([scheme, count]) => (
                  <Tag key={scheme} color={scheme === "https" ? "green" : "orange"}>
                    {scheme.toUpperCase()}: {count}
                  </Tag>
                ))
            ) : (
              <span>-</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Hosts Table */}
      <Card
        title={
          <span>
            <LinkOutlined /> Discovered Hosts ({totalHosts})
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={hosts}
          rowKey={(record, index) => index}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} hosts`,
          }}
          scroll={{x: 1200}}
        />
      </Card>
    </div>
  );
}

export default HttpxResultRenderer;

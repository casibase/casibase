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
import {GlobalOutlined, SafetyCertificateOutlined} from "@ant-design/icons";

/**
 * SubfinderResultRenderer - Renders structured Subfinder scan results
 * @param {string} result - JSON string containing Subfinder scan results
 */
function SubfinderResultRenderer({result}) {
  if (!result) {
    return <Empty description="No scan results available" />;
  }

  let scanData;
  try {
    scanData = JSON.parse(result);
  } catch (e) {
    return <Empty description="Invalid scan result format" />;
  }

  const {subdomains = [], summary = {}} = scanData;

  // If no subdomains found
  if (subdomains.length === 0) {
    return (
      <Card>
        <Empty
          image={<SafetyCertificateOutlined style={{fontSize: 64, color: "#52c41a"}} />}
          description={
            <span style={{fontSize: 16, color: "#52c41a"}}>
              <strong>No subdomains found</strong>
            </span>
          }
        />
      </Card>
    );
  }

  // Define table columns
  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Subdomain",
      dataIndex: "host",
      key: "host",
      render: (host) => (
        <span>
          <GlobalOutlined style={{marginRight: 8, color: "#1890ff"}} />
          {host}
        </span>
      ),
    },
    {
      title: "Sources",
      dataIndex: "source",
      key: "source",
      render: (sources) => (
        <>
          {sources && sources.map((source, idx) => (
            <Tag key={idx} color="blue" style={{marginBottom: 4}}>
              {source}
            </Tag>
          ))}
        </>
      ),
    },
  ];

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
          <Descriptions.Item label="Total Subdomains">
            <Badge
              count={summary.totalSubdomains || 0}
              showZero
              style={{backgroundColor: "#52c41a"}}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Unique Sources">
            {summary.bySource ? Object.keys(summary.bySource).length : 0}
          </Descriptions.Item>
        </Descriptions>

        {/* Source breakdown */}
        {summary.bySource && Object.keys(summary.bySource).length > 0 && (
          <div style={{marginTop: 16}}>
            <strong>Sources:</strong>
            <div style={{marginTop: 8}}>
              {Object.entries(summary.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <Tag key={source} color="blue" style={{marginBottom: 4}}>
                    {source}: {count}
                  </Tag>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Subdomains Table */}
      <Card
        title={
          <span>
            <GlobalOutlined /> Discovered Subdomains ({subdomains.length})
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={subdomains}
          rowKey={(record, index) => `${record.host}-${index}`}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} subdomains`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
}

export default SubfinderResultRenderer;

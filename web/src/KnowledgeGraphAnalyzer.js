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
import {Card, Col, Divider, List, Progress, Row, Space, Statistic, Tag, Typography} from "antd";
import {FireOutlined, LinkOutlined} from "@ant-design/icons";
import i18next from "i18next";

const {Text} = Typography;

class KnowledgeGraphAnalyzer extends React.Component {
  constructor(props) {
    super(props);
  }

  calculateConnectedComponents = (nodes, links) => {
    if (nodes.length === 0) {
      return [];
    }

    const adjacencyList = {};
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });

    links.forEach(link => {
      adjacencyList[link.source].push(link.target);
      adjacencyList[link.target].push(link.source);
    });

    const visited = new Set();
    const components = [];

    const dfs = (nodeId, component) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      component.push(nodeId);

      adjacencyList[nodeId].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      });
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component = [];
        dfs(node.id, component);
        components.push(component);
      }
    });

    return components;
  };

  calculateGiantComponentRatio = (nodes, links) => {
    if (nodes.length === 0) {
      return 0;
    }

    const components = this.calculateConnectedComponents(nodes, links);
    if (components.length === 0) {
      return 0;
    }

    const largestComponent = components.reduce((largest, current) =>
      current.length > largest.length ? current : largest, []);

    return largestComponent.length / nodes.length;
  };

  getGraphStats = () => {
    const {data} = this.props;
    const {nodes, links} = data;

    const userNodes = nodes.filter(node => node.category === 0);
    const topicNodes = nodes.filter(node => node.category === 1);
    const entityNodes = nodes.filter(node => node.category === 2);

    const totalConnections = links.length;
    const avgConnections = nodes.length > 0 ? (totalConnections / nodes.length).toFixed(2) : 0;

    const nodeConnections = {};
    links.forEach(link => {
      nodeConnections[link.source] = (nodeConnections[link.source] || 0) + 1;
      nodeConnections[link.target] = (nodeConnections[link.target] || 0) + 1;
    });

    const mostActiveNodes = Object.entries(nodeConnections)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nodeId, count]) => {
        const node = nodes.find(n => n.id === nodeId);
        return {name: node?.name || nodeId, connections: count};
      });

    const topicWeights = topicNodes
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(node => ({name: node.name, weight: node.value}));

    const entityFrequencies = entityNodes
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(node => ({name: node.name, frequency: node.value}));

    const giantComponentRatio = this.calculateGiantComponentRatio(nodes, links);

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      userCount: userNodes.length,
      topicCount: topicNodes.length,
      entityCount: entityNodes.length,
      avgConnections,
      mostActiveNodes,
      topicWeights,
      entityFrequencies,
      density: nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0,
      giantComponentRatio,
    };
  };

  render() {
    const stats = this.getGraphStats();

    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title={i18next.t("knowledge:Total Nodes")}
                value={stats.totalNodes}
                prefix={<LinkOutlined />}
                valueStyle={{color: "#1890ff"}}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={i18next.t("knowledge:Total Connections")}
                value={stats.totalLinks}
                prefix={<LinkOutlined />}
                valueStyle={{color: "#52c41a"}}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={i18next.t("knowledge:Average Connections")}
                value={stats.avgConnections}
                precision={2}
                prefix={<LinkOutlined />}
                valueStyle={{color: "#fa8c16"}}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={i18next.t("knowledge:Network Density")}
                value={stats.density}
                precision={3}
                prefix={<FireOutlined />}
                valueStyle={{color: "#f5222d"}}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{marginTop: "16px"}}>
          <Col span={8}>
            <Card title={i18next.t("knowledge:Most Active Nodes")} size="small">
              <List
                size="small"
                dataSource={stats.mostActiveNodes}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <Tag color={index < 3 ? "#f5222d" : "#d9d9d9"}>{index + 1}</Tag>
                      <Text>{item.name}</Text>
                      <Text type="secondary">({item.connections})</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card title={i18next.t("knowledge:Top Topics")} size="small">
              <List
                size="small"
                dataSource={stats.topicWeights}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <Tag color={index < 3 ? "#52c41a" : "#d9d9d9"}>{index + 1}</Tag>
                      <Text>{item.name}</Text>
                      <Text type="secondary">({item.weight})</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card title={i18next.t("knowledge:Top Entities")} size="small">
              <List
                size="small"
                dataSource={stats.entityFrequencies}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <Tag color={index < 3 ? "#fa8c16" : "#d9d9d9"}>{index + 1}</Tag>
                      <Text>{item.name}</Text>
                      <Text type="secondary">({item.frequency})</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{marginTop: "16px"}}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title={i18next.t("knowledge:Node Distribution")} size="small">
              <Space direction="vertical" style={{width: "100%"}}>
                <div>
                  <Text>{i18next.t("knowledge:Users")}</Text>
                  <Progress
                    percent={stats.totalNodes > 0 ? (stats.userCount / stats.totalNodes * 100).toFixed(2) : 0}
                    size="small"
                    strokeColor="#1890ff"
                  />
                  <Text type="secondary">{stats.userCount}</Text>
                </div>
                <div>
                  <Text>{i18next.t("knowledge:Topics")}</Text>
                  <Progress
                    percent={stats.totalNodes > 0 ? (stats.topicCount / stats.totalNodes * 100).toFixed(2) : 0}
                    size="small"
                    strokeColor="#52c41a"
                  />
                  <Text type="secondary">{stats.topicCount}</Text>
                </div>
                <div>
                  <Text>{i18next.t("knowledge:Entities")}</Text>
                  <Progress
                    percent={stats.totalNodes > 0 ? (stats.entityCount / stats.totalNodes * 100).toFixed(2) : 0}
                    size="small"
                    strokeColor="#fa8c16"
                  />
                  <Text type="secondary">{stats.entityCount}</Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title={i18next.t("knowledge:Network Insights")} size="small">
              <Space direction="vertical" style={{width: "100%"}}>
                <div>
                  <Text strong>{i18next.t("knowledge:Network Density")}:</Text>
                  <Text type="secondary"> {stats.density.toFixed(3)}</Text>
                  <br />
                  <Text type="secondary">
                    {stats.density > 0.5 ? i18next.t("knowledge:High connectivity network") :
                      stats.density > 0.2 ? i18next.t("knowledge:Moderate connectivity network") :
                        i18next.t("knowledge:Sparse network with isolated clusters")}
                  </Text>
                </div>
                <Divider style={{margin: "8px 0"}} />
                <div>
                  <Text strong>{i18next.t("knowledge:Giant Component Ratio")}:</Text>
                  <Text type="secondary"> {(stats.giantComponentRatio * 100).toFixed(1)}%</Text>
                  <br />
                  <Text type="secondary">
                    {stats.giantComponentRatio > 0.8 ? i18next.t("knowledge:Information is well interconnected") :
                      i18next.t("knowledge:Many isolated clusters exist")}
                  </Text>
                </div>
                <Divider style={{margin: "8px 0"}} />
                <div>
                  <Text strong>{i18next.t("knowledge:Most Connected Type")}:</Text>
                  <br />
                  <Text type="secondary">
                    {stats.userCount > stats.topicCount && stats.userCount > stats.entityCount ?
                      i18next.t("knowledge:User-driven conversations") :
                      stats.topicCount > stats.entityCount ?
                        i18next.t("knowledge:Topic-focused discussions") :
                        i18next.t("knowledge:Entity-rich content")}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default KnowledgeGraphAnalyzer;

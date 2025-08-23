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
import {Button, Card, Col, DatePicker, Empty, Input, Row, Select, Space, Spin, Tag, Typography} from "antd";
import {DownloadOutlined, EyeOutlined, ReloadOutlined, SearchOutlined} from "@ant-design/icons";
import moment from "moment";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import KnowledgeGraphChart from "./KnowledgeGraphChart";
import KnowledgeGraphAnalyzer from "./KnowledgeGraphAnalyzer";

const {Title, Text} = Typography;
const {RangePicker} = DatePicker;
const {Option} = Select;

const ENGLISH_STOP_WORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those",

  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "can", "could", "should", "may", "might", "must", "shall", "ought", "need", "dare",

  "of", "in", "on", "at", "by", "for", "with", "without", "from", "into", "through", "during", "before", "after",
  "above", "below", "between", "among", "within", "without", "against", "toward", "towards", "up", "down", "out",
  "off", "over", "under", "across", "along", "around", "behind", "beneath", "beside", "beyond", "inside", "outside",

  "and", "or", "but", "nor", "yet", "so", "because", "although", "unless", "while", "whereas", "since", "as",

  "very", "just", "now", "then", "here", "there", "when", "where", "why", "what", "how", "again", "further", "once",
  "also", "well", "even", "still", "back", "much", "too", "so", "than", "only", "even", "quite", "rather",

  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "her", "its",
  "our", "their", "mine", "yours", "his", "hers", "ours", "theirs", "myself", "yourself", "himself", "herself",
  "itself", "ourselves", "yourselves", "themselves",

  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "every", "either", "neither",
  "many", "much", "several", "various", "numerous", "countless", "multiple", "single", "double", "triple",

  "not", "no", "never", "none", "nothing", "nobody", "nowhere", "neither", "nor",

  "today", "tomorrow", "yesterday", "now", "then", "soon", "later", "early", "late", "always", "never", "often",
  "sometimes", "usually", "rarely", "seldom", "frequently", "occasionally", "recently", "previously", "currently",

  "###", "##", "#", "http", "https", "www", "com", "org", "net", "edu", "gov", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "10.",

  "like", "just", "really", "actually", "basically", "literally", "simply", "merely", "only", "even", "still",
  "again", "back", "away", "out", "off", "on", "up", "down", "over", "under", "through", "across", "along",
  "around", "behind", "beneath", "beside", "beyond", "hello", "hi", "example", "based", "using", "use",
]);

const getStopWords = () => {
  const currentLanguage = i18next.language || "en";

  if (currentLanguage === "en") {
    return ENGLISH_STOP_WORDS;
  }

  try {
    const stopWordsKey = `knowledge:stopWords.${currentLanguage}`;
    const translatedStopWords = i18next.t(stopWordsKey, {returnObjects: true});

    if (Array.isArray(translatedStopWords)) {
      return new Set(translatedStopWords);
    }
  } catch (error) {
    Setting.showMessage("error", `Failed to get stop words for language: ${currentLanguage}, using English stop words`);
  }

  return ENGLISH_STOP_WORDS;
};

class KnowledgeGraphPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      chats: [],
      selectedChats: [],
      dateRange: [moment().subtract(7, "days"), moment()],
      graphData: {
        nodes: [],
        links: [],
      },
      filterKeyword: "",
      selectedUsers: [],
      allUsers: [],
      selectedNode: null,
      nodeDetails: null,
      graphType: "force",
      showUserNodes: true,
      showTopicNodes: true,
      showEntityNodes: true,
      showAnalyzer: false,
      autoGenerate: true,
    };
  }

  componentDidMount() {
    this.loadChats();
  }

  loadChats = () => {
    this.setState({loading: true});
    ChatBackend.getChats("admin", this.props.account?.storeName || "")
      .then((res) => {
        if (res.status === "ok") {
          const sortedChats = res.data.sort((a, b) => {
            const aMessages = a.messageCount || 0;
            const bMessages = b.messageCount || 0;
            return bMessages - aMessages;
          });

          const defaultSelectedChats = sortedChats.slice(0, 5).map(chat => chat.name);

          this.setState({
            chats: res.data,
            selectedChats: defaultSelectedChats,
          }, () => {
            if (defaultSelectedChats.length > 0) {
              this.generateKnowledgeGraph();
            } else {
              Setting.showMessage("info", i18next.t("knowledge:No chats available. Please create some chats first."));
            }
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
        this.setState({loading: false});
      })
      .catch(error => {
        Setting.showMessage("error", error);
        this.setState({loading: false});
      });
  };

  generateKnowledgeGraph = () => {
    this.setState({loading: true});

    const promises = this.state.selectedChats.map(chatName =>
      MessageBackend.getChatMessages("admin", chatName)
    );

    Promise.all(promises)
      .then((responses) => {
        const allMessages = [];
        responses.forEach((res, index) => {
          if (res.status === "ok") {
            allMessages.push(...res.data.map(msg => ({
              ...msg,
              chatName: this.state.selectedChats[index],
            })));
          }
        });

        let filteredMessages = allMessages;
        if (this.state.selectedUsers.length > 0) {
          filteredMessages = allMessages.filter(msg =>
            this.state.selectedUsers.includes(msg.user)
          );
        }

        const allUsers = [...new Set(allMessages.map(msg => msg.user).filter(Boolean))];
        this.setState({allUsers});

        const graphData = this.processMessagesToGraph(filteredMessages);

        if (this.state.autoGenerate) {
          if (graphData.nodes.length > 0) {
            Setting.showMessage("success", i18next.t("knowledge:Knowledge graph generated successfully"));
          } else {
            Setting.showMessage("warning", i18next.t("knowledge:No data available to generate knowledge graph"));
          }
        }

        this.setState({
          graphData,
          loading: false,
          autoGenerate: false,
        });
      })
      .catch(error => {
        Setting.showMessage("error", error);
        this.setState({loading: false, autoGenerate: false});
      });
  };

  processMessagesToGraph = (messages) => {
    const nodeMap = new Map();
    const linkMap = new Map();

    const users = new Set();
    messages.forEach(msg => {
      if (msg.user) {
        users.add(msg.user);
      }
    });

    users.forEach(user => {
      const nodeId = `user_${user}`;
      nodeMap.set(nodeId, {
        id: nodeId,
        name: user,
        category: 0,
        symbolSize: 20,
        value: 1,
        itemStyle: {
          color: "#1890ff",
        },
      });
    });

    const topics = this.extractTopics(messages);
    const entities = this.extractEntities(messages);

    const usedWords = new Set();

    const conflictMap = new Map();

    topics.forEach(topic => {
      const normalizedName = topic.name.toLowerCase();
      if (entities.some(entity => entity.name.toLowerCase() === normalizedName)) {
        conflictMap.set(normalizedName, {
          topic: topic,
          entity: entities.find(entity => entity.name.toLowerCase() === normalizedName),
        });
      }
    });

    entities.forEach(entity => {
      const normalizedName = entity.name.toLowerCase();
      const conflict = conflictMap.get(normalizedName);

      if (conflict) {
        const shouldBeEntity = this.shouldBeEntity(entity.name, conflict.topic, conflict.entity);
        if (shouldBeEntity) {
          const nodeId = `entity_${entity.name}`;
          usedWords.add(normalizedName);

          nodeMap.set(nodeId, {
            id: nodeId,
            name: entity.name,
            category: 2,
            symbolSize: Math.min(10 + entity.frequency, 25),
            value: entity.frequency,
            itemStyle: {
              color: "#fa8c16",
            },
          });
        }
      } else {
        const nodeId = `entity_${entity.name}`;
        usedWords.add(normalizedName);

        nodeMap.set(nodeId, {
          id: nodeId,
          name: entity.name,
          category: 2,
          symbolSize: Math.min(10 + entity.frequency, 25),
          value: entity.frequency,
          itemStyle: {
            color: "#fa8c16",
          },
        });
      }
    });

    topics.forEach((topic) => {
      const normalizedName = topic.name.toLowerCase();
      const conflict = conflictMap.get(normalizedName);

      if (conflict) {
        const shouldBeEntity = this.shouldBeEntity(topic.name, conflict.topic, conflict.entity);
        if (!shouldBeEntity && !usedWords.has(normalizedName)) {
          const nodeId = `topic_${topic.name}`;
          usedWords.add(normalizedName);

          nodeMap.set(nodeId, {
            id: nodeId,
            name: topic.name,
            category: 1,
            symbolSize: Math.min(15 + topic.weight * 2, 30),
            value: topic.weight,
            itemStyle: {
              color: "#52c41a",
            },
          });
        }
      } else if (!usedWords.has(normalizedName)) {
        const nodeId = `topic_${topic.name}`;
        usedWords.add(normalizedName);

        nodeMap.set(nodeId, {
          id: nodeId,
          name: topic.name,
          category: 1,
          symbolSize: Math.min(15 + topic.weight * 2, 30),
          value: topic.weight,
          itemStyle: {
            color: "#52c41a",
          },
        });
      }
    });

    messages.forEach(msg => {
      const userNodeId = `user_${msg.user}`;

      const msgTopics = this.extractTopics([msg]);
      msgTopics.forEach(topic => {
        const topicNodeId = `topic_${topic.name}`;

        if (nodeMap.has(topicNodeId)) {
          const linkId = `${userNodeId}-${topicNodeId}`;

          if (!linkMap.has(linkId)) {
            linkMap.set(linkId, {
              source: userNodeId,
              target: topicNodeId,
              value: 1,
            });
          } else {
            linkMap.get(linkId).value += 1;
          }
        }
      });

      const msgEntities = this.extractEntities([msg]);
      msgEntities.forEach(entity => {
        const entityNodeId = `entity_${entity.name}`;

        if (nodeMap.has(entityNodeId)) {
          const linkId = `${userNodeId}-${entityNodeId}`;

          if (!linkMap.has(linkId)) {
            linkMap.set(linkId, {
              source: userNodeId,
              target: entityNodeId,
              value: 1,
            });
          } else {
            linkMap.get(linkId).value += 1;
          }
        }
      });
    });

    const result = {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    };

    return result;
  };

  shouldBeEntity = (word, topic, entity) => {
    if (/^[A-Z]/.test(word)) {
      return true;
    }

    if (entity.frequency > topic.weight * 1.5) {
      return true;
    }

    if (word.length > 5) {
      return true;
    }

    if (/\d/.test(word)) {
      return true;
    }

    return true;
  };

  extractTopics = (messages) => {
    const topicMap = new Map();

    messages.forEach(msg => {
      const text = msg.text || "";
      const words = text.split(/[\s,，。！？；：""""（）【】\n\r\t]/)
        .filter(word => {
          const cleanWord = word.trim().toLowerCase();
          return cleanWord.length > 1 &&
                 !getStopWords().has(cleanWord) &&
                 !/^\d+$/.test(cleanWord) &&
                 !/^[^\w\u4e00-\u9fff]+$/.test(cleanWord) &&
                 !/^[a-z]{1,2}$/.test(cleanWord);
        });

      words.forEach(word => {
        const cleanWord = word.trim().toLowerCase();
        if (topicMap.has(cleanWord)) {
          topicMap.get(cleanWord).weight += 1;
        } else {
          topicMap.set(cleanWord, {name: cleanWord, weight: 1});
        }
      });
    });

    const result = Array.from(topicMap.values())
      .filter(topic => topic.weight > 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);

    return result;
  };

  extractEntities = (messages) => {
    const entityMap = new Map();

    messages.forEach(msg => {
      const text = msg.text || "";

      const entityPatterns = [
        /[""]([^""]+)[""]/g,
        /[""]([^""]+)[""]/g,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
        /([一-龯]{2,})/g,
        /\b([A-Za-z]+\d+[A-Za-z]*)\b/g,
        /\b(\d+[A-Za-z]+)\b/g,
      ];

      entityPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          const cleanEntity = match.replace(/["""]/g, "").trim();

          if (cleanEntity.length > 1 &&
              !getStopWords().has(cleanEntity.toLowerCase()) &&
              !/^\d+$/.test(cleanEntity) &&
              !/^[^\w\u4e00-\u9fff]+$/.test(cleanEntity) &&
              !/^[a-z]{1,2}$/.test(cleanEntity.toLowerCase())) {

            const normalizedEntity = cleanEntity.toLowerCase();
            if (entityMap.has(normalizedEntity)) {
              entityMap.get(normalizedEntity).frequency += 1;
            } else {
              entityMap.set(normalizedEntity, {name: cleanEntity, frequency: 1});
            }
          }
        });
      });
    });

    const result = Array.from(entityMap.values())
      .filter(entity => entity.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);

    return result;
  };

  getNodeTypeName = (category) => {
    const types = [
      i18next.t("knowledge:User"),
      i18next.t("knowledge:Topic"),
      i18next.t("knowledge:Entity"),
    ];
    return types[category] || i18next.t("knowledge:Unknown");
  };

  handleNodeClick = (node) => {
    this.setState({
      selectedNode: node,
      nodeDetails: this.getNodeDetails(node),
    });
  };

  getNodeDetails = (node) => {
    return {
      name: node.name,
      type: this.getNodeTypeName(node.category),
      weight: node.value,
      connections: this.state.graphData.links.filter(link =>
        link.source === node.id || link.target === node.id
      ).length,
    };
  };

  exportGraph = () => {
    const {graphData} = this.state;
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `knowledge-graph-${moment().format("YYYY-MM-DD")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  render() {
    const {
      loading,
      chats,
      selectedChats,
      dateRange,
      filterKeyword,
      selectedUsers,
      allUsers,
      selectedNode,
      nodeDetails,
      graphType,
    } = this.state;

    return (
      <div style={{padding: "20px"}}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Title level={3}>
                <EyeOutlined /> {i18next.t("knowledge:Chat Knowledge Graph")}
              </Title>
              <Text type="secondary">
                {i18next.t("knowledge:Visualize relationships and patterns in chat conversations")}
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{marginTop: "16px"}}>
          <Col span={6}>
            <Card title={i18next.t("knowledge:Filters")} size="small">
              <Space direction="vertical" style={{width: "100%"}}>
                <div>
                  <Text strong>{i18next.t("knowledge:Select Chats")}</Text>
                  <Select
                    mode="multiple"
                    style={{width: "100%", marginTop: "8px"}}
                    placeholder={i18next.t("knowledge:Select chats to analyze")}
                    value={selectedChats}
                    onChange={(value) => {
                      this.setState({selectedChats: value}, () => {
                        if (value.length > 0) {
                          this.generateKnowledgeGraph();
                        } else {
                          this.setState({
                            graphData: {nodes: [], links: []},
                            selectedNode: null,
                            nodeDetails: null,
                          });
                        }
                      });
                    }}
                    maxTagCount={3}
                  >
                    {chats.map(chat => (
                      <Option key={chat.name} value={chat.name}>
                        {chat.displayName || chat.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong>{i18next.t("knowledge:Select Users")}</Text>
                  <Select
                    mode="multiple"
                    style={{width: "100%", marginTop: "8px"}}
                    placeholder={i18next.t("knowledge:Select users to analyze (leave empty for all users)")}
                    value={selectedUsers}
                    onChange={(value) => {
                      this.setState({selectedUsers: value}, () => {
                        if (this.state.selectedChats.length > 0 && this.state.graphData.nodes.length > 0) {
                          this.generateKnowledgeGraph();
                        }
                      });
                    }}
                    maxTagCount={3}
                    allowClear
                  >
                    {allUsers.map(user => (
                      <Option key={user} value={user}>
                        {user}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong>{i18next.t("knowledge:Date Range")}</Text>
                  <RangePicker
                    style={{width: "100%", marginTop: "8px"}}
                    value={dateRange}
                    onChange={(dates) => this.setState({dateRange: dates})}
                  />
                </div>

                <div>
                  <Text strong>{i18next.t("knowledge:Graph Type")}</Text>
                  <Select
                    style={{width: "100%", marginTop: "8px"}}
                    value={graphType}
                    onChange={(value) => this.setState({graphType: value})}
                  >
                    <Option value="force">{i18next.t("knowledge:Force Directed")}</Option>
                    <Option value="circular">{i18next.t("knowledge:Circular")}</Option>
                  </Select>
                </div>

                <div>
                  <Text strong>{i18next.t("knowledge:Search")}</Text>
                  <Input
                    placeholder={i18next.t("knowledge:Filter by keyword")}
                    prefix={<SearchOutlined />}
                    value={filterKeyword}
                    onChange={(e) => this.setState({filterKeyword: e.target.value})}
                    style={{marginTop: "8px"}}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.generateKnowledgeGraph}
                  loading={loading}
                  style={{width: "100%"}}
                >
                  {loading
                    ? i18next.t("knowledge:Generating...")
                    : this.state.graphData.nodes.length > 0
                      ? i18next.t("knowledge:Regenerate Graph")
                      : i18next.t("knowledge:Generate Graph")
                  }
                </Button>

                <Button
                  icon={<DownloadOutlined />}
                  onClick={this.exportGraph}
                  style={{width: "100%"}}
                >
                  {i18next.t("knowledge:Export Data")}
                </Button>

                <Button
                  type={this.state.showAnalyzer ? "primary" : "default"}
                  onClick={() => this.setState({showAnalyzer: !this.state.showAnalyzer})}
                  style={{width: "100%"}}
                  disabled={this.state.graphData.nodes.length === 0}
                >
                  {this.state.showAnalyzer ? i18next.t("knowledge:Hide Analysis") : i18next.t("knowledge:Show Analysis")}
                </Button>
              </Space>
            </Card>

            {selectedNode && (
              <Card title={i18next.t("knowledge:Node Details")} size="small" style={{marginTop: "16px"}}>
                <Space direction="vertical" style={{width: "100%"}}>
                  <div>
                    <Text strong>{i18next.t("knowledge:Name")}:</Text>
                    <Text>{nodeDetails.name}</Text>
                  </div>
                  <div>
                    <Text strong>{i18next.t("knowledge:Type")}:</Text>
                    <Tag color={selectedNode.category === 0 ? "blue" : selectedNode.category === 1 ? "green" : "orange"}>
                      {nodeDetails.type}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>{i18next.t("knowledge:Weight")}:</Text>
                    <Text>{nodeDetails.weight}</Text>
                  </div>
                  <div>
                    <Text strong>{i18next.t("knowledge:Connections")}:</Text>
                    <Text>{nodeDetails.connections}</Text>
                  </div>
                </Space>
              </Card>
            )}
          </Col>

          <Col span={18}>
            <Card>
              <Spin spinning={loading}>
                {this.state.graphData.nodes.length > 0 ? (
                  <KnowledgeGraphChart
                    data={this.state.graphData}
                    layout={this.state.graphType}
                    filterKeyword={this.state.filterKeyword}
                    onNodeClick={this.handleNodeClick}
                    i18n={(key) => i18next.t(key) || key}
                    style={{height: "600px"}}
                    loading={loading}
                  />
                ) : (
                  <Empty
                    description={
                      loading
                        ? i18next.t("knowledge:Generating knowledge graph...")
                        : this.state.selectedChats.length === 0
                          ? i18next.t("knowledge:Please select chats to analyze")
                          : i18next.t("knowledge:No data available. Please select chats and generate the graph.")
                    }
                    style={{margin: "100px 0"}}
                  />
                )}
              </Spin>
            </Card>

            {this.state.showAnalyzer && this.state.graphData.nodes.length > 0 && (
              <Card style={{marginTop: "16px"}}>
                <KnowledgeGraphAnalyzer
                  data={this.state.graphData}
                  i18n={(key) => i18next.t(key) || key}
                />
              </Card>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

export default KnowledgeGraphPage;

// Copyright 2020 The casbin Authors. All Rights Reserved.
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
import {Button, Col, Popconfirm, Row, Table, Tag, Tooltip} from 'antd';
import {EyeOutlined, MinusOutlined} from '@ant-design/icons';
import * as Setting from "./Setting";
import * as TopicBackend from "./backend/TopicBackend";
import moment from "moment";

class TopicPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topics: [],
    };
  }

  componentDidMount() {
    this.getTopics();
  }

  getTopics() {
    TopicBackend.getTopics()
      .then((res) => {
          this.setState({
            topics: res,
          });
        }
      );
  }

  newTopic() {
    return {
      owner: "admin",
      id: `topic_${this.state.topics.length}`,
      title: `Topic ${this.state.topics.length}`,
      createdTime: moment().format(),
      content: "Job description...",
    }
  }

  addTopic() {
    const newTopic = this.newTopic();
    TopicBackend.addTopic(newTopic)
      .then((res) => {
          Setting.showMessage("success", `Adding topic succeeded`);
          this.setState({
            topics: Setting.addRow(this.state.topics, newTopic),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Adding topic failed：${error}`);
      });
  }

  deleteTopic(i) {
    TopicBackend.deleteTopic(this.state.topics[i].id)
      .then((res) => {
          Setting.showMessage("success", `Deleting topic succeeded`);
          this.setState({
            topics: Setting.deleteRow(this.state.topics, i),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Deleting topic succeeded：${error}`);
      });
  }

  renderTable(topics) {
    const columns = [
      {
        title: 'Topic ID',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
      },
      {
        title: 'Created Time',
        dataIndex: 'createdTime',
        key: 'createdTime',
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        }
      },
      {
        title: 'Content',
        dataIndex: 'content',
        key: 'content',
      },
      {
        title: 'Action',
        dataIndex: '',
        key: 'op',
        width: '130px',
        render: (text, record, index) => {
          return (
            <div>
              <Tooltip placement="topLeft" title="View">
                <Button style={{marginRight: "5px"}} icon={<EyeOutlined/>} size="small"
                        onClick={() => Setting.openLink(`/topics/${this.state.websiteId}/topics/${record.id}/impressions`)}/>
              </Tooltip>
              <Popconfirm
                title={`Are you sure to delete topic: ${record.id} ?`}
                onConfirm={() => this.deleteTopic(index)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip placement="topLeft" title="Delete">
                  <Button icon={<MinusOutlined/>} size="small"/>
                </Tooltip>
              </Popconfirm>
            </div>
          )
        }
      },
    ];

    return (
      <div>
        <Table columns={columns} dataSource={topics} rowKey="name" size="middle" bordered pagination={{topicSize: 100}}
               title={() => (
                 <div>
                   Topics&nbsp;&nbsp;&nbsp;&nbsp;
                   <Button type="primary" size="small" onClick={this.addTopic.bind(this)}>Add</Button>
                 </div>
               )}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <Row>
          <Col span={24}>
            {
              this.renderTable(this.state.topics)
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default TopicPage;

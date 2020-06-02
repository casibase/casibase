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
import * as NodeBackend from "./backend/NodeBackend";
import moment from "moment";

class NodePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: [],
    };
  }

  componentDidMount() {
    this.getNodes();
  }

  getNodes() {
    NodeBackend.getNodes()
      .then((res) => {
          this.setState({
            nodes: res,
          });
        }
      );
  }

  newNode() {
    return {
      owner: "admin",
      id: `node_${this.state.nodes.length}`,
      title: `Node ${this.state.nodes.length}`,
      createdTime: moment().format(),
      desc: "description...",
    }
  }

  addNode() {
    const newNode = this.newNode();
    NodeBackend.addNode(newNode)
      .then((res) => {
          Setting.showMessage("success", `Adding node succeeded`);
          this.setState({
            nodes: Setting.addRow(this.state.nodes, newNode),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Adding node failed：${error}`);
      });
  }

  deleteNode(i) {
    NodeBackend.deleteNode(this.state.nodes[i].id)
      .then((res) => {
          Setting.showMessage("success", `Deleting node succeeded`);
          this.setState({
            nodes: Setting.deleteRow(this.state.nodes, i),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Deleting node succeeded：${error}`);
      });
  }

  renderTable(nodes) {
    const columns = [
      {
        title: 'Node ID',
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
        title: 'Desc',
        dataIndex: 'desc',
        key: 'desc',
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
                        onClick={() => Setting.openLink(`/nodes/${this.state.websiteId}/nodes/${record.id}/impressions`)}/>
              </Tooltip>
              <Popconfirm
                title={`Are you sure to delete node: ${record.id} ?`}
                onConfirm={() => this.deleteNode(index)}
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
        <Table columns={columns} dataSource={nodes} rowKey="name" size="middle" bordered pagination={{nodeSize: 100}}
               title={() => (
                 <div>
                   Nodes&nbsp;&nbsp;&nbsp;&nbsp;
                   <Button type="primary" size="small" onClick={this.addNode.bind(this)}>Add</Button>
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
              this.renderTable(this.state.nodes)
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default NodePage;

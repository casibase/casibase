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
import * as BoardBackend from "./backend/BoardBackend";
import moment from "moment";

class BoardPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      boards: [],
    };
  }

  componentDidMount() {
    this.getBoards();
  }

  getBoards() {
    BoardBackend.getBoards()
      .then((res) => {
          this.setState({
            boards: res,
          });
        }
      );
  }

  newBoard() {
    return {
      owner: "admin",
      id: `board_${this.state.boards.length}`,
      title: `Board ${this.state.boards.length}`,
      createdTime: moment().format(),
      desc: "description...",
    }
  }

  addBoard() {
    const newBoard = this.newBoard();
    BoardBackend.addBoard(newBoard)
      .then((res) => {
          Setting.showMessage("success", `Adding board succeeded`);
          this.setState({
            boards: Setting.addRow(this.state.boards, newBoard),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Adding board failed：${error}`);
      });
  }

  deleteBoard(i) {
    BoardBackend.deleteBoard(this.state.boards[i].id)
      .then((res) => {
          Setting.showMessage("success", `Deleting board succeeded`);
          this.setState({
            boards: Setting.deleteRow(this.state.boards, i),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Deleting board succeeded：${error}`);
      });
  }

  renderTable(boards) {
    const columns = [
      {
        title: 'Board ID',
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
                        onClick={() => Setting.openLink(`/boards/${this.state.websiteId}/boards/${record.id}/impressions`)}/>
              </Tooltip>
              <Popconfirm
                title={`Are you sure to delete board: ${record.id} ?`}
                onConfirm={() => this.deleteBoard(index)}
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
        <Table columns={columns} dataSource={boards} rowKey="name" size="middle" bordered pagination={{boardSize: 100}}
               title={() => (
                 <div>
                   Boards&nbsp;&nbsp;&nbsp;&nbsp;
                   <Button type="primary" size="small" onClick={this.addBoard.bind(this)}>Add</Button>
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
              this.renderTable(this.state.boards)
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default BoardPage;

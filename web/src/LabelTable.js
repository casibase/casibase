import React from "react";
import {DownOutlined, DeleteOutlined, UpOutlined} from '@ant-design/icons';
import {Button, Col, Input, InputNumber, Row, Table, Tooltip} from 'antd';
import * as Setting from "./Setting";
import i18next from "i18next";

class LabelTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
  }

  parseField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateField(table, index, key, value) {
    value = this.parseField(key, value);

    table[index][key] = value;
    this.updateTable(table);
  }

  addRow(table) {
    const currentTime = this.props.currentTime;

    if (table.filter(row => row.timestamp === currentTime).length !== 0) {
      Setting.showMessage("error", `Label with timestamp: ${currentTime} already exists`);
      return;
    }

    let row = {timestamp: currentTime, text: ""};
    if (table === undefined) {
      table = [];
    }
    table = Setting.addRow(table, row);
    this.updateTable(table);
  }

  deleteRow(table, i) {
    table = Setting.deleteRow(table, i);
    this.updateTable(table);
  }

  upRow(table, i) {
    table = Setting.swapRow(table, i - 1, i);
    this.updateTable(table);
  }

  downRow(table, i) {
    table = Setting.swapRow(table, i, i + 1);
    this.updateTable(table);
  }

  renderTable(table) {
    const columns = [
      {
        title: i18next.t("general:No."),
        dataIndex: 'no',
        key: 'no',
        width: '80px',
        render: (text, record, index) => {
          return (index + 1);
        }
      },
      {
        title: i18next.t("video:Timestamp (second)"),
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: '160px',
        render: (text, record, index) => {
          return (
            <InputNumber style={{width: "100%"}} min={0} value={text} onChange={value => {
              this.updateField(table, index, 'timestamp', value);
            }} />
          )
        }
      },
      {
        title: i18next.t("video:Text"),
        dataIndex: 'text',
        key: 'text',
        // width: '200px',
        render: (text, record, index) => {
          return (
            <Input value={text} onChange={e => {
              this.updateField(table, index, 'text', e.target.value);
            }} />
          )
        }
      },
      {
        title: i18next.t("general:Action"),
        key: 'action',
        width: '100px',
        render: (text, record, index) => {
          return (
            <div>
              <Tooltip placement="bottomLeft" title={"Up"}>
                <Button style={{marginRight: "5px"}} disabled={index === 0} icon={<UpOutlined />} size="small" onClick={() => this.upRow(table, index)} />
              </Tooltip>
              <Tooltip placement="topLeft" title={"Down"}>
                <Button style={{marginRight: "5px"}} disabled={index === table.length - 1} icon={<DownOutlined />} size="small" onClick={() => this.downRow(table, index)} />
              </Tooltip>
              <Tooltip placement="topLeft" title={"Delete"}>
                <Button icon={<DeleteOutlined />} size="small" onClick={() => this.deleteRow(table, index)} />
              </Tooltip>
            </div>
          );
        }
      },
    ];

    return (
      <Table rowKey="timestamp" columns={columns} dataSource={table} size="middle" bordered pagination={false}
             title={() => (
               <div>
                 {this.props.title}&nbsp;&nbsp;&nbsp;&nbsp;
                 <Button style={{marginRight: "5px"}} type="primary" size="small" onClick={() => this.addRow(table)}>{i18next.t("general:Add")}</Button>
                 {
                   this.props.wordset === undefined ? null : (
                     <Button style={{marginLeft: "5px", marginRight: "5px"}} size="small" onClick={() => Setting.downloadXlsx(this.props.wordset)}>{i18next.t("general:Download")}</Button>
                   )
                 }
               </div>
             )}
      />
    );
  }

  render() {
    return (
      <div>
        <Row style={{marginTop: '10px'}} >
          <Col span={24}>
            {
              this.renderTable(this.props.table)
            }
          </Col>
        </Row>
      </div>
    )
  }
}

export default LabelTable;

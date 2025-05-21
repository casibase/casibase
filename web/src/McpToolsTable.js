import React from "react";
import {Col, Input, Row, Switch, Table} from "antd";
import i18next from "i18next";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript";

class McpToolsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
  }

  updateField(table, index, key, value) {
    table[index][key] = value;
    this.updateTable(table);
  }

  renderTable(table) {
    const columns = [
      {
        title: i18next.t("organization:Is enabled"),
        dataIndex: "isEnabled",
        key: "isEnabled",
        width: "120px",
        render: (text, record, index) => {
          return (
            <Switch checked={text} onChange={checked => {
              this.updateField(table, index, "isEnabled", checked);
            }} />
          );
        },
      },
      {
        title: i18next.t("general:Server name"),
        dataIndex: "serverName",
        key: "serverName",
        width: "200px",
        sorter: (a, b) => a.serverName.localeCompare(b.serverName),
        render: (text, record, index) => {
          return (
            <Input value={text} readOnly={true} />
          );
        },
      },
      {
        title: i18next.t("general:Tools"),
        dataIndex: "tools",
        key: "tools",
        width: "800px",
        render: (text, record, index) => {
          const formattedTools = JSON.stringify(JSON.parse(record.tools), null, 2);
          return (
            <div style={{height: "300px"}}>
              <CodeMirror
                value={formattedTools}
                options={{
                  mode: "application/json",
                  theme: "material-darker",
                  readOnly: true,
                  lineNumbers: true,
                }}
                onBeforeChange={(editor, data, value) => {
                }}
              />
            </div>
          );
        },
      },
    ];

    return (
      <Table scroll={{x: "max-content"}} rowKey="serverName" columns={columns} dataSource={table} size="middle" bordered pagination={false}
        title={() => (
          <div>
            {this.props.title}
          </div>
        )}
      />
    );
  }

  render() {
    return (
      <div>
        <Row style={{marginTop: "20px"}}>
          <Col span={24}>
            {
              this.renderTable(this.props.table)
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default McpToolsTable;

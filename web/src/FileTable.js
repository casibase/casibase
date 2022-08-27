import React from "react";
import {Table} from 'antd';
import * as Setting from "./Setting";
import i18next from "i18next";

class FileTable extends React.Component {
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
    if (key === "data") {
      value = Setting.trim(value, ",");
      return value.split(",").map(i => Setting.myParseInt(i));
    }

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
    let row = {no: table.length, name: `New Vector - ${table.length}`, data: []};
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
        title: i18next.t("vectorset:File name"),
        dataIndex: 'title',
        key: 'title',
        width: '200px',
        sorter: (a, b) => a.title.localeCompare(b.title),
        render: (text, record, index) => {
          return text;
        }
      },
      {
        title: i18next.t("vectorset:File size"),
        dataIndex: 'size',
        key: 'size',
        width: '80px',
        sorter: (a, b) => a.size - b.size,
        render: (text, record, index) => {
          return Setting.getFriendlyFileSize(text);
        }
      },
      {
        title: i18next.t("store:Modified time"),
        dataIndex: 'modifiedTime',
        key: 'modifiedTime',
        width: '150px',
        sorter: (a, b) => a.modifiedTime.localeCompare(b.modifiedTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        }
      },
      {
        title: i18next.t("store:File type"),
        dataIndex: 'fileType',
        key: 'fileType',
        width: '80px',
        sorter: (a, b) => Setting.getExtFromPath(a.title).localeCompare(Setting.getExtFromPath(b.title)),
        render: (text, record, index) => {
          return record.title.split('.')[1];
        }
      },
      {
        title: i18next.t("store:Path"),
        dataIndex: 'key',
        key: 'key',
        width: '100px',
        sorter: (a, b) => a.key.localeCompare(b.key),
      },
      {
        title: i18next.t("store:Is leaf"),
        dataIndex: 'isLeaf',
        key: 'isLeaf',
        width: '90px',
        sorter: (a, b) => a.isLeaf - b.isLeaf,
        render: (text, record, index) => {
          return text ? i18next.t("store:True") :
            i18next.t("store:False");
        }
      },
    ];

    return (
      <Table rowKey="title" columns={columns} dataSource={table} size="middle" bordered pagination={false} />
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.props.file.children)
        }
      </div>
    )
  }
}

export default FileTable;

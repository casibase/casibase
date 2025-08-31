// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import {Button, Input, Select, Switch, Table} from "antd";
import i18next from "i18next";
import React from "react";

class TemplateOptionTable extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.mode === "edit") {
      if (!this.props.templateOptions) {
        this.props.onUpdateTemplateOptions([]);
      }
    } else {
      if (!this.props.options) {
        this.props.onUpdateOptions(this.props.templateOptions.map(option => ({
          parameter: option.parameter,
          setting: option.default,
        })));
      }
    }
  }

  updateTemplateOptions(index, field, value) {
    const newOptions = this.props.templateOptions.map((option, i) => {
      if (i === index) {
        return {
          ...option,
          [field]: value,
        };
      }
      return option;
    });
    this.props.onUpdateTemplateOptions(newOptions);
  }

  updateOptions(index, field, value) {
    if (this.props.options === undefined) {
      return;
    }
    const newOptions = this.props.options;
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };

    this.props.onUpdateOptions(newOptions);
  }

  render() {
    const editOptionsColumn = [
      {
        title: i18next.t("general:Parameter"),
        dataIndex: "parameter",
        key: "parameter",
        width: "200px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateTemplateOptions(index, "parameter", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "200px",
        render: (text, record, index) => (
          <Select
            defaultValue="string"
            value={text}
            style={{width: 120}}
            options={[
              {value: "string", label: "string"},
            ]}
            onChange={value => this.updateTemplateOptions(index, "type", value)}
          />
        ),
      },
      {
        title: i18next.t("general:Required"),
        dataIndex: "required",
        key: "required",
        width: "100px",
        render: (text, record, index) => (
          <Switch checked={text} onChange={checked => this.updateTemplateOptions(index, "required", checked)} />
        ),
      },
      {
        title: i18next.t("general:Default"),
        dataIndex: "default",
        key: "default",
        width: "200px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateTemplateOptions(index, "default", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Description"),
        dataIndex: "description",
        key: "description",
        width: "300px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateTemplateOptions(index, "description", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        render: (text, record, index) => (
          <Button type="primary" size="small" onClick={() => {
            const inputs = [...this.props.templateOptions];
            inputs.splice(index, 1);
            this.props.onUpdateTemplateOptions(inputs);
          }}>{i18next.t("general:Delete")}</Button>
        ),
      },
    ];

    const optionsColumn = [
      {
        title: i18next.t("general:Parameter"),
        dataIndex: "parameter",
        key: "parameter",
        width: "200px",
        render: (text, record, index) => (
          <span>
            {text}
            {record.required && <span style={{color: "red"}}>*</span>}
          </span>
        ),
      },
      {
        title: i18next.t("general:Setting"),
        dataIndex: "setting",
        key: "setting",
        render: (text, record, index) => {
          if (this.props.options?.[index]) {
            if (record.type === "option") {
              return (
                <Select
                  style={{width: "100%"}}
                  value={this.props.options[index].setting}
                  onChange={value => {this.updateOptions(index, "setting", value);}}
                  options={record.options.map(option => ({
                    value: option,
                    label: option,
                  }))}
                />
              );
            } else {
              return (
                <Input value={this.props.options[index].setting} onChange={e => {
                  this.updateOptions(index, "setting", e.target.value);
                }} />
              );
            }
          } else if (this.props.options) {
            this.updateOptions(index, "parameter", record.parameter);
            this.updateOptions(index, "setting", "");
          }
        },
      },
      {
        title: i18next.t("general:Description"),
        dataIndex: "description",
        key: "description",
        render: (text, record, index) => (
          <span>{text}</span>
        ),
      },
    ];

    return (
      <div style={{
        flexDirection: "row",
      }}>
        <Table rowKey="index" size="middle" bordered
          columns={this.props.mode === "edit" ? editOptionsColumn : optionsColumn}
          dataSource={this.props.templateOptions}
          pagination={false}
          title={() => (
            <div>
              {i18next.t("template:Basic config options")}&nbsp;&nbsp;&nbsp;&nbsp;
              {this.props.mode === "edit" &&
                <Button style={{marginRight: "5px"}} type="primary" size="small"
                  onClick={() => {
                    const newOption = {
                      parameter: "",
                      type: "string",
                      required: false,
                      default: "",
                      description: "",
                    };
                    this.props.onUpdateTemplateOptions([...this.props.templateOptions, newOption]);
                  }}>{i18next.t("general:Add")}
                </Button>
              }
            </div>
          )}
        />
      </div>
    );
  }
}

export default TemplateOptionTable;

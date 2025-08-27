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

class TemplateInputTable extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (!this.props.inputs) {
      this.props.onUpdateInputs([]);
    }
    if (this.props.mode === "edit" && !this.props.values) {
      this.props.onUpdateValues(this.props.inputs.map(input => ({
        name: input.name,
        value: input.value,
        description: input.description,
      })));
    }
  }

  updateInputs(index, field, value) {
    const newInputs = this.props.inputs.map((input, i) => {
      if (i === index) {
        return {
          ...input,
          [field]: value,
        };
      }
      return input;
    });
    this.props.onUpdateInputs(newInputs);
  }

  updateValues(index, field, value) {
    const newValues = this.props.values?.map((v, i) => {
      if (i === index) {
        return {
          ...v,
          [field]: value,
        };
      }
      return v;
    });
    this.props.onUpdateValues(newValues);
  }

  render() {
    const inputsColumn = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "200px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateInputs(index, "name", e.target.value)} />
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
            onChange={value => this.updateInputs(index, "type", value)}
          />
        ),
      },
      {
        title: i18next.t("general:Required"),
        dataIndex: "required",
        key: "required",
        width: "100px",
        render: (text, record, index) => (
          <Switch checked={text} onChange={checked => this.updateInputs(index, "required", checked)} />
        ),
      },
      {
        title: i18next.t("general:Default"),
        dataIndex: "default",
        key: "default",
        width: "200px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateInputs(index, "default", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Description"),
        dataIndex: "description",
        key: "description",
        width: "300px",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updateInputs(index, "description", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        render: (text, record, index) => (
          <Button type="primary" size="small" onClick={() => {
            const inputs = [...this.props.inputs];
            inputs.splice(index, 1);
            this.props.onUpdateInputs(inputs);
          }}>{i18next.t("general:Delete")}</Button>
        ),
      },
    ];

    const editColumn = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "200px",
        render: (text, record, index) => (
          <span>
            {text}
            {record.required && <span style={{color: "red"}}>*</span>}
          </span>
        ),
      },
      {
        title: i18next.t("general:Value"),
        dataIndex: "value",
        key: "value",
        render: (text, record, index) => (
          <Input value={text} onChange={e => {
            this.updateValues(index, "value", e.target.value);
          }
          } />
        ),
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
          columns={this.props.mode === "edit" ? editColumn : inputsColumn}
          dataSource={this.props.mode === "edit" ? this.props.values : this.props.inputs}
          pagination={false}
          title={() => (
            <div>
              {i18next.t("template:Template inputs")}&nbsp;&nbsp;&nbsp;&nbsp;
              {this.props.mode !== "edit" &&
                <Button style={{marginRight: "5px"}} type="primary" size="small"
                  onClick={() => {
                    const newInput = {
                      title: "DefaultInput",
                      text: "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems.",
                    };
                    this.props.onUpdateInputs([...this.props.inputs, newInput]);
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

export default TemplateInputTable;

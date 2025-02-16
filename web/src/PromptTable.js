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

import {Button, Input, Table} from "antd";
import i18next from "i18next";
import React from "react";

class PromptTable extends React.Component {
  constructor(props) {
    super(props);
  }

  updatePrompts(index, field, value) {
    const newPrompts = this.props.prompts.map((prompt, i) => {
      if (i === index) {
        return {
          ...prompt,
          [field]: value,
        };
      }
      return prompt;
    });
    this.props.onUpdatePrompts(newPrompts);
  }

  render() {
    if (!this.props.prompts) {
      this.props.onUpdatePrompts([]);
    }

    const promptsColumn = [
      {
        title: i18next.t("general:Title"),
        dataIndex: "title",
        key: "title",
        width: "30%",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updatePrompts(index, "title", e.target.value)} />
        ),
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        width: "30%",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updatePrompts(index, "text", e.target.value)} />
        ),
      },
      {
        title: i18next.t("store:Icon"),
        dataIndex: "image",
        key: "image",
        width: "30%",
        render: (text, record, index) => (
          <Input value={text} onChange={e => this.updatePrompts(index, "image", e.target.value)}
            placeholder="provide special the icon for this prompt, input url" />
        ),
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        render: (text, record, index) => (
          <Button type="primary" size="small" onClick={() => {
            const prompts = [...this.props.prompts];
            prompts.splice(index, 1);
            this.props.onUpdatePrompts(prompts);
          }}>{i18next.t("general:Delete")}</Button>
        ),
      },
    ];

    return (
      <div style={{
        marginTop: "20px",
      }}>
        <div style={{
          flexDirection: "row",
        }}>
          <Table rowKey="index" columns={promptsColumn} dataSource={this.props.prompts} size="middle" bordered
            pagination={false}
            title={() => (
              <div>
                {i18next.t("store:Prompts")}&nbsp;&nbsp;&nbsp;&nbsp;
                <Button style={{marginRight: "5px"}} type="primary" size="small"
                  onClick={() => {
                    const newPrompt = {
                      title: "DefaultPrompt",
                      text: "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems.",
                    };
                    this.props.onUpdatePrompts([...this.props.prompts, newPrompt]);
                  }}>{i18next.t("general:Add")}</Button>
              </div>
            )}
          />
        </div>
      </div>
    );
  }
}

export default PromptTable;

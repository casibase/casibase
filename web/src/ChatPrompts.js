// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import {Button} from "antd";
import i18next from "i18next";

class ChatPrompts extends React.Component {
  constructor(props) {
    super(props);
    this.prompts = [];
    this.state = {
      prompts: [],
    };
  }

  componentDidMount() {
    this.getPrompts();
  }

  selectPrompts = () => {
    if (this.prompts.length <= 8) {
      if (this.state.prompts.length === 0) {
        this.setState({
          prompts: this.prompts,
        });
      }
    } else if (this.prompts.length > 8) {
      this.setState({
        prompts: this.prompts.sort(() => 0.5 - Math.random()).slice(0, 8),
      });
    }
  };

  getPrompts() {
    StoreBackend.getStore("admin", "_casibase_default_store_")
      .then((res) => {
        if (res.status === "ok") {
          if (typeof res.data2 === "string" && res.data2 !== "") {
            res.data.error = res.data2;
          }
          this.prompts = res.data?.prompts ?? [];
          this.selectPrompts();
        } else {
          Setting.showMessage("error", `Failed to get store: ${res.msg}`);
        }
      });
  }
  render = () => {
    const groupedPrompts = [];
    for (let i = 0; i < this.state.prompts.length; i += 4) {
      groupedPrompts.push(this.state.prompts.slice(i, i + 4));
    }

    return (
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "100",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {
          groupedPrompts.map((group, index) => (
            <div key={index} style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
            }}>
              {
                group.map((prompt, index) => (
                  <div key={index} style={{
                    fontSize: "16px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    width: "150px",
                    height: "120px",
                    borderRadius: "10px",
                    textAlign: "start",
                    overflow: "hidden",
                    marginRight: "10px",
                    marginLeft: "10px",
                    cursor: "pointer",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    maxLines: "2",
                  }} onClick={() => {
                    this.props.sendMessage(prompt.text, "");
                  }}>
                    {prompt.title}
                  </div>
                ))
              }
            </div>
          ))
        }
        {
          this.prompts.length <= 8 ? null : (
            <div style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
              height: "40px",
              width: "100%",
            }}>
              <Button type="primary" onClick={this.selectPrompts}>{i18next.t("general:Refresh")}</Button>
            </div>
          )
        }
      </div>
    );
  };
}

export default ChatPrompts;

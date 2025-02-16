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

import React from "react";
import ImageWithFallback from "./ChatPromptsIcon";
import * as Setting from "./Setting";
import {Button} from "antd";
import i18next from "i18next";

class ChatPrompts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      prompts: [],
    };
  }

  componentDidMount() {
    this.selectPrompts();
  }
  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state.prompts !== nextState.prompts ||
      JSON.stringify(this.props.prompts) !== JSON.stringify(nextProps.prompts)
    );
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps.prompts) !== JSON.stringify(this.props.prompts)) {
      this.selectPrompts();
    }
  }

  selectPrompts = () => {
    const limit = Setting.isMobile() ? 4 : 8;
    if (this.props.prompts.length <= limit) {
      this.setState({
        prompts: this.props.prompts,
      });
    } else if (this.props.prompts.length > limit) {
      this.setState({
        prompts: this.props.prompts.sort(() => 0.5 - Math.random()).slice(0, limit),
      });
    }
  };

  render = () => {
    const groupedPrompts = [];
    for (let i = 0; i < this.state.prompts.length; i += 4) {
      groupedPrompts.push(this.state.prompts.slice(i, i + 4));
    }
    const limit = Setting.isMobile() ? 4 : 8;
    const direction = Setting.isMobile() ? "column" : "row";
    const fontSize = Setting.isMobile() ? "12px" : "16px";

    return (
      <div style={{
        position: "absolute",
        zIndex: "100",
        height: "80%",
        width: "80%",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {
          groupedPrompts.map((group, index) => (
            <div key={index} style={{
              display: "flex",
              flexDirection: direction,
              justifyContent: "center",
              alignItems: "center",
              margin: "10px",
            }}>
              {
                group.map((prompt, index) => (
                  <div key={index} style={{
                    padding: "10px",
                    position: "relative",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    width: "150px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    margin: "10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }} onClick={() => {
                    this.props.sendMessage(prompt.text, "");
                  }}
                  onMouseEnter={
                    (e) => {
                      e.currentTarget.style.backgroundColor = "#fafafa";
                      e.currentTarget.style.transition = "background-color 0.2s";
                    }
                  }
                  onMouseLeave={
                    (e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.transition = "background-color 0.2s";
                    }
                  }
                  >
                    <div style={{
                      top: "10px",
                      left: "10px",
                    }}>
                      <ImageWithFallback src={prompt.image} />
                    </div>
                    <p
                      style={{
                        marginTop: "10px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        fontSize: fontSize,
                        lineHeight: "1.5em",
                        height: "3em",
                      }}>{prompt.title}</p>
                  </div>
                ))
              }
            </div>
          ))
        }
        {
          this.props.prompts.length <= limit ? null : (
            <div style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
              height: "40px",
              width: "100%",
            }}>
              <Button type="primary" onClick={this.selectPrompts}>{i18next.t("store:Refresh")}</Button>
            </div>
          )
        }
      </div>
    );
  };
}

export default ChatPrompts;

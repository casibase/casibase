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
import {Button} from "antd";
import {ThemeDefault} from "../Conf";
import * as Setting from "../Setting";
import {updateMessage} from "../backend/MessageBackend";

const MessageSuggestions = ({message, sendMessage}) => {
  if (message.author !== "AI" || !message.suggestions || !Array.isArray(message.suggestions)) {
    return null;
  }

  const fontSize = Setting.isMobile() ? "10px" : "12px";

  const containerStyle = {
    position: "absolute",
    left: "48px",
    top: "calc(100% + 10px)",
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "start",
    alignItems: "center",
    zIndex: "10",
    maxWidth: "80%",
    gap: "8px",
    padding: "8px 0",
  };

  const buttonStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    border: "1px solid " + ThemeDefault.colorPrimary,
    color: ThemeDefault.colorPrimary,
    borderRadius: "4px",
    fontSize: fontSize,
    margin: "3px",
    padding: "8px 16px",
    textAlign: "start",
    whiteSpace: "pre-wrap",
    height: "28px",
    transition: "all 0.3s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  return (
    <div style={containerStyle}>
      {message.suggestions.map((suggestion, index) => {
        let suggestionText = suggestion.text;
        if (suggestionText.trim() === "") {
          return null;
        }

        suggestionText = Setting.formatSuggestion(suggestionText);

        return (
          <Button
            className="suggestions-item"
            key={index}
            type="primary"
            style={buttonStyle}
            onClick={() => {
              sendMessage(suggestionText, "");
              message.suggestions[index].isHit = true;
              updateMessage(message.owner, message.name, message, true);
            }}
          >
            {suggestionText}
          </Button>
        );
      })}
    </div>
  );
};

export default MessageSuggestions;

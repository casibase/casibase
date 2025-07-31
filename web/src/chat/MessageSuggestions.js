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
import * as Setting from "../Setting";
import {updateMessage} from "../backend/MessageBackend";

const MessageSuggestions = ({message, sendMessage}) => {
  if (message.author !== "AI" || !message.suggestions || !Array.isArray(message.suggestions)) {
    return null;
  }

  return (
    <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
      {message.suggestions.map((suggestion, index) => {
        let suggestionText = suggestion.text;
        if (suggestionText.trim() === "") {
          return null;
        }

        suggestionText = Setting.formatSuggestion(suggestionText);

        return (
          <Button
            key={index}
            color="primary"
            variant="filled"
            style={{
              height: "auto",
              padding: "8px 16px",
            }}
            onClick={() => {
              sendMessage(suggestionText, "");
              message.suggestions[index].isHit = true;
              updateMessage(message.owner, message.name, message, true);
            }}
          >
            <div style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              textAlign: "left",
              lineHeight: "1.5",
            }}>
              {suggestionText}
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default MessageSuggestions;

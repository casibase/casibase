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

import React, {useEffect, useState} from "react";
import {Bubble} from "@ant-design/x";
import {Alert, Button} from "antd";
import moment from "moment";
import * as Setting from "../Setting";
import i18next from "i18next";
import {ThemeDefault} from "../Conf";
import {renderText} from "../ChatMessageRender";
import MessageActions from "./MessageActions";
import MessageSuggestions from "./MessageSuggestions";
import {getUserAvatar} from "../Setting";

const MessageItem = ({
  message,
  index,
  isLastMessage,
  account,
  avatar,
  onCopy,
  onRegenerate,
  onLike,
  onToggleRead,
  disableInput,
  isReading,
  readingMessage,
  sendMessage,
}) => {
  const [rerenderErrorMessage, setRerenderErrorMessage] = useState(false);

  useEffect(() => {
    if (message.errorText !== "") {
      setTimeout(() => {
        setRerenderErrorMessage(true);
      }, 10);
    }
  }, [message.errorText]);

  const renderMessageContent = () => {
    if (message.errorText !== "") {
      // Use simple text to ensure the content is displayed immediately
      message.text = "Error occurred";

      if (rerenderErrorMessage) {
        return (
          <Alert
            message={Setting.getRefinedErrorText(message.errorText)}
            description={message.errorText}
            type="error"
            showIcon
            action={
              <Button danger type="primary" onClick={onRegenerate}>
                {i18next.t("general:Regenerate Answer")}
              </Button>
            }
          />
        );
      } else {
        return <div>Loading error message...</div>;
      }
    }

    if (message.text === "" && message.author === "AI" && !message.reasonText) {
      return null;
    }

    if (message.isReasoningPhase && message.author === "AI") {
      return null;
    }

    if (!message.isReasoningPhase && message.reasonText && message.author === "AI") {
      return (
        <div className="message-content">
          <div className="message-reason" style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "5px",
            borderLeft: "3px solid #1890ff",
          }}>
            <div className="reason-label" style={{
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#1890ff",
            }}>
              {i18next.t("chat:Reasoning process")}:
            </div>
            <div className="reason-content">
              {renderText(message.reasonText)}
            </div>
          </div>

          <div className="message-answer">
            {message.html || renderText(message.text)}
          </div>
        </div>
      );
    }

    if (isLastMessage && message.author === "AI" && message.TokenCount === 0) {
      return renderText(Setting.parseAnswerAndSuggestions(message.text)["answer"]);
    }

    return message.html;
  };

  const renderReasoningBubble = () => {
    if (message.isReasoningPhase && message.author === "AI" && message.reasonText) {
      return (
        <div style={{marginBottom: "8px"}}>
          <Bubble
            placement="start"
            content={
              <div className="message-reason" style={{
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                borderLeft: "3px solid #1890ff",
              }}>
                <div className="reason-label" style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#1890ff",
                }}>
                  {i18next.t("chat:Reasoning process")}:
                </div>
                <div className="reason-content">
                  {renderText(message.reasonText)}
                </div>
              </div>
            }
            typing={{
              step: 2,
              interval: 50,
            }}
            avatar={{
              src: message.author === "AI" ? avatar : account.avatar,
            }}
            styles={{
              content: {
                backgroundColor: ThemeDefault.colorBackground,
                borderRadius: "16px",
                padding: "12px 16px",
              },
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      maxWidth: "90%",
      margin: message.author === "AI" ? "0 auto 0 0" : "0 0 0 auto",
    }}>
      <div style={{
        textAlign: message.author === "AI" ? "left" : "right",
        color: "#999",
        fontSize: "12px",
        marginBottom: "8px",
        padding: "0 12px",
      }}>
        {moment(message.createdTime).format("YYYY/M/D HH:mm:ss")}
      </div>

      {renderReasoningBubble()}

      {(!message.isReasoningPhase || message.author !== "AI") && (
        <Bubble
          placement={message.author === "AI" ? "start" : "end"}
          content={renderMessageContent()}
          loading={message.text === "" && message.author === "AI" && !message.reasonText}
          typing={message.author === "AI" && !message.isReasoningPhase ? {
            step: 2,
            interval: 50,
          } : undefined}
          avatar={{
            src: message.author === "AI" ? avatar : getUserAvatar(message, account),
          }}
          styles={{
            content: {
              backgroundColor: message.author === "AI" ? ThemeDefault.colorBackground : undefined,
              borderRadius: "16px",
              padding: "12px 16px",
            },
          }}
        />
      )}

      {message.author === "AI" && (disableInput === false || index !== isLastMessage) && (
        <MessageActions
          message={message}
          isLastMessage={isLastMessage}
          index={index}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          onLike={onLike}
          onToggleRead={onToggleRead}
          isReading={isReading}
          readingMessage={readingMessage}
          account={account}
        />
      )}

      {message.author === "AI" && isLastMessage && (
        <MessageSuggestions message={message} sendMessage={sendMessage} />
      )}
    </div>
  );
};

export default MessageItem;

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
import {Alert, Button, Col, Row} from "antd";
import moment from "moment";
import * as Setting from "../Setting";
import i18next from "i18next";
import {AvatarErrorUrl, ThemeDefault} from "../Conf";
import {renderText} from "../ChatMessageRender";
import MessageActions from "./MessageActions";
import MessageSuggestions from "./MessageSuggestions";
import MessageEdit from "./MessageEdit";
import {MessageCarrier} from "./MessageCarrier";

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
  onEditMessage,
  disableInput,
  isReading,
  isLoadingTTS, // Added new prop for TTS loading state
  readingMessage,
  sendMessage,
}) => {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const {isEditing,
    setIsHovering,
    renderEditForm,
    renderEditButton,
    handleMouseEnter,
    handleMouseLeave,
  } = MessageEdit({
    message,
    isLastMessage,
    disableInput,
    index,
    onEditMessage,
  });

  useEffect(() => {
    // Set the initial avatar source
    setAvatarSrc(message.author === "AI" ? avatar : Setting.getUserAvatar(message, account));
  }, [message.author, avatar, account, message]);

  const handleAvatarError = () => {
    // Set fallback URL when avatar fails to load
    setAvatarSrc(AvatarErrorUrl);
  };

  const renderMessageContent = () => {
    if (isEditing && message.author !== "AI") {
      return renderEditForm();
    }

    if (message.errorText !== "") {
      const regenerateButton = (
        <Button
          danger
          type="primary"
          onClick={() => {
            setIsRegenerating(true);
            onRegenerate(index);
          }}
          disabled={isRegenerating}
        >
          {isRegenerating
            ? i18next.t("general:Regenerating...")
            : i18next.t("general:Regenerate Answer")}
        </Button>
      );
      return Setting.isMobile() ? (
        <div>
          <Alert
            message={Setting.getRefinedErrorText(message.errorText)}
            description={message.errorText}
            type="error"
            showIcon
            style={{whiteSpace: "normal", wordWrap: "break-word"}}
          />
          <Row justify="center" style={{marginTop: 16}}>
            <Col>{regenerateButton}</Col>
          </Row>
        </div>
      ) : (
        <Alert
          message={Setting.getRefinedErrorText(message.errorText)}
          description={message.errorText}
          type="error"
          showIcon
          action={regenerateButton}
        />
      );
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
      const mssageCarrier = new MessageCarrier(false); // we only use final answer blow so no need to parse title
      return renderText(mssageCarrier.parseAnswerWithCarriers(message.text).finalAnswer);
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
              src: avatarSrc,
              onError: handleAvatarError,
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

  const renderMessageBubble = () => {
    if (message.isReasoningPhase && message.author === "AI") {
      return null;
    }

    const isUserMessage = message.author !== "AI";

    return (
      <div style={{
        display: "flex",
        justifyContent: isUserMessage ? "flex-end" : "flex-start",
        alignItems: "center",
        position: "relative",
      }}>
        {isUserMessage && renderEditButton()}

        <Bubble
          placement={isUserMessage ? "end" : "start"}
          content={
            <div style={{position: "relative", width: "100%"}}>
              {renderMessageContent()}
            </div>
          }
          loading={message.text === "" && message.author === "AI" && !message.reasonText && !message.errorText}
          typing={message.author === "AI" && !message.isReasoningPhase ? {
            step: 2,
            interval: 50,
          } : undefined}
          avatar={{
            src: avatarSrc,
            onError: handleAvatarError,
          }}
          styles={{
            content: {
              backgroundColor: message.author === "AI" ? ThemeDefault.colorBackground : undefined,
              borderRadius: "16px",
              padding: "12px 16px",
              minWidth: isEditing ? "300px" : "auto",
            },
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: "90%",
        margin: message.author === "AI" ? "0 auto 0 0" : "0 0 0 auto",
        position: "relative",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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

      {renderMessageBubble()}

      {!isEditing && message.author === "AI" && (disableInput === false || index !== isLastMessage) && (
        <MessageActions
          message={message}
          isLastMessage={isLastMessage}
          index={index}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          onLike={onLike}
          onToggleRead={onToggleRead}
          onEdit={() => setIsHovering(true)}
          isReading={isReading}
          isLoadingTTS={isLoadingTTS} // Pass loading state to MessageActions
          readingMessage={readingMessage}
          account={account}
          setIsRegenerating={setIsRegenerating}
          isRegenerating={isRegenerating}
        />
      )}

      {message.author === "AI" && isLastMessage && (
        <MessageSuggestions message={message} sendMessage={sendMessage} />
      )}
    </div>
  );
};

export default MessageItem;

import React, {useEffect, useState} from "react";
import {Bubble} from "@ant-design/x";
import {Alert, Button, Input, Space} from "antd";
import moment from "moment";
import * as Setting from "../Setting";
import i18next from "i18next";
import {AvatarErrorUrl, ThemeDefault} from "../Conf";
import {renderText} from "../ChatMessageRender";
import MessageActions from "./MessageActions";
import MessageSuggestions from "./MessageSuggestions";
import {CheckOutlined, CloseOutlined, EditOutlined} from "@ant-design/icons";

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
  readingMessage,
  sendMessage,
}) => {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setAvatarSrc(message.author === "AI" ? avatar : Setting.getUserAvatar(message, account));
  }, [message.author, avatar, account, message]);

  const handleEditActions = {
    start: () => {
      setIsEditing(true);
      setEditedText(message.text);
    },
    save: () => {
      onEditMessage({...message, text: editedText, updatedTime: new Date().toISOString()});
      setIsEditing(false);
    },
    cancel: () => {
      setIsEditing(false);
      setEditedText("");
    },
    keyDown: (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEditActions.save();
      }
    },
  };

  const handleAvatarError = () => setAvatarSrc(AvatarErrorUrl);

  const renderEditForm = () => (
    <div style={{width: "100%"}}>
      <Input.TextArea
        value={editedText}
        onChange={e => setEditedText(e.target.value)}
        onKeyDown={handleEditActions.keyDown}
        autoSize={{minRows: 1, maxRows: 6}}
        style={{marginBottom: "8px"}}
        autoFocus
      />
      <Space style={{display: "flex", justifyContent: "flex-end"}}>
        <Button
          icon={<CloseOutlined />}
          onClick={handleEditActions.cancel}
          size="small"
        >
          {i18next.t("general:Cancel")}
        </Button>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleEditActions.save}
          size="small"
        >
          {i18next.t("general:Save")}
        </Button>
      </Space>
    </div>
  );

  const renderMessageContent = () => {
    if (isEditing && message.author !== "AI") {
      return renderEditForm();
    }

    if (message.errorText !== "") {
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

    return message.html || renderText(message.text);
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

  const renderEditButton = () => {
    if (message.author !== "AI" && !isEditing && (disableInput === false || index !== isLastMessage)) {
      return (
        <div style={{
          marginRight: "8px",
          opacity: isHovering ? 0.8 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}>
          <Button
            className="cs-button"
            icon={<EditOutlined />}
            style={{
              border: "none",
              color: ThemeDefault.colorPrimary,
              background: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={handleEditActions.start}
            size="small"
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div style={{
        textAlign: message.author === "AI" ? "left" : "right",
        color: "#999",
        fontSize: "12px",
        marginBottom: "8px",
        padding: "0 12px",
      }}>
        {moment(message.createdTime).format("YYYY/M/D HH:mm:ss")}
        {message.updatedTime && message.updatedTime !== message.createdTime &&
              ` (${i18next.t("general:Edited")})`}
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
          onEdit={handleEditActions.start}
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

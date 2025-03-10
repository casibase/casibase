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
import {Button, Space} from "antd";
import {ThemeDefault} from "../Conf";
import {
  CopyOutlined,
  DislikeFilled,
  DislikeOutlined,
  EditOutlined,
  LikeFilled,
  LikeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const MessageActions = ({
  message,
  isLastMessage,
  index,
  onCopy,
  onRegenerate,
  onLike,
  onToggleRead,
  onEdit,
  isReading,
  readingMessage,
  account,
}) => {
  const actionStyle = {
    marginTop: "8px",
    opacity: 0.8,
    display: "flex",
    justifyContent: message.author === "AI" ? "flex-start" : "flex-end",
    marginLeft: message.author === "AI" ? "48px" : "auto",
    marginRight: message.author !== "AI" ? "48px" : "auto",
  };

  if (message.author === "AI") {
    return (
      <Space size="small" style={actionStyle}>
        <Button
          className="cs-button"
          icon={<CopyOutlined />}
          style={{border: "none", color: ThemeDefault.colorPrimary}}
          onClick={() => onCopy(message.html.props.dangerouslySetInnerHTML.__html)}
        />

        {!isLastMessage ? null : (
          <Button
            className="cs-button"
            icon={<ReloadOutlined />}
            style={{border: "none", color: ThemeDefault.colorPrimary}}
            onClick={onRegenerate}
          />
        )}

        <Button
          className="cs-button"
          icon={message.likeUsers?.includes(account.name) ? <LikeFilled /> : <LikeOutlined />}
          style={{border: "none", color: ThemeDefault.colorPrimary}}
          onClick={() => onLike(message, "like")}
        />

        <Button
          className="cs-button"
          icon={message.dislikeUsers?.includes(account.name) ? <DislikeFilled /> : <DislikeOutlined />}
          style={{border: "none", color: ThemeDefault.colorPrimary}}
          onClick={() => onLike(message, "dislike")}
        />

        <Button
          className="cs-button"
          icon={(readingMessage === message.name) && isReading ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          style={{border: "none", color: ThemeDefault.colorPrimary}}
          onClick={() => onToggleRead(message)}
        />
      </Space>
    );
  } else {
    return (
      <Space size="small" style={actionStyle}>
        <Button
          className="cs-button"
          icon={<EditOutlined />}
          style={{border: "none", color: ThemeDefault.colorPrimary}}
          onClick={() => onEdit(message)}
        />
      </Space>
    );
  }
};

export default MessageActions;

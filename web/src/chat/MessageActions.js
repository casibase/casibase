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
import {Button, Space, Tooltip} from "antd";
import {ThemeDefault} from "../Conf";
import {
  CopyOutlined,
  DislikeFilled,
  DislikeOutlined,
  LikeFilled,
  LikeOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import i18next from "i18next";

const MessageActions = ({
  message,
  isLastMessage,
  index,
  onCopy,
  onRegenerate,
  onLike,
  onToggleRead,
  isReading,
  isLoadingTTS,
  readingMessage,
  account,
  setIsRegenerating,
  isRegenerating,
}) => {
  const isCurrentMessageBeingRead = readingMessage === message.name;
  const isCurrentMessageBeingLoaded = isLoadingTTS && isCurrentMessageBeingRead;

  const getTtsIcon = () => {
    if (isCurrentMessageBeingLoaded) {
      return <LoadingOutlined />;
    }
    if (isCurrentMessageBeingRead && isReading) {
      return <PauseCircleOutlined />;
    }
    return <PlayCircleOutlined />;
  };

  // Get appropriate tooltip text for TTS button
  const getTtsTooltip = () => {
    if (isCurrentMessageBeingLoaded) {
      return i18next.t("general:Loading...");
    }
    if (isCurrentMessageBeingRead && isReading) {
      return i18next.t("general:Pause");
    }
    if (isCurrentMessageBeingRead && !isReading) {
      return i18next.t("general:Resume");
    }
    return i18next.t("chat:Read it out");
  };

  return (
    <Space
      size="small"
      style={{
        marginTop: "8px",
        marginLeft: "48px",
        opacity: 0.8,
      }}
    >
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
          onClick={() => {
            setIsRegenerating(true);
            onRegenerate(index);
          }}
          disabled={isRegenerating}
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

      <Tooltip title={getTtsTooltip()}>
        <Button
          className="cs-button"
          icon={getTtsIcon()}
          style={{
            border: "none",
            color: isCurrentMessageBeingLoaded ? "#1890ff" : ThemeDefault.colorPrimary,
          }}
          onClick={() => onToggleRead(message)}
          disabled={isCurrentMessageBeingLoaded}
        />
      </Tooltip>
    </Space>
  );
};

export default MessageActions;

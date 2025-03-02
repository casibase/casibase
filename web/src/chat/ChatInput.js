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
import {Sender} from "@ant-design/x";
import {LinkOutlined} from "@ant-design/icons";
import i18next from "i18next";

const ChatInput = ({
  value,
  onChange,
  onSend,
  onFileUpload,
  loading,
  disableInput,
  onCancelMessage,
  onVoiceInputStart,
  onVoiceInputEnd,
}) => {
  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: "16px 24px",
      zIndex: 1,
    }}>
      <div style={{
        maxWidth: "700px",
        margin: "0 auto",
      }}>
        <Sender
          prefix={
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={onFileUpload}
            />
          }
          loading={loading}
          disabled={disableInput}
          style={{
            flex: 1,
            borderRadius: "8px",
            background: "#f5f5f5",
          }}
          sendDisabled={value === "" || disableInput}
          placeholder={i18next.t("chat:Type message here")}
          value={value}
          onChange={onChange}
          onSubmit={() => {
            onSend(value);
            onChange("");
          }}
          onCancel={() => {
            onCancelMessage && onCancelMessage();
          }}
          allowSpeech
          onSpeechStart={onVoiceInputStart}
          onSpeechEnd={onVoiceInputEnd}
        />
      </div>
    </div>
  );
};

export default ChatInput;

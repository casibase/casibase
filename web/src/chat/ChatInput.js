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
import {Button, Image} from "antd";
import {Sender} from "@ant-design/x";
import {CloseCircleOutlined, FileTextOutlined, LinkOutlined} from "@ant-design/icons";
import i18next from "i18next";

const ChatInput = ({
  value,
  store,
  files,
  onChange,
  onSend,
  onFileUpload,
  loading,
  disableInput,
  messageError,
  onCancelMessage,
  onVoiceInputStart,
  onVoiceInputEnd,
  onRemoveFile,
}) => {
  const sendButtonDisabled = messageError || (value === "" && files.length === 0) || disableInput;

  const renderFilePreview = (uploadedFile) => {
    const isImage = uploadedFile.file.type.startsWith("image/");
    if (isImage) {
      return (
        <Image
          src={uploadedFile.content}
          width={50}
          height={50}
          style={{objectFit: "cover", borderRadius: 4}}
        />
      );
    } else {
      return (
        <div
          style={{
            width: 50,
            height: 50, // 多给一点高度，能显示名字
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            boxSizing: "border-box",
          }}
        >
          <FileTextOutlined style={{fontSize: 30, color: "#000", justifyContent: "center"}} />
          <div
            style={{
              fontSize: 10,
              textAlign: "center",
              wordBreak: "break-word",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={uploadedFile.file.name}
          >
            {uploadedFile.file.name.replace(/\s+/g, "")}
          </div>
        </div>
      );
    }
  };

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
        {files.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 2,
              paddingTop: 8,
              overflowX: "auto",
            }}
          >
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.uid}
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                {renderFilePreview(uploadedFile)}
                <CloseCircleOutlined
                  onClick={() => onRemoveFile(uploadedFile.uid)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    color: "red",
                    fontSize: 16,
                    cursor: "pointer",
                    background: "#fff",
                    borderRadius: "50%",
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <Sender
          prefix={
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={onFileUpload}
              disabled={disableInput || messageError || store?.disableFileUpload}
              style={{
                color: (disableInput || messageError) ? "#d9d9d9" : undefined,
              }}
            />
          }
          loading={loading}
          disabled={disableInput}
          style={{
            flex: 1,
            borderRadius: "8px",
            background: "#f5f5f5",
          }}
          placeholder={messageError ? "" : i18next.t("chat:Type message here")}
          // if we have some files uploaded but no text was input (value === ""), Sender wont invoke onSubmit.
          value={(files.length > 0 && value === "") ? " " + value : value}
          onChange={onChange}
          onSubmit={() => {
            if (!sendButtonDisabled) {
              onSend(value);
              onChange("");
            }
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

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
import ChatFileInput from "./ChatFileInput";
import UploadFileArea from "./UploadFileArea";
import i18next from "i18next";

const ChatInput = ({
  value,
  store,
  files,
  onFileChange,
  onChange,
  onSend,
  loading,
  disableInput,
  messageError,
  onCancelMessage,
  onVoiceInputStart,
  onVoiceInputEnd,
  isVoiceInput,
}) => {

  const sendButtonDisabled = messageError || (value === "" && files.length === 0) || disableInput;

  async function handleInputChange(file) {
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;
          const inputMaxWidth = 70;
          const chatMaxWidth = 600;
          let Ratio = 1;
          if (originalWidth > inputMaxWidth) {
            Ratio = inputMaxWidth / originalWidth;
          }
          if (originalWidth > chatMaxWidth) {
            Ratio = chatMaxWidth / originalWidth;
          }
          const chatScaledWidth = Math.round(originalWidth * Ratio);
          const chatScaledHeight = Math.round(originalHeight * Ratio);
          const value = `<img src="${img.src}" alt="${img.alt}" width="${chatScaledWidth}" height="${chatScaledHeight}">`;
          updateFileList(file, img.src, value);
        };
        img.src = e.target.result;
      };
    } else {
      reader.onload = (e) => {
        const content = `<a href="${e.target.result}" target="_blank">${file.name}</a>`;
        const value = e.target.result;
        updateFileList(file, content, value);
      };
    }
    reader.readAsDataURL(file);
  }

  function handleFileUploadClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*, .txt, .md, .yaml, .csv, .docx, .pdf, .xlsx";
    input.multiple = false;
    input.style.display = "none";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleInputChange(file);
      }
    };
    input.click();
  }

  function updateFileList(file, content, value) {
    const uploadedFile = {
      uid: Date.now() + Math.random(),
      file: file,
      content: content,
      value: value,
    };
    onFileChange(
      [...files, uploadedFile]
    );
  }

  // const isSpeechDisabled = store?.speechToTextProvider === "";
  const isSpeechDisabled = false;

  return (
    <div style={{position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px", zIndex: 1}}>
      <UploadFileArea onFileChange={handleInputChange} />
      <div style={{maxWidth: "700px", margin: "0 auto"}}>
        {files.length > 0 && (
          <div style={{marginBottom: "12px", marginLeft: "12px", marginRight: "12px"}}>
            <ChatFileInput
              files={files}
              onFileChange={onFileChange}
            />
          </div>
        )}
        <Sender
          prefix={
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={handleFileUploadClick}
              disabled={disableInput || messageError || store?.disableFileUpload}
              style={{
                color: (disableInput || messageError) ? "#d9d9d9" : undefined,
              }}
            />
          }
          loading={loading}
          disabled={disableInput}
          style={{flex: 1, borderRadius: "8px", background: "#f5f5f5"}}
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
          // Only provide allowSpeech if speech is not disabled
          {...(!isSpeechDisabled ? {
            allowSpeech: {
              recording: isVoiceInput,
              onRecordingChange: (nextRecording) => {
                if (nextRecording) {
                  onVoiceInputStart();
                } else {
                  onVoiceInputEnd();
                }
              },
            },
          } : {})}
        />
      </div>
    </div>
  );
};

export default ChatInput;

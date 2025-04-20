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
import {Image} from "antd";
import {CloseCircleOutlined, FileTextOutlined} from "@ant-design/icons";

const ChatFileInput = ({
  files,
  onFileChange,
}) => {

  function handleRemoveFile(uid) {
    onFileChange(
      files.filter(file => file.uid !== uid)
    );
  }

  function renderFilePreview(uploadedFile) {
    const isImage = uploadedFile.file.type.startsWith("image/");
    if (isImage) {
      return (
        <Image
          src={uploadedFile.content} width={50} height={50} style={{objectFit: "cover", borderRadius: 4}}
        />
      );
    } else {
      return (
        <div
          style={{width: 50, height: 50, borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 4, boxSizing: "border-box"}}
        >
          <FileTextOutlined style={{fontSize: 30, color: "#000", justifyContent: "center"}} />
          <div
            style={{fontSize: 10, textAlign: "center", wordBreak: "break-word", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%"}}
            title={uploadedFile.file.name}
          >
            {uploadedFile.file.name.replace(/\s+/g, "")}
          </div>
        </div>
      );
    }
  }

  return (
    <div
      style={{display: "flex", gap: 10, marginBottom: 2, paddingTop: 8, overflowX: "auto"}}
    >
      {files.map((uploadedFile) => (
        <div
          key={uploadedFile.uid}
          style={{position: "relative", display: "inline-block"}}
        >
          {renderFilePreview(uploadedFile)}
          <CloseCircleOutlined
            onClick={() => handleRemoveFile(uploadedFile.uid)}
            style={{position: "absolute", top: -6, right: -6, color: "red", fontSize: 16, cursor: "pointer", background: "#fff", borderRadius: "50%"}}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatFileInput;

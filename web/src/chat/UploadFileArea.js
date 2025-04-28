// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import {useRef, useState} from "react";
import i18next from "i18next";

const UploadFileArea = ({
  onFileChange,
}) => {
  const uploadAreaRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  return (
    <div
      ref={uploadAreaRef}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!uploadAreaRef.current.contains(e.relatedTarget)) {
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        droppedFiles.forEach(f => {
          onFileChange(f);
        });
      }}
      style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, padding: "16px 24px", backgroundColor: dragging ? "#e6f4ff" : "transparent", transition: "background-color 0.2s"}}
    >
      {
        dragging && (
          <div
            style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "24px", fontWeight: "bold", borderRadius: "8px", zIndex: 2}}
          >
            {i18next.t("chat:Drop files here to upload")}
          </div>
        )
      }
    </div>
  );
};

export default UploadFileArea;

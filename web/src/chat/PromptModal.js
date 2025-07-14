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

import React, {useEffect, useState} from "react";
import {Modal} from "antd";
import i18next from "i18next";

const PromptModal = ({
  visible,
  initialValue,
  onSave,
  onCancel,
  loading = false,
  disabled = false,
}) => {
  const [editingPrompt, setEditingPrompt] = useState(initialValue || "");

  useEffect(() => {
    setEditingPrompt(initialValue || "");
  }, [initialValue]);

  const handleSave = () => {
    onSave(editingPrompt);
  };

  const handleCancel = () => {

    setEditingPrompt(initialValue || "");
    onCancel();
  };

  return (
    <Modal
      title={i18next.t("chat:Custom Prompt")}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSave}
      okText={i18next.t("general:Save")}
      cancelText={i18next.t("general:Cancel")}
      width={520}
      confirmLoading={loading}
      bodyStyle={{
        padding: "20px 24px",
      }}
    >
      <textarea
        value={editingPrompt}
        onChange={(e) => setEditingPrompt(e.target.value)}
        placeholder={i18next.t("chat:Set a custom prompt for this conversation")}
        style={{
          width: "100%",
          minHeight: "120px",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #d9d9d9",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
          color: "rgba(0, 0, 0, 0.85)",
          resize: "vertical",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.3s",
          outline: "none",
          boxSizing: "border-box",
        }}
        disabled={disabled || loading}
        rows={6}
      />
    </Modal>
  );
};

export default PromptModal;

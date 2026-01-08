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
import {Alert, Popover, Typography} from "antd";
import CodeMirror from "@uiw/react-codemirror";
import {json} from "@codemirror/lang-json";
import {githubDark} from "@uiw/codemirror-theme-github";
import * as Setting from "../Setting";

/**
 * JsonCodeMirrorEditor - A CodeMirror editor component for JSON editing
 * @param {string} value - The JSON string to display/edit
 * @param {function} onChange - Callback function when value changes (editor, data, value)
 * @param {boolean} readOnly - Whether the editor is read-only (default: false)
 * @param {boolean} editable - Whether the editor is editable (default: true)
 * @param {string} height - Height of the editor (default: "300px")
 * @param {boolean} lineNumbers - Show line numbers (default: false for editable, true for readonly)
 */
export function JsonCodeMirrorEditor({value, onChange, readOnly = false, editable = true, height = "300px", lineNumbers = null}) {
  return (
    <div style={{height: height}}>
      <CodeMirror
        value={value || ""}
        height={height}
        theme={githubDark}
        extensions={[json()]}
        editable={editable && !readOnly}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: lineNumbers !== null ? lineNumbers : readOnly,
        }}
        onChange={(newValue) => {
          if (onChange && !readOnly) {
            onChange(null, null, newValue);
          }
        }}
      />
    </div>
  );
}

/**
 * JsonCodeMirrorPopover - A popover component that displays JSON in a CodeMirror editor
 * @param {string} text - The JSON string to display
 * @param {string} displayText - The preview text to show in the trigger element
 * @param {string} placement - Popover placement (default: "right")
 * @param {number} maxDisplayLength - Maximum length for display text (default: 30)
 * @param {string} width - Width of the popover (default: "600px")
 * @param {string} height - Height of the popover (default: "400px")
 */
export function JsonCodeMirrorPopover({text, displayText, placement = "right", maxDisplayLength = 30, width = "600px", height = "400px"}) {
  if (!text || text === "{}") {
    return <span>-</span>;
  }

  let formattedText;
  let isValidJson = false;
  let errorMessage;

  try {
    // Try to parse and format JSON
    const parsedJson = JSON.parse(text);
    formattedText = JSON.stringify(parsedJson, null, 2);
    isValidJson = true;
  } catch (error) {
    // If parsing fails, use original text
    formattedText = text;
    isValidJson = false;
    errorMessage = error.message;
  }

  // Generate preview text if not provided
  let previewText = displayText;
  if (!previewText) {
    try {
      const props = JSON.parse(text || "{}");
      const keys = Object.keys(props);
      if (keys.length === 0) {
        return <span>-</span>;
      }
      previewText = keys.slice(0, 3).map(key => `${key}: ${props[key]}`).join(", ");
    } catch (e) {
      previewText = text;
    }
  }

  return (
    <Popover
      placement={placement}
      content={
        <div style={{width: width, height: height, display: "flex", flexDirection: "column", gap: "12px"}}>
          {!isValidJson && (
            <Alert type="error" showIcon message={
              <Typography.Paragraph ellipsis={{expandable: "collapsible"}} style={{margin: 0}}>{errorMessage}</Typography.Paragraph>}
            />)}
          <CodeMirror
            value={formattedText}
            height={height}
            theme={githubDark}
            extensions={isValidJson ? [json()] : []}
            editable={false}
            readOnly={true}
            basicSetup={{
              lineNumbers: true,
            }}
          />
        </div>
      }
      trigger="hover"
    >
      <div style={{maxWidth: "200px", cursor: "pointer"}}>
        {Setting.getShortText(previewText, maxDisplayLength)}
      </div>
    </Popover>
  );
}

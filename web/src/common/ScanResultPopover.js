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
import {Popover, Tabs} from "antd";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import i18next from "i18next";
import * as Setting from "../Setting";
import NmapResultRenderer from "../renderers/NmapResultRenderer";
import OsPatchResultRenderer from "../renderers/OsPatchResultRenderer";

require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

const {TabPane} = Tabs;

/**
 * ScanResultPopover - A popover component that displays scan results with tabs
 * @param {string} result - The scan result (JSON string)
 * @param {string} providerType - The provider type (Nmap, OS Patch, etc.)
 * @param {string} placement - Popover placement (default: "right")
 * @param {number} maxDisplayLength - Maximum length for display text (default: 30)
 * @param {string} width - Width of the popover (default: "800px")
 * @param {string} height - Height of the popover (default: "600px")
 */
export function ScanResultPopover({result, providerType = "Nmap", placement = "right", maxDisplayLength = 30, width = "800px", height = "600px"}) {
  if (!result) {
    return <span>-</span>;
  }

  // Determine if result is JSON
  let isJson = false;
  try {
    JSON.parse(result);
    isJson = true;
  } catch (e) {
    isJson = false;
  }

  // Generate preview text
  let previewText = result;
  if (isJson) {
    try {
      const parsed = JSON.parse(result);
      // Create a short summary for preview
      if (parsed.summary) {
        previewText = parsed.summary;
      } else if (parsed.hosts && Array.isArray(parsed.hosts)) {
        previewText = `${parsed.hosts.length} host(s) scanned`;
      } else if (Array.isArray(parsed)) {
        previewText = `${parsed.length} item(s)`;
      } else {
        previewText = "View scan result";
      }
    } catch (e) {
      previewText = "View scan result";
    }
  }

  const renderContent = () => {
    if (!isJson) {
      // Plain text result
      return (
        <div style={{width: width, height: height, overflow: "auto"}}>
          <CodeMirror
            value={result}
            options={{
              mode: "text/plain",
              theme: "material-darker",
              readOnly: true,
              lineNumbers: true,
            }}
            editorDidMount={(editor) => {
              editor.setSize(null, height);
            }}
          />
        </div>
      );
    }

    // JSON result with tabs
    return (
      <div style={{width: width, height: height, overflow: "auto"}}>
        <Tabs defaultActiveKey="structured" type="card">
          <TabPane tab={i18next.t("scan:Structured View")} key="structured">
            <div style={{padding: "16px", backgroundColor: "#f5f5f5", minHeight: "500px", maxHeight: height, overflow: "auto"}}>
              {providerType === "Nmap" && <NmapResultRenderer result={result} />}
              {providerType === "OS Patch" && <OsPatchResultRenderer result={result} />}
              {providerType !== "Nmap" && providerType !== "OS Patch" && (
                <div>Structured view not available for {providerType}</div>
              )}
            </div>
          </TabPane>
          <TabPane tab={i18next.t("scan:Raw JSON")} key="raw">
            <CodeMirror
              value={JSON.stringify(JSON.parse(result), null, 2)}
              options={{
                mode: "application/json",
                theme: "material-darker",
                readOnly: true,
                lineNumbers: true,
              }}
              editorDidMount={(editor) => {
                editor.setSize(null, height);
              }}
            />
          </TabPane>
        </Tabs>
      </div>
    );
  };

  return (
    <Popover
      placement={placement}
      content={renderContent()}
      trigger="click"
      overlayStyle={{maxWidth: "90vw"}}
    >
      <div style={{maxWidth: "200px", cursor: "pointer", color: "#1890ff"}}>
        {Setting.getShortText(previewText, maxDisplayLength)}
      </div>
    </Popover>
  );
}

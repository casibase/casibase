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
import NmapResultRenderer from "../renderers/NmapResultRenderer";
import OsPatchResultRenderer from "../renderers/OsPatchResultRenderer";
import * as Setting from "../Setting";
import i18next from "i18next";

require("codemirror/theme/material-darker.css");

const {TabPane} = Tabs;

/**
 * ScanResultRenderer - Renders scan result with Structured View and Raw JSON tabs
 * This is extracted from TestScanWidget.renderScanResult() to be reusable
 */
export function ScanResultRenderer({scanResult, providerType, height = "300px"}) {
  if (!scanResult) {
    return (
      <CodeMirror
        value=""
        options={{
          mode: "text/plain",
          theme: "material-darker",
          readOnly: true,
          lineNumbers: true,
        }}
        editorDidMount={(editor) => {
          editor.setSize(null, "auto");
          const lineHeight = editor.defaultTextHeight();
          const minHeight = lineHeight * 10;
          editor.getWrapperElement().style.minHeight = `${minHeight}px`;
        }}
      />
    );
  }

  // Determine if result is JSON and parse it once
  let isJson = false;
  let parsedResult = null;
  try {
    parsedResult = JSON.parse(scanResult);
    isJson = true;
  } catch (e) {
    isJson = false;
  }

  // If not JSON, just show as plain text
  if (!isJson) {
    return (
      <CodeMirror
        value={scanResult}
        options={{
          mode: "text/plain",
          theme: "material-darker",
          readOnly: true,
          lineNumbers: true,
        }}
        editorDidMount={(editor) => {
          editor.setSize(null, "auto");
          const lineHeight = editor.defaultTextHeight();
          const minHeight = lineHeight * 10;
          editor.getWrapperElement().style.minHeight = `${minHeight}px`;
        }}
      />
    );
  }

  // Render with tabs for structured and raw views
  return (
    <Tabs defaultActiveKey="structured" type="card">
      <TabPane tab={i18next.t("scan:Structured View")} key="structured">
        <div style={{padding: "16px", backgroundColor: "#f5f5f5", minHeight: height}}>
          {providerType === "Nmap" && <NmapResultRenderer result={scanResult} />}
          {providerType === "OS Patch" && <OsPatchResultRenderer result={scanResult} />}
        </div>
      </TabPane>
      <TabPane tab={i18next.t("scan:Raw JSON")} key="raw">
        <CodeMirror
          value={JSON.stringify(parsedResult, null, 2)}
          options={{
            mode: "application/json",
            theme: "material-darker",
            readOnly: true,
            lineNumbers: true,
          }}
          editorDidMount={(editor) => {
            editor.setSize(null, "auto");
            const lineHeight = editor.defaultTextHeight();
            const minHeight = lineHeight * 10;
            editor.getWrapperElement().style.minHeight = `${minHeight}px`;
          }}
        />
      </TabPane>
    </Tabs>
  );
}

/**
 * ScanResultPopover - A popover component that displays scan results with structured and raw views
 * Similar to JsonCodeMirrorPopover but specifically for scan results
 */
export function ScanResultPopover({
  scanResult,
  providerType = "Nmap",
  placement = "left",
  maxDisplayLength = 30,
  width = "800px",
  height = "500px",
}) {
  if (!scanResult || scanResult === "") {
    return <span>-</span>;
  }

  // Generate preview text
  let previewText = scanResult;
  try {
    const parsed = JSON.parse(scanResult);
    // For Nmap results, show number of hosts
    if (parsed.nmaprun && parsed.nmaprun.host) {
      const hosts = Array.isArray(parsed.nmaprun.host) ? parsed.nmaprun.host : [parsed.nmaprun.host];
      previewText = `${hosts.length} host(s)`;
    } else if (parsed.patches) {
      // For OS Patch results, show number of patches
      previewText = `${parsed.patches.length} patch(es)`;
    } else {
      previewText = "View result";
    }
  } catch (e) {
    // Not JSON or parsing failed, use truncated text
    previewText = scanResult;
  }

  return (
    <Popover
      placement={placement}
      content={
        <div style={{width: width, height: height, display: "flex", flexDirection: "column"}}>
          <ScanResultRenderer
            scanResult={scanResult}
            providerType={providerType}
            height={height}
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

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
import {Tabs} from "antd";
import CodeMirror from "@uiw/react-codemirror";
import {json} from "@codemirror/lang-json";
import {githubDark} from "@uiw/codemirror-theme-github";
import i18next from "i18next";
import NmapResultRenderer from "../renderers/NmapResultRenderer";
import OsPatchResultRenderer from "../renderers/OsPatchResultRenderer";
import NucleiResultRenderer from "../renderers/NucleiResultRenderer";
import ZapResultRenderer from "../renderers/ZapResultRenderer";
import SubfinderResultRenderer from "../renderers/SubfinderResultRenderer";
import HttpxResultRenderer from "../renderers/HttpxResultRenderer";

const {TabPane} = Tabs;

// Helper function to get minimum height in pixels
const getMinHeightPixels = (minHeight) => {
  if (typeof minHeight === "string" && minHeight.endsWith("px")) {
    return minHeight;
  }
  return "300px";
};

/**
 * ScanResultRenderer - A reusable component to render scan results
 * @param {string} scanResult - The scan result to display (JSON)
 * @param {string} scanRawResult - The raw scan result to display (plain text)
 * @param {string} providerType - The type of provider (e.g., "Nmap", "OS Patch")
 * @param {object} provider - The provider object (optional, for OS Patch)
 * @param {object} scan - The scan object (optional, for OS Patch)
 * @param {function} onRefresh - Callback for refresh action (optional, for OS Patch)
 * @param {string} minHeight - Minimum height for the editor (default: "300px")
 */
export function ScanResultRenderer({scanResult, scanRawResult, providerType, provider, scan, onRefresh, minHeight = "300px"}) {
  // If neither result is available, show empty editor
  if (!scanResult && !scanRawResult) {
    return (
      <CodeMirror
        value=""
        height={getMinHeightPixels(minHeight)}
        theme={githubDark}
        editable={false}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
        }}
      />
    );
  }

  // If only raw result is available, show it as plain text
  if (!scanResult && scanRawResult) {
    return (
      <CodeMirror
        value={scanRawResult}
        height={getMinHeightPixels(minHeight)}
        theme={githubDark}
        editable={false}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
        }}
      />
    );
  }

  // Determine if result is JSON
  let isJson = false;
  try {
    JSON.parse(scanResult);
    isJson = true;
  } catch (e) {
    isJson = false;
  }

  // If not JSON, just show as plain text
  if (!isJson) {
    return (
      <CodeMirror
        value={scanResult}
        height={getMinHeightPixels(minHeight)}
        theme={githubDark}
        editable={false}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
        }}
      />
    );
  }

  // Render with tabs for structured, raw JSON, and raw text views
  return (
    <Tabs defaultActiveKey="structured" type="card">
      <TabPane tab={i18next.t("scan:Structured View")} key="structured">
        <div style={{padding: "16px", backgroundColor: "#f5f5f5", minHeight: minHeight}}>
          {providerType === "Nmap" && <NmapResultRenderer result={scanResult} />}
          {providerType === "OS Patch" && (
            <OsPatchResultRenderer
              result={scanResult}
              provider={provider}
              scan={scan}
              onRefresh={onRefresh}
            />
          )}
          {providerType === "Nuclei" && <NucleiResultRenderer result={scanResult} />}
          {providerType === "ZAP" && <ZapResultRenderer result={scanResult} />}
          {providerType === "Subfinder" && <SubfinderResultRenderer result={scanResult} />}
          {providerType === "httpx" && <HttpxResultRenderer result={scanResult} />}
        </div>
      </TabPane>
      <TabPane tab={i18next.t("scan:Raw JSON")} key="raw">
        <CodeMirror
          value={JSON.stringify(JSON.parse(scanResult), null, 2)}
          height={getMinHeightPixels(minHeight)}
          theme={githubDark}
          extensions={[json()]}
          editable={false}
          readOnly={true}
          basicSetup={{
            lineNumbers: true,
          }}
        />
      </TabPane>
      <TabPane tab={i18next.t("scan:Raw Text")} key="rawText">
        <CodeMirror
          value={scanRawResult || ""}
          height={getMinHeightPixels(minHeight)}
          theme={githubDark}
          editable={false}
          readOnly={true}
          basicSetup={{
            lineNumbers: true,
          }}
        />
      </TabPane>
    </Tabs>
  );
}

export default ScanResultRenderer;

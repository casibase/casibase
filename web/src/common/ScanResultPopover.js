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
import {Popover} from "antd";
import * as Setting from "../Setting";
import {ScanResultRenderer} from "./ScanResultRenderer";

/**
 * ScanResultPopover - A popover component that displays scan results
 * @param {string} result - The scan result to display
 * @param {string} providerType - The type of provider (e.g., "Nmap", "OS Patch")
 * @param {string} placement - Popover placement (default: "left")
 * @param {number} maxDisplayLength - Maximum length for display text (default: 30)
 * @param {string} width - Width of the popover (default: "700px")
 * @param {string} height - Height of the popover (default: "500px")
 * @param {React.ReactNode} children - Optional custom content to display instead of default preview
 */
export function ScanResultPopover({
  result,
  providerType = "Nmap",
  placement = "left",
  maxDisplayLength = 30,
  width = "700px",
  height = "500px",
  children,
}) {
  if (!result) {
    return <span>-</span>;
  }

  // Generate preview text if children not provided
  let previewText = result;
  if (!children) {
    try {
      const resultObj = JSON.parse(result);
      // Try to create a meaningful preview
      if (resultObj.summary) {
        previewText = resultObj.summary;
      } else if (resultObj.hosts && Array.isArray(resultObj.hosts)) {
        previewText = `${resultObj.hosts.length} host(s) scanned`;
      } else {
        // Get first few keys
        const keys = Object.keys(resultObj);
        if (keys.length > 0) {
          previewText = keys.slice(0, 3).join(", ");
        }
      }
    } catch (e) {
      // Use raw text as preview if not JSON
      previewText = result;
    }
  }

  return (
    <Popover
      placement={placement}
      content={
        <div style={{width: width, height: height, overflow: "auto"}}>
          <ScanResultRenderer
            scanResult={result}
            providerType={providerType}
            minHeight="400px"
          />
        </div>
      }
      trigger="hover"
    >
      {children || (
        <div style={{maxWidth: "200px", cursor: "pointer"}}>
          {Setting.getShortText(previewText, maxDisplayLength)}
        </div>
      )}
    </Popover>
  );
}

export default ScanResultPopover;

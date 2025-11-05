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
import {Link} from "react-router-dom";
import {Popover, Tag} from "antd";
import i18next from "i18next";
import * as Setting from "../Setting";
import {ScanResultRenderer} from "./ScanResultRenderer";

const DEFAULT_PROVIDER_TYPE = "Nmap";

const SCAN_STATE_COLORS = {
  "Completed": "success",
  "Failed": "error",
};

/**
 * ScanDetailPopover - A popover component that displays scan details with metadata
 * @param {object} scan - The scan object containing all scan information
 * @param {string} placement - Popover placement (default: "left")
 * @param {string} width - Width of the popover (default: "800px")
 * @param {string} height - Max height of the popover (default: "600px")
 * @returns {React.Element|null} A popover component with scan details or null if no scan provided
 * @example
 * <ScanDetailPopover scan={scanObject} placement="left" />
 */
export function ScanDetailPopover({
  scan,
  placement = "left",
  width = "800px",
  height = "600px",
}) {
  if (!scan) {
    return null;
  }

  const tagColor = SCAN_STATE_COLORS[scan.state] || "processing";

  const popoverContent = (
    <div style={{width: width, maxHeight: height, overflow: "auto"}}>
      <div style={{marginBottom: "12px"}}>
        <div style={{fontSize: "16px", fontWeight: "bold", marginBottom: "8px"}}>
          {scan.displayName || scan.name}
        </div>
        <div style={{fontSize: "12px", color: "#666"}}>
          <div><strong>{i18next.t("general:Name")}:</strong> {scan.name}</div>
          <div><strong>{i18next.t("general:Created time")}:</strong> {Setting.getFormattedDate(scan.createdTime)}</div>
          <div><strong>{i18next.t("scan:Provider")}:</strong> {scan.provider || "-"}</div>
          <div><strong>{i18next.t("general:State")}:</strong> {scan.state}</div>
        </div>
      </div>
      {scan.result && (
        <div>
          <div style={{fontSize: "14px", fontWeight: "bold", marginBottom: "8px"}}>
            {i18next.t("scan:Result")}:
          </div>
          <ScanResultRenderer
            scanResult={scan.result}
            providerType={scan.providerType || DEFAULT_PROVIDER_TYPE}
            minHeight="200px"
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title={null}
      trigger="hover"
      placement={placement}
    >
      <Link to={`/scans/${scan.name}`}>
        <Tag color={tagColor} style={{cursor: "pointer", margin: "2px"}}>
          {scan.displayName || scan.name}
        </Tag>
      </Link>
    </Popover>
  );
}

export default ScanDetailPopover;

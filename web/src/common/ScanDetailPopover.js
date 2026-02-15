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
 * @param {object} provider - The provider object containing provider information (optional)
 * @param {string} placement - Popover placement (default: "left")
 * @param {string} width - Width of the popover (default: "800px")
 * @param {string} height - Max height of the popover (default: "600px")
 * @returns {React.Element|null} A popover component with scan details or null if no scan provided
 * @example
 * <ScanDetailPopover scan={scanObject} provider={providerObject} placement="left" />
 */
export function ScanDetailPopover({
  scan,
  provider = null,
  placement = "left",
  width = "800px",
  height = "600px",
}) {
  if (!scan) {
    return null;
  }

  const tagColor = SCAN_STATE_COLORS[scan.state] || "processing";

  // Get provider type and logo from provider object
  let providerLogo = null;
  let providerType = scan.providerType || DEFAULT_PROVIDER_TYPE;
  if (provider) {
    providerType = provider.type || DEFAULT_PROVIDER_TYPE;
    const otherProviderInfo = Setting.getOtherProviderInfo();
    if (otherProviderInfo[provider.category] && otherProviderInfo[provider.category][provider.type]) {
      providerLogo = otherProviderInfo[provider.category][provider.type].logo;
    }
  }

  const popoverContent = (
    <div style={{width: width, maxHeight: height, overflow: "auto"}}>
      <div style={{marginBottom: "12px"}}>
        <div style={{fontSize: "16px", fontWeight: "bold", marginBottom: "8px"}}>
          {scan.displayName || scan.name}
        </div>
        <div style={{fontSize: "12px", color: "#666"}}>
          <div><strong>{i18next.t("general:Name")}:</strong> {scan.name}</div>
          <div><strong>{i18next.t("general:Created time")}:</strong> {Setting.getFormattedDate(scan.createdTime)}</div>
          <div><strong>{i18next.t("general:Provider")}:</strong> {scan.provider || "-"}</div>
          <div><strong>{i18next.t("general:State")}:</strong> {scan.state}</div>
        </div>
      </div>
      {scan.result && (
        <div>
          <div style={{fontSize: "14px", fontWeight: "bold", marginBottom: "8px"}}>
            {i18next.t("general:Result")}:
          </div>
          <ScanResultRenderer
            scanResult={scan.result}
            providerType={providerType}
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
          <div style={{display: "flex", alignItems: "center", gap: "4px"}}>
            {providerLogo && (
              <img src={providerLogo} alt="provider" style={{width: "16px", height: "16px"}} />
            )}
            <span>{scan.resultSummary || scan.displayName || scan.name}</span>
          </div>
        </Tag>
      </Link>
    </Popover>
  );
}

export default ScanDetailPopover;

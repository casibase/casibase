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
import {Drawer, Spin} from "antd";
import i18next from "i18next";
import * as Setting from "../Setting";
import * as VectorBackend from "../backend/VectorBackend";

const KnowledgeSourceItem = ({vectorScore, vectorData, idx, themeColor}) => {
  if (!vectorData) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #e8e8e8",
        transition: "all 0.2s",
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "20px",
          height: "20px",
          background: themeColor,
          color: "#fff",
          borderRadius: "50%",
          fontSize: "12px",
          fontWeight: "bold",
        }}>
          {idx + 1}
        </span>
        <span style={{
          color: themeColor,
          fontSize: "12px",
          fontWeight: "500",
        }}>
          {vectorData.file || "Knowledge Fragment"}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: "11px",
          color: "#999",
        }}>
          {i18next.t("chat:Score")}: {(vectorScore.score * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{
        fontSize: "13px",
        color: "#666",
        lineHeight: "1.5",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: "200px",
        overflow: "auto",
      }}>
        {vectorData.text}
      </div>
      {vectorData.displayName && (
        <div style={{
          fontSize: "11px",
          color: "#999",
          marginTop: "6px",
        }}>
          {i18next.t("chat:Source")}: {vectorData.displayName}
        </div>
      )}
    </div>
  );
};

const KnowledgeSourcesDrawer = ({visible, onClose, vectorScores, account}) => {
  const [loading, setLoading] = useState(false);
  const [vectorsData, setVectorsData] = useState({});
  const themeColor = Setting.getThemeColor();

  useEffect(() => {
    if (visible && vectorScores && vectorScores.length > 0) {
      loadVectorsData();
    }
  }, [visible, vectorScores]);

  const loadVectorsData = async() => {
    setLoading(true);
    const newVectorsData = {};

    try {
      for (const vectorScore of vectorScores) {
        const parts = vectorScore.vector.split("/");
        if (parts.length >= 2) {
          const owner = parts[0];
          const name = parts.slice(1).join("/");
          const result = await VectorBackend.getVector(owner, name);
          if (result.status === "ok" && result.data) {
            newVectorsData[vectorScore.vector] = result.data;
          }
        }
      }
      setVectorsData(newVectorsData);
    } catch (error) {
      // Failed to load vectors data
      Setting.showMessage("error", "Failed to load vectors data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={i18next.t("chat:Knowledge Base Sources")}
      placement="right"
      width={400}
      onClose={onClose}
      open={visible}
      styles={{
        body: {padding: "16px"},
      }}
    >
      {loading ? (
        <div style={{textAlign: "center", padding: "20px"}}>
          <Spin />
        </div>
      ) : (
        vectorScores?.length > 0 && (
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {vectorScores.map((vectorScore, idx) => (
              <KnowledgeSourceItem
                key={idx}
                vectorScore={vectorScore}
                vectorData={vectorsData[vectorScore.vector]}
                idx={idx}
                themeColor={themeColor}
              />
            ))}
          </div>
        )
      )}
    </Drawer>
  );
};

export default KnowledgeSourcesDrawer;

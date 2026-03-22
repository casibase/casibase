// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import React, {useRef, useState} from "react";
import {Button, Table} from "antd";
import {DownloadOutlined} from "@ant-design/icons";
import i18next from "i18next";
import TaskAnalysisRadarChart from "./TaskAnalysisRadarChart";
import TaskAnalysisBarChart from "./TaskAnalysisBarChart";
import TaskAnalysisPieChart from "./TaskAnalysisPieChart";
import {downloadTaskAnalysisReportDocx} from "./taskReportDocx";
import * as Setting from "./Setting";

export default function TaskAnalysisReport({result, downloadFileName}) {
  const radarRef = useRef(null);
  const barRef = useRef(null);
  const pieRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  if (!result) {
    return null;
  }
  const metaItems = [
    {label: i18next.t("task:Unit Name"), value: result.title},
    {label: i18next.t("task:Designer"), value: result.designer},
    {label: i18next.t("video:Stage"), value: result.stage},
    {label: i18next.t("task:Participants"), value: result.participants},
    {label: i18next.t("video:Grade"), value: result.grade},
    {label: i18next.t("task:Instructor"), value: result.instructor},
    {label: i18next.t("store:Subject"), value: result.subject},
    {label: i18next.t("video:School"), value: result.school},
    {label: i18next.t("task:Other Subjects"), value: result.otherSubjects},
    {label: i18next.t("task:Textbook"), value: result.textbook},
  ];

  const reportColumns = [
    {title: i18next.t("task:Sub-criteria"), dataIndex: "name", key: "name", width: "12%"},
    {title: i18next.t("task:Score"), dataIndex: "score", key: "score", width: "8%", render: (score) => `${score}${i18next.t("task:Score Unit")}`},
    {title: i18next.t("task:Advantages"), dataIndex: "advantage", key: "advantage", width: "27%"},
    {title: i18next.t("task:Disadvantages"), dataIndex: "disadvantage", key: "disadvantage", width: "27%"},
    {title: i18next.t("task:Suggestion"), dataIndex: "suggestion", key: "suggestion", width: "26%"},
  ];

  const categories = result.categories || [];
  const radarMax = (() => {
    if (categories.length === 0) {
      return 5;
    }
    const maxScore = Math.max(...categories.map((c) => Number(c.score) || 0));
    if (maxScore <= 5) {
      return 5;
    }
    if (maxScore <= 10) {
      return 10;
    }
    return Math.ceil(maxScore * 1.2);
  })();

  const hasCharts = categories.length > 0;

  const getChartDataUrl = (ref) => {
    const comp = ref?.current;
    if (!comp || typeof comp.getEchartsInstance !== "function") {
      return null;
    }
    const inst = comp.getEchartsInstance();
    if (!inst) {
      return null;
    }
    const opts = {type: "png", pixelRatio: 2, backgroundColor: "#fff"};
    try {
      return inst.getDataURL(opts);
    } catch {
      return null;
    }
  };

  const handleDownloadReport = async() => {
    setDownloading(true);
    try {
      const chartImages = {};
      const r = getChartDataUrl(radarRef);
      if (r) {
        chartImages.radar = r;
      }
      const b = getChartDataUrl(barRef);
      if (b) {
        chartImages.bar = b;
      }
      const p = getChartDataUrl(pieRef);
      if (p) {
        chartImages.pie = p;
      }
      await downloadTaskAnalysisReportDocx(result, {
        fileName: downloadFileName || "task_report.docx",
        chartImages,
      });
      Setting.showMessage("success", i18next.t("general:Successfully downloaded"));
    } catch (err) {
      Setting.showMessage("error", err?.message || String(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{marginTop: "16px"}}>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: "16px", padding: "12px", border: "1px solid #f0f0f0", borderRadius: "6px", background: "#fafafa"}}>
        {metaItems.map((item, idx) => (
          <div key={idx} style={{display: "flex", gap: "8px"}}>
            <span style={{fontWeight: 600, whiteSpace: "nowrap"}}>{item.label}：</span>
            <span>{item.value || "-"}</span>
          </div>
        ))}
      </div>
      <div style={{marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap"}}>
        <div style={{fontSize: "16px", fontWeight: 600}}>
          {i18next.t("task:Overall Score")}：<span style={{color: "#1677ff", fontSize: "20px"}}>{result.score}</span>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownloadReport}>
          {i18next.t("task:Download report")}
        </Button>
      </div>
      {hasCharts && (
        <div style={{marginBottom: "24px", height: "320px", display: "flex", gap: "24px"}}>
          <div style={{flex: 1, minWidth: 0}}>
            <TaskAnalysisRadarChart categories={categories} radarMax={radarMax} chartRef={radarRef} />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <TaskAnalysisBarChart categories={categories} chartRef={barRef} />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <TaskAnalysisPieChart categories={categories} chartRef={pieRef} />
          </div>
        </div>
      )}
      {categories.map((cat, idx) => (
        <div key={idx} style={{marginBottom: "24px"}}>
          <div style={{fontWeight: 600, marginBottom: "8px", fontSize: "14px"}}>
            {idx + 1}. {cat.name}（{i18next.t("task:Score")}：{cat.score}{i18next.t("task:Score Unit")}）
          </div>
          <Table
            size="small"
            bordered
            pagination={false}
            columns={reportColumns}
            dataSource={(cat.items || []).map((item, i) => ({...item, key: i}))}
          />
        </div>
      ))}
    </div>
  );
}

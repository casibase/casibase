// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use it except in compliance with the License.
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
import ReactEcharts from "echarts-for-react";
import i18next from "i18next";

const PIE_COLORS = ["#f5222d", "#fa8c16", "#faad14", "#52c41a", "#1677ff"];
const NUM_BANDS = 5;

function collectScores(categories) {
  const scores = [];
  (categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      const s = Number(item.score) || 0;
      scores.push(s);
    });
  });
  return scores;
}

function buildBandsFromScores(scores) {
  if (scores.length === 0) {
    return [];
  }
  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);
  const low = Math.max(0, dataMin <= 10 ? 0 : Math.floor(dataMin / 10) * 10);
  let high = Math.min(100, dataMax >= 90 ? 100 : Math.ceil((dataMax + 5) / 10) * 10);
  if (high <= low) {
    high = Math.min(100, low + 20);
  }
  const step = (high - low) / NUM_BANDS;
  const bands = [];
  for (let i = 0; i < NUM_BANDS; i++) {
    const bMin = Math.round(low + i * step);
    const bMax = i === NUM_BANDS - 1 ? high : Math.round(low + (i + 1) * step);
    if (bMax > bMin) {
      bands.push({min: bMin, max: bMax, label: `${bMin}-${bMax}`});
    }
  }
  return bands;
}

function countByScoreBand(categories) {
  const scores = collectScores(categories);
  const bands = buildBandsFromScores(scores);
  if (bands.length === 0) {
    return [];
  }
  const counts = bands.map(() => 0);
  scores.forEach((s) => {
    const idx = bands.findIndex((b, i) => (i < bands.length - 1 ? s >= b.min && s < b.max : s >= b.min && s <= b.max));
    if (idx >= 0) {
      counts[idx] += 1;
    }
  });
  return bands.map((b, i) => ({
    band: b.label,
    count: counts[i],
  })).filter((d) => d.count > 0);
}

export default function TaskAnalysisPieChart({categories, chartRef}) {
  const bandData = countByScoreBand(categories);
  if (bandData.length === 0) {
    return null;
  }
  const totalItems = bandData.reduce((sum, d) => sum + d.count, 0);
  const scoreUnit = i18next.t("task:Score Unit");
  const data = bandData.map((d, i) => ({
    name: `${d.band}${scoreUnit} (${d.count}${i18next.t("task:Item count unit")})`,
    value: d.count,
    itemStyle: {color: PIE_COLORS[i % PIE_COLORS.length]},
  }));
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: "8%",
      top: "center",
      textStyle: {fontSize: 12, color: "#000"},
    },
    title: {
      left: "center",
      top: "8%",
      textStyle: {fontSize: 13, color: "#000"},
      text: i18next.t("task:Score distribution") + ` (${totalItems})`,
    },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      center: ["40%", "55%"],
      avoidLabelOverlap: true,
      itemStyle: {borderColor: "#fff", borderWidth: 2},
      label: {fontSize: 12, color: "#000"},
      data,
    }],
  };
  return <ReactEcharts ref={chartRef} option={option} style={{width: "100%", height: "100%"}} notMerge />;
}

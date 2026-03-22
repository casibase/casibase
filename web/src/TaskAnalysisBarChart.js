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

const ITEM_NAME_MAX_LEN = 18;

function flattenItems(categories) {
  const list = [];
  (categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      list.push({
        name: item.name,
        score: Number(item.score) || 0,
        categoryName: cat.name,
      });
    });
  });
  return list.sort((a, b) => b.score - a.score);
}

function getScoreRange(categories) {
  let min = 100;
  let max = 0;
  (categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      const s = Number(item.score) || 0;
      if (s < min) {
        min = s;
      }
      if (s > max) {
        max = s;
      }
    });
  });
  if (min > max) {
    return {min: 0, max: 100};
  }
  const padding = Math.max(10, Math.ceil((max - min) * 0.1));
  const axisMin = Math.max(0, min <= 10 ? 0 : Math.floor(min / 10) * 10 - 10);
  const axisMax = Math.min(100, max >= 90 ? 100 : Math.ceil((max + padding) / 10) * 10);
  return {min: axisMin, max: Math.max(axisMax, axisMin + 10)};
}

export default function TaskAnalysisBarChart({categories, chartRef}) {
  const items = flattenItems(categories);
  if (items.length === 0) {
    return null;
  }
  const {min: xMin, max: xMax} = getScoreRange(categories);
  const yData = items.map((it) => {
    const short = it.name.length > ITEM_NAME_MAX_LEN ? it.name.slice(0, ITEM_NAME_MAX_LEN) + "…" : it.name;
    return short;
  });
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const idx = params[0].dataIndex;
        const it = items[idx];
        return `${it.categoryName}<br/>${it.name}<br/>${i18next.t("task:Score")}: ${it.score}`;
      },
    },
    grid: {left: "8%", right: "12%", top: "4%", bottom: "4%", containLabel: true},
    xAxis: {
      type: "value",
      min: xMin,
      max: xMax,
      axisLabel: {color: "#000", fontSize: 11},
      splitLine: {lineStyle: {opacity: 0.3}},
    },
    yAxis: {
      type: "category",
      data: yData.reverse(),
      axisLabel: {fontSize: 11, color: "#000"},
      axisLine: {show: true},
      axisTick: {show: false},
      inverse: true,
    },
    series: [{
      type: "bar",
      data: items.map((it) => it.score).reverse(),
      itemStyle: {
        color: "#1677ff",
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: "right",
        formatter: "{c}",
        color: "#000",
        fontSize: 11,
      },
    }],
  };
  return <ReactEcharts ref={chartRef} option={option} style={{width: "100%", height: "100%"}} notMerge />;
}

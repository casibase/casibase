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

export default function TaskAnalysisRadarChart({categories, radarMax, chartRef}) {
  if (!categories || categories.length === 0) {
    return null;
  }
  const option = {
    tooltip: {},
    radar: {
      indicator: categories.map((c) => ({name: c.name, max: radarMax})),
      radius: "65%",
      axisName: {
        fontSize: 16,
        color: "#000",
      },
    },
    series: [{
      type: "radar",
      data: [{
        value: categories.map((c) => Number(c.score) || 0),
        name: i18next.t("task:Score"),
        areaStyle: {opacity: 0.3},
      }],
    }],
  };
  return <ReactEcharts ref={chartRef} option={option} style={{width: "100%", height: "100%"}} notMerge />;
}

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
import ReactECharts from "echarts-for-react";
import * as Setting from "./Setting";
import i18next from "i18next";

class KnowledgeGraphChart extends React.Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
    this.chartInstance = null;
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data ||
        prevProps.layout !== this.props.layout ||
        prevProps.filterKeyword !== this.props.filterKeyword) {
      if (this.chartInstance) {
        this.updateChart();
      }
    }
  }

  updateChart() {
    try {
      if (!this.chartInstance) {
        return;
      }

      const option = this.getChartOption();

      if (!option || !option.series || !option.series[0]) {
        Setting.showMessage("warning", "Invalid chart option");
        return;
      }

      this.chartInstance.setOption(option, true);
    } catch (error) {
      Setting.showMessage("error", `Error updating chart: ${error}`);
    }
  }

  onChartReady = (chart) => {
    try {
      this.chartInstance = chart;

      chart.on("error", (error) => {
        Setting.showMessage("error", `ECharts error: ${error}`);
      });

      this.updateChart();
    } catch (error) {
      Setting.showMessage("error", `Error in onChartReady: ${error}`);
    }
  };

  getChartOption() {
    try {
      const {data, layout, filterKeyword} = this.props;

      if (!data || !data.nodes || !data.links) {
        Setting.showMessage("error", "Invalid data provided to chart");
        return {};
      }

      let filteredNodes = data.nodes;
      let filteredLinks = data.links;

      if (filterKeyword && filterKeyword.trim()) {
        const keyword = filterKeyword.toLowerCase().trim();
        filteredNodes = data.nodes.filter(node =>
          node && node.name && node.name.toLowerCase().includes(keyword)
        );

        const nodeIds = new Set(filteredNodes.map(node => node.id));
        filteredLinks = data.links.filter(link =>
          link && link.source && link.target &&
          nodeIds.has(link.source) && nodeIds.has(link.target)
        );
      }

      if (!filteredNodes.length) {
        return {
          series: [{
            type: "graph",
            data: [],
            links: [],
          }],
        };
      }

      const option = {
        tooltip: {
          trigger: "item",
          formatter: (params) => {
            try {
              if (params.dataType === "node") {
                return `<div style="padding: 8px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">${params.data.name || "Unknown"}</div>
                  <div style="margin-bottom: 2px;"><strong>${i18next.t("knowledge:Type")}:</strong> ${this.getNodeTypeName(params.data.category)}</div>
                  <div style="margin-bottom: 2px;"><strong>${i18next.t("knowledge:Weight")}:</strong> ${params.data.value || 0}</div>
                  <div><strong>${i18next.t("knowledge:Connections")}:</strong> ${this.getNodeConnections(params.data.id, filteredLinks)}</div>
                </div>`;
              }
              return `<div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${params.data.source || "Unknown"} → ${params.data.target || "Unknown"}</div>
                <div><strong>${i18next.t("knowledge:Connection Strength")}:</strong> ${params.data.value || 0}</div>
              </div>`;
            } catch (error) {
              Setting.showMessage("error", `Error in tooltip formatter: ${error}`);
              return "<div style=\"padding: 8px;\">Error loading tooltip</div>";
            }
          },
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#ccc",
          borderWidth: 1,
          textStyle: {
            color: "#333",
          },
        },
        legend: {
          data: [
            i18next.t("knowledge:Users"),
            i18next.t("knowledge:Topics"),
            i18next.t("knowledge:Entities"),
          ],
          top: "bottom",
          left: "center",
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            fontSize: 12,
          },
        },
        animationDuration: 1500,
        animationEasingUpdate: "quinticInOut",
        series: [{
          name: i18next.t("knowledge:Knowledge Graph"),
          type: "graph",
          layout: layout,
          data: filteredNodes,
          links: filteredLinks,
          categories: [
            {
              name: i18next.t("knowledge:Users"),
              itemStyle: {
                color: "#1890ff",
              },
            },
            {
              name: i18next.t("knowledge:Topics"),
              itemStyle: {
                color: "#52c41a",
              },
            },
            {
              name: i18next.t("knowledge:Entities"),
              itemStyle: {
                color: "#fa8c16",
              },
            },
          ],
          roam: true,
          zoom: 1.2,
          center: ["50%", "50%"],
          label: {
            show: true,
            position: "right",
            formatter: "{b}",
            fontSize: 10,
            color: "#333",
          },
          edgeLabel: {
            show: false,
          },
          lineStyle: {
            color: "#ccc",
            width: 1,
            opacity: 0.6,
            curveness: 0.1,
          },
          force: {
            repulsion: 150,
            edgeLength: 200,
            gravity: 0.1,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 3,
              opacity: 1,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          select: {
            itemStyle: {
              borderColor: "#1890ff",
              borderWidth: 2,
            },
          },
        }],
      };

      return option;
    } catch (error) {
      Setting.showMessage("error", `Error in getChartOption: ${error}`);
      return {};
    }
  }

  getNodeTypeName(category) {
    const types = [
      i18next.t("knowledge:User"),
      i18next.t("knowledge:Topic"),
      i18next.t("knowledge:Entity"),
    ];
    return types[category] || i18next.t("knowledge:Unknown");
  }

  getNodeConnections(nodeId, links) {
    try {
      if (!nodeId || !links || !Array.isArray(links)) {
        return 0;
      }
      return links.filter(link =>
        link && link.source && link.target &&
        (link.source === nodeId || link.target === nodeId)
      ).length;
    } catch (error) {
      Setting.showMessage("error", `Error in getNodeConnections: ${error}`);
      return 0;
    }
  }

  handleChartClick = (params) => {
    try {
      if (!params || !params.dataType || params.dataType !== "node") {
        return;
      }

      if (!params.data || !params.data.id) {
        return;
      }

      const {data} = this.props;
      const nodeExists = data.nodes.some(node => node.id === params.data.id);

      if (!nodeExists) {
        Setting.showMessage("error", `Clicked node not found in current data: ${params.data.id}`);
        return;
      }

      if (this.props.onNodeClick) {
        this.props.onNodeClick(params.data);
      }
    } catch (error) {
      Setting.showMessage("error", `Error handling chart click: ${error}`);
    }
  };

  render() {
    const {style, loading} = this.props;

    return (
      <div style={{position: "relative", ...style}}>
        <ReactECharts
          ref={this.chartRef}
          option={this.getChartOption()}
          style={{height: "100%", width: "100%"}}
          onEvents={{
            click: this.handleChartClick,
          }}
          onChartReady={this.onChartReady}
          notMerge={true}
          lazyUpdate={true}
        />
        {loading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div>{i18next.t("general:Loading")}...</div>
          </div>
        )}
      </div>
    );
  }
}

export default KnowledgeGraphChart;

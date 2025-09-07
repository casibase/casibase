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

import React, {Component} from "react";
import * as echarts from "echarts";
import * as Setting from "./Setting";

class Graph extends Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
    this.chart = null;
  }

  UNSAFE_componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  componentDidMount() {
    this.initChart();
    this.updateChart();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.graphData !== this.props.graphData || prevProps.height !== this.props.height) {
      this.updateChart();
    }
  }

  initChart() {
    if (this.chartRef.current) {
      this.chart = echarts.init(this.chartRef.current);
      window.addEventListener("resize", () => {
        if (this.chart) {this.chart.resize();}
      });
    }
  }

  parseGraphData(graphText) {
    if (!graphText) {return {nodes: [], links: []};}

    try {
      const data = JSON.parse(graphText);

      // 后端已经处理了颜色分配，直接使用处理后的数据
      if (data.nodes && data.links) {
        const nodes = data.nodes || [];
        const links = Array.isArray(data.links) ? data.links : [];
        return {nodes, links};
      }

      // 如果没有 nodes 和 links，返回空数据
      return {nodes: [], links: []};
    } catch (error) {
      Setting.showMessage("error", `Parsing graph data failed: ${error}`);
      return {nodes: [], links: []};
    }
  }

  stripNodeColor(node, index) {
    if (!node) {return node;}
    const copy = {...node};
    if (copy.itemStyle && typeof copy.itemStyle === "object") {
      const {...rest} = copy.itemStyle;
      copy.itemStyle = rest;
    }
    return copy;
  }

  PALETTE = [
    "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
    "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc", "#ff9f7f",
    "#ffdb5c", "#37a2ff", "#32c5e9", "#67e0e3", "#9fe6b8",
    "#ffd93d", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4",
  ];

  hashString(s) {
    let h = 0;
    const str = String(s);
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  categoryColor(name) {
    const idx = this.hashString(name) % this.PALETTE.length;
    return this.PALETTE[idx];
  }

  normalizeCategory(raw) {
    const v = raw ?? "Uncategorized";
    const s = String(v);
    return s.trim() === "" ? "Uncategorized" : s;
  }

  updateChart() {
    if (!this.chart) {return;}

    const parsed = this.parseGraphData(this.props.graphData);
    let nodes = parsed.nodes || [];
    const links = parsed.links || [];

    if (nodes.length === 0) {
      this.chart.setOption({
        title: {
          text: "No graph data",
          left: "center",
          top: "center",
          textStyle: {color: "#999", fontSize: 16},
        },
        series: [],
        legend: {},
        tooltip: {},
      });
      return;
    }

    nodes = nodes.map((n) => {
      const stripped = this.stripNodeColor(n);
      const cat = this.normalizeCategory(
        stripped.categoryName !== undefined ? stripped.categoryName : stripped.category
      );
      return {...stripped, category: cat};
    });

    const categoryNames = [...new Set(nodes.map((n) => n.category))];

    const categories = categoryNames.map((name) => ({
      name,
      itemStyle: {color: this.categoryColor(name)},
    }));

    const option = {
      tooltip: {
        formatter: function(params) {
          if (params.dataType === "node") {
            return `${params.data.name}<br/>Value: ${params.data.value}`;
          } else if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}<br/>Weight: ${params.data.value}`;
          }
          return "";
        },
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle",
        data: categories.map((c) => c.name),
      },
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
          label: {
            show: true,
            position: "right",
            formatter: "{b}",
            fontSize: 12,
          },
          labelLayout: {
            hideOverlap: true,
          },
          scaleLimit: {
            min: 0.4,
            max: 2,
          },
          lineStyle: {
            color: "source",
            curveness: 0.3,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {width: 10},
          },
          force: {
            repulsion: 1000,
            edgeLength: 200,
          },
        },
      ],
    };

    this.chart.setOption(option, true);
    this.chart.resize();
  }

  render() {
    return (
      <div
        ref={this.chartRef}
        style={{
          width: "100%",
          height: this.props.height || "600px",
          backgroundColor: "#fff",
          margin: 0,
          padding: 0,
          display: "block",
          boxSizing: "border-box",
        }}
      />
    );
  }
}

export default Graph;

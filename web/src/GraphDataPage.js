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
import ReactEcharts from "echarts-for-react";
import i18next from "i18next";

function normalizeGraphData(text) {
  if (!text) {
    return {nodes: [], links: [], categories: []};
  }
  const obj = JSON.parse(text);
  const nodes = Array.isArray(obj.nodes) ? obj.nodes.map((node, index) => ({
    ...node,
    id: node.id || node.name || `node_${index}`,
  })) : [];

  const idCount = {};
  const uniqueNodes = nodes.map(node => {
    let uniqueId = node.id;
    if (idCount[uniqueId]) {
      idCount[uniqueId]++;
      uniqueId = `${node.id}_${idCount[uniqueId]}`;
    } else {
      idCount[uniqueId] = 1;
    }
    return {...node, id: uniqueId};
  });

  const links = Array.isArray(obj.links) ? obj.links : [];
  const categories = Array.isArray(obj.categories) ? obj.categories.map(c => (typeof c === "string" ? {name: c} : {name: (c && c.name) || ""})) : [];
  return {nodes: uniqueNodes, links, categories};
}

class GraphDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {nodes: [], links: [], categories: []},
      mode: "force",
      invalidText: false,
      initialZoom: null,
      initialCenter: null,
    };
    this.chartRef = React.createRef();
  }

  computeLayoutParams(nodeCount, isCompact) {
    const safeCount = Math.max(1, nodeCount || 1);
    const densityFactor = Math.log2(safeCount + 1);

    let repulsion, edgeLength, gravity, minScale, initialZoom;
    if (isCompact) {
      const repulsionRaw = 160 / densityFactor + 5;
      repulsion = Math.min(180, Math.max(16, Math.round(repulsionRaw)));

      const edgeLengthRaw = 150 / densityFactor + 5;
      edgeLength = Math.min(90, Math.max(8, Math.round(edgeLengthRaw)));

      const gravityRaw = 0.24 + 0.060 * Math.log10(safeCount + 1);
      gravity = Math.min(0.55, Math.max(0.16, parseFloat(gravityRaw.toFixed(2))));

      const minScaleRaw = 1 / (densityFactor + 1.7);
      minScale = Math.max(0.08, parseFloat(minScaleRaw.toFixed(2)));
      const baseZoom = 1.35 - 0.13 * densityFactor;
      const midBump = 0.35 / (1 + Math.abs(densityFactor - 6));
      const adjZoom = baseZoom + midBump;
      initialZoom = Math.min(0.90, Math.max(0.38, parseFloat(adjZoom.toFixed(2))));
    } else {
      const repulsionRaw = 140 / densityFactor;
      repulsion = Math.min(200, Math.max(15, Math.round(repulsionRaw)));

      const edgeLengthRaw = 90 / densityFactor;
      edgeLength = Math.min(100, Math.max(5, Math.round(edgeLengthRaw)));

      const gravityRaw = 0.18 + 0.06 * Math.log10(safeCount + 1);
      gravity = Math.min(0.55, Math.max(0.12, parseFloat(gravityRaw.toFixed(2))));

      const minScaleRaw = 1 / (densityFactor + 2.0);
      minScale = Math.max(0.1, parseFloat(minScaleRaw.toFixed(2)));

      initialZoom = undefined;
    }

    const symbolSize = isCompact ? 3 : 5;

    return {
      repulsion,
      edgeLength,
      gravity,
      scaleLimit: {min: minScale, max: 8},
      symbolSize,
      initialZoom,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps) {
    if (this.props.graphText !== prevProps.graphText) {
      this.fetch();
    }
  }

  fetch() {
    const text = this.props.graphText || "";
    const defaultData = {nodes: [], links: [], categories: []};
    if (text.trim() === "") {
      this.setState({data: defaultData, invalidText: false});
      return;
    }
    try {
      JSON.parse(text);
    } catch (e) {
      this.setState({data: defaultData, invalidText: true});
      return;
    }
    const data = normalizeGraphData(text);
    this.setState({data, invalidText: false});
  }

  getOption() {
    const {nodes, links, categories} = this.state.data;
    return this.getForceOption(nodes, links, categories);
  }

  getForceOption(nodes, links, categories) {
    const isCompact = this.props.compact;
    const {repulsion, edgeLength, gravity, scaleLimit, symbolSize, initialZoom} = this.computeLayoutParams(nodes.length, isCompact);
    return {
      tooltip: {},
      legend: isCompact ? [] : [{
        data: categories.map(c => c.name),
      }],
      series: [
        {
          name: i18next.t("general:Graphs"),
          type: "graph",
          layout: "force",
          data: nodes.map(n => ({...n, symbolSize})),
          links: links,
          categories: categories,
          roam: true,
          draggable: true,
          label: {position: "right"},
          layoutAnimation: true,
          force: {edgeLength, repulsion, gravity},
          scaleLimit,
          zoom: (isCompact ? initialZoom : this.state.initialZoom) || undefined,
          center: this.state.initialCenter || undefined,
        },
      ],
    };
  }

  render() {
    const height = this.props.height || (this.props.compact ? "180px" : "1000px");
    const hasData = (this.state.data.nodes?.length || 0) > 0 || (this.state.data.links?.length || 0) > 0;
    const chartStyle = {width: "100%", height: "100%"};
    return (
      <div style={{width: "100%", height: height, display: "flex", flexDirection: "column", overflow: "hidden"}}>
        <div style={{flex: 1, overflow: "hidden"}}>
          {this.state.invalidText ? (
            <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4}}>
              {i18next.t("general:Invalid JSON format")}
            </div>
          ) : hasData ? (
            <ReactEcharts
              ref={this.chartRef}
              style={chartStyle}
              option={this.getOption()}
              notMerge={true}
            />
          ) : (
            <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
              {i18next.t("general:No data")}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default GraphDataPage;

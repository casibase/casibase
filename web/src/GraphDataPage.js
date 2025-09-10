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
import {Button, Checkbox, Space, Switch} from "antd";
import i18next from "i18next";

function normalizeGraphData(text) {
  if (!text) {
    return {nodes: [], links: [], categories: []};
  }
  const obj = JSON.parse(text);
  const nodes = Array.isArray(obj.nodes) ? obj.nodes : [];
  const rawLinks = Array.isArray(obj.links) ? obj.links : [];

  const tagToIndex = {};
  const categories = [];
  nodes.forEach(n => {
    const tag = n.tag || "default";
    if (tagToIndex[tag] === undefined) {
      tagToIndex[tag] = categories.length;
      categories.push({name: tag});
    }
  });

  const degree = {};
  rawLinks.forEach(e => {
    if (!degree[e.source]) {
      degree[e.source] = 0;
    }
    if (!degree[e.target]) {
      degree[e.target] = 0;
    }
    degree[e.source] += 1;
    degree[e.target] += 1;
  });

  const nodeScores = nodes.map(n => ({
    id: n.id ?? n.name,
    score: (degree[n.id ?? n.name] || 0) + (n.weight ?? n.val ?? 0),
  })).sort((a, b) => b.score - a.score);
  const topK = new Set(nodeScores.slice(0, Math.min(12, nodeScores.length)).map(x => x.id));

  const mappedNodes = nodes.map(n => ({
    id: n.id ?? n.name,
    name: n.name ?? n.id,
    value: n.val ?? n.value ?? 1,
    symbolSize: Math.max(12, Math.min(60, ((n.weight ?? n.val ?? 1) + (degree[n.id ?? n.name] || 0) * 0.6) * 6)),
    itemStyle: n.color ? {color: n.color} : undefined,
    category: tagToIndex[n.tag || "default"],
    label: {show: topK.has(n.id ?? n.name), position: "right"},
    tooltip: {formatter: () => `${n.name || n.id}`},
  }));

  const links = rawLinks.map(e => ({
    source: e.source,
    target: e.target,
    value: e.value,
    lineStyle: {opacity: 0.6, width: e.value ? Math.max(1, Math.min(6, 1 + 4 * e.value)) : 1},
    label: e.type ? {show: true, formatter: e.type} : undefined,
  }));

  return {nodes: mappedNodes, links, categories};
}

class GraphDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {nodes: [], links: [], categories: []},
      mode: "force",
      neighborsOnly: false,
      selectedNodeId: null,
      selectedTags: null,
      invalidText: false,
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

  getFilteredData() {
    const {nodes, links, categories} = this.state.data;
    let filteredNodes = nodes;
    let filteredLinks = links;
    let filteredCategories = categories;

    // Category filter
    if (this.state.selectedTags && this.state.selectedTags.length > 0) {
      const allowed = new Set(this.state.selectedTags);
      const allowedCatIdx = new Set(categories.map((c, i) => (allowed.has(c.name) ? i : null)).filter(x => x !== null));
      const allowedNodeIds = new Set(nodes.filter(n => allowedCatIdx.has(n.category)).map(n => n.id));
      filteredNodes = nodes.filter(n => allowedNodeIds.has(n.id));
      filteredLinks = links.filter(e => allowedNodeIds.has(e.source) && allowedNodeIds.has(e.target));
      filteredCategories = categories.filter((c, i) => allowedCatIdx.has(i));
    }

    // Neighbors-only filter
    if (this.state.neighborsOnly && this.state.selectedNodeId) {
      const center = this.state.selectedNodeId;
      const neighborIds = new Set([center]);
      filteredLinks.forEach(e => {
        if (e.source === center) {neighborIds.add(e.target);}
        if (e.target === center) {neighborIds.add(e.source);}
      });
      filteredNodes = filteredNodes.filter(n => neighborIds.has(n.id));
      filteredLinks = filteredLinks.filter(e => neighborIds.has(e.source) && neighborIds.has(e.target));
    }

    return {nodes: filteredNodes, links: filteredLinks, categories: filteredCategories};
  }

  getOption() {
    const {nodes, links, categories} = this.getFilteredData();
    if (this.state.mode === "sankey") {
      return this.getSankeyOption(nodes, links, categories);
    } else if (this.state.mode === "radial") {
      return this.getRadialOption(nodes, links, categories);
    } else {
      return this.getForceOption(nodes, links, categories);
    }
  }

  getRadialOption(nodes, links, categories) {
    const isCompact = !!this.props.compact;
    return {
      tooltip: {show: true},
      legend: isCompact ? [] : [{data: categories.map(c => c.name), selectedMode: "multiple"}],
      animation: !isCompact,
      animationDuration: isCompact ? 300 : 800,
      series: [
        {
          type: "graph",
          layout: "circular",
          circular: {rotateLabel: true},
          roam: !isCompact,
          draggable: !isCompact,
          scaleLimit: {min: 0.2, max: 4},
          data: nodes.map(n => ({...n, symbolSize: isCompact ? Math.max(6, Math.min(22, (n.symbolSize || 12) * 0.6)) : Math.max(10, Math.min(36, n.symbolSize || 20))})),
          links: links,
          categories: categories,
          label: {show: false},
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          lineStyle: {color: "source", curveness: 0.15, width: 1},
          emphasis: {focus: "adjacency", lineStyle: {width: 2}},
        },
      ],
    };
  }

  getForceOption(nodes, links, categories) {
    const isCompact = !!this.props.compact;
    return {
      tooltip: {show: true},
      legend: isCompact ? [] : [{data: categories.map(c => c.name), selectedMode: "multiple"}],
      animation: !isCompact,
      animationDuration: isCompact ? 300 : 800,
      animationDurationUpdate: isCompact ? 300 : 600,
      series: [
        {
          type: "graph",
          layout: "force",
          roam: !isCompact,
          draggable: !isCompact,
          scaleLimit: {min: 0.2, max: 4},
          data: isCompact ? nodes.map(n => ({...n, symbolSize: Math.max(6, Math.min(22, (n.symbolSize || 12) * 0.6))})) : nodes,
          links: links,
          categories: categories,
          label: {show: false, position: "right", formatter: "{b}"},
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          force: {
            repulsion: isCompact ? 300 : 1200,
            edgeLength: isCompact ? [40, 140] : [120, 320],
            gravity: isCompact ? 0.05 : 0.03,
          },
          lineStyle: {color: "source", curveness: 0.15, width: 1},
          edgeLabel: {show: false},
          emphasis: {focus: "adjacency", lineStyle: {width: 2}},
        },
      ],
    };
  }

  getSankeyOption(nodes, links, categories) {
    const idToName = {};
    const usedNames = new Set();
    const uniq = (id, name) => {
      const base = (name || id || "").toString();
      let candidate = base;
      let i = 1;
      while (usedNames.has(candidate)) {
        candidate = `${base} (${i})`;
        i++;
      }
      usedNames.add(candidate);
      return candidate;
    };
    nodes.forEach(n => {
      idToName[n.id] = uniq(n.id, n.name);
    });

    const sankeyNodes = nodes.map(n => ({name: idToName[n.id]}));
    const sankeyLinks = links.map(e => ({
      source: idToName[e.source] || e.source,
      target: idToName[e.target] || e.target,
      value: e.value ? Math.max(0.1, e.value) : 1,
      type: e.label?.formatter || undefined,
    }));

    return {
      tooltip: {show: true},
      legend: [{data: categories.map(c => c.name), selectedMode: false}],
      series: [
        {
          type: "sankey",
          layout: "none",
          nodeAlign: "justify",
          emphasis: {focus: "adjacency"},
          data: sankeyNodes,
          links: sankeyLinks,
          lineStyle: {color: "gradient", curveness: 0.5, opacity: 0.6},
          label: {show: true},
          edgeLabel: {show: true, formatter: params => ((params && params.data && params.data.type) ? params.data.type : "")},
          nodeGap: 12,
          nodeWidth: 16,
        },
      ],
    };
  }

  getSankeyCanvasWidth(nodes) {
    const count = nodes?.length || 0;
    const width = Math.max(1200, Math.min(3600, 1200 + Math.sqrt(count) * 220));
    return Math.round(width);
  }

  render() {
    const height = this.props.height || (this.props.compact ? "180px" : "700px");
    const hasData = (this.state.data.nodes?.length || 0) > 0 || (this.state.data.links?.length || 0) > 0;
    const filtered = this.getFilteredData();
    const chartStyle = (this.state.mode === "sankey") ? {width: `${this.getSankeyCanvasWidth(filtered.nodes)}px`, height: "100%"} : {width: "100%", height: "100%"};
    return (
      <div style={{width: "100%", height: height, display: "flex", flexDirection: "column"}}>
        {this.props.compact ? null : (
          <div style={{padding: "8px 0"}}>
            <Space size={8}>
              <Button type={this.state.mode === "force" ? "primary" : "default"} onClick={() => this.setState({mode: "force"})}>Force</Button>
              <Button type={this.state.mode === "radial" ? "primary" : "default"} onClick={() => this.setState({mode: "radial"})}>Radial</Button>
              <Button type={this.state.mode === "sankey" ? "primary" : "default"} onClick={() => this.setState({mode: "sankey"})}>Sankey</Button>
              <span style={{marginLeft: 12}}>Neighbors only</span>
              <Switch size="small" checked={this.state.neighborsOnly} onChange={(checked) => {
                const next = {neighborsOnly: checked};
                if (checked && this.pendingSelectedId && this.state.selectedNodeId !== this.pendingSelectedId) {
                  next.selectedNodeId = this.pendingSelectedId;
                }
                this.setState(next);
              }} />
              {this.state.data.categories?.length > 0 && (
                <Checkbox.Group
                  options={this.state.data.categories.map(c => ({label: c.name, value: c.name}))}
                  value={this.state.selectedTags || this.state.data.categories.map(c => c.name)}
                  onChange={(values) => this.setState({selectedTags: values})}
                />
              )}
            </Space>
          </div>
        )}
        <div style={{flex: 1, overflow: "auto"}}>
          {this.state.invalidText ? (
            <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#d46b08", background: "#fff7e6", border: "1px dashed #ffd591", borderRadius: 4}}>
              {i18next.t("general:Invalid JSON format")}
            </div>
          ) : hasData ? (
            <ReactEcharts
              style={chartStyle}
              option={this.getOption()}
              notMerge={true}
              onEvents={{
                click: (params) => {
                  if (params?.dataType !== "node") {return;}
                  let id = null;
                  if (params?.seriesType === "graph") {
                    id = params.data?.id || params.name;
                  } else if (params?.seriesType === "sankey") {
                    const name = params.data?.name || params.name;
                    const match = this.state.data.nodes?.find(n => (n.name || n.id) === name);
                    id = match?.id || null;
                  }
                  if (!id) {return;}
                  if (!this.state.neighborsOnly) {
                    this.pendingSelectedId = id;
                    return;
                  }
                  if (id !== this.state.selectedNodeId) {
                    this.setState({selectedNodeId: id});
                  }
                },
              }}
            />
          ) : (
            <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999"}}>
              {i18next.t("general:No data")}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default GraphDataPage;

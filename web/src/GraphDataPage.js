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
import ForceGraph2D from "react-force-graph-2d";

class GraphDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {nodes: [], links: []},
    };
    this.fgRef = React.createRef();
    this.containerRef = React.createRef();
    this.hiddenGroups = new Set();
  }

  componentDidMount() {
    const obj = this.parseData();
    this.setState({
      data: {nodes: obj.nodes || [], links: obj.links || []},
    });

    this.updateSize();

    this.handleResize = () => {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        this.updateSize();
        setTimeout(() => {
          if (this.fgRef.current) {
            this.fgRef.current.zoomToFit(200, 20);
          }
        }, 100);
      }, 300);
    };

    window.addEventListener("resize", this.handleResize);
  }

  updateSize() {
    setTimeout(() => {
      if (this.containerRef.current) {
        const rect = this.containerRef.current.getBoundingClientRect();
        this.setState({
          actualWidth: rect.width,
          actualHeight: rect.height,
        });
      }
    }, 0);
  }

  componentDidUpdate(prevProps) {
    if (this.props.graphText !== prevProps.graphText) {
      const obj = this.parseData();
      this.setState({
        data: {nodes: obj.nodes || [], links: obj.links || []},
      });
    }
  }

  componentWillUnmount() {
    if (this.handleResize) {
      window.removeEventListener("resize", this.handleResize);
    }

    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  parseData() {
    const defaultData = {nodes: [], links: []};
    const text = this.props.graphText || "";
    if (text.trim() === "") {
      return defaultData;
    }
    try {
      const obj = JSON.parse(text);
      if (Array.isArray(obj.nodes) && Array.isArray(obj.links)) {
        return obj;
      }
    } catch (e) {
      return defaultData;
    }
  }

  render() {
    const raw = this.state.data || {nodes: [], links: []};
    const nodes = raw.nodes || [];
    const links = (raw.links || [])
      .map(l => {
        let s = l.source, t = l.target;
        if (typeof s === "number") {s = nodes[s]?.id;}
        if (typeof t === "number") {t = nodes[t]?.id;}
        const src = typeof s === "object" && s ? s.id || s.name : s;
        const dst = typeof t === "object" && t ? t.id || t.name : t;
        return {...l, source: src, target: dst};
      });
    const graphData = {nodes, links};

    const groups = [...new Set(nodes.map(n => n.group))].filter(g => g !== null).sort();
    const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

    const getGroupColor = (group) => {
      const index = groups.indexOf(group);
      return colors[index % colors.length];
    };

    const nodeColorFunc = (node) => getGroupColor(node.group);

    const legendItems = groups.map((group) => ({
      group,
      color: getGroupColor(group),
      hidden: this.hiddenGroups.has(group),
    }));

    return (
      <div
        ref={this.containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <ForceGraph2D
          ref={this.fgRef}
          graphData={graphData}
          cooldownTicks={100}
          width={this.state.actualWidth}
          height={this.state.actualHeight}
          nodeLabel="id"
          nodeColor={nodeColorFunc}
          backgroundColor="transparent"
          nodeVisibility={node => !this.hiddenGroups.has(node.group)}
          linkVisibility={link => {
            const sourceGroup = typeof link.source === "object" ? link.source.group :
              nodes.find(n => n.id === link.source)?.group;
            const targetGroup = typeof link.target === "object" ? link.target.group :
              nodes.find(n => n.id === link.target)?.group;
            return !this.hiddenGroups.has(sourceGroup) && !this.hiddenGroups.has(targetGroup);
          }}
          onEngineStop={() => {
            if (this.fgRef.current) {
              this.fgRef.current.zoomToFit(200, 20);
            }
          }}
        />
        {this.props.showLegend !== false && legendItems.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: 8,
              background: "rgba(255,255,255,0.9)",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              pointerEvents: "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {legendItems.map(item => (
              <div
                key={item.group}
                onClick={() => {
                  if (item.hidden) {
                    this.hiddenGroups.delete(item.group);
                  } else {
                    this.hiddenGroups.add(item.group);
                  }
                  this.forceUpdate();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 4,
                  opacity: item.hidden ? 0.5 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: item.hidden ? "#ccc" : item.color,
                  }}
                />
                <span style={{fontSize: 11}}>{item.group}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default GraphDataPage;

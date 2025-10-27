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

class GraphErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error: error};
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("Graph rendering error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(`Graph rendering error: ${error.message}`);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

class GraphDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {nodes: [], links: [], categories: []},
      errorText: "",
      renderError: "",
    };
    this.chartRef = React.createRef();
    this.containerRef = React.createRef();
    this.hiddenCategories = new Set();
  }

  componentDidMount() {
    const result = this.parseData();
    this.setState({
      data: result.data,
      errorText: result.errorText,
      renderError: "",
    });
    if (this.props.onErrorChange) {
      this.props.onErrorChange(result.errorText);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.graphText !== prevProps.graphText || this.props.layout !== prevProps.layout) {
      const result = this.parseData();
      this.setState({
        data: result.data,
        errorText: result.errorText,
        renderError: "",
      });
      if (this.props.onErrorChange) {
        this.props.onErrorChange(result.errorText);
      }
    }
  }

  handleRenderError(error) {
    const errorText = error ? error.toString() : "";
    this.setState({renderError: errorText}, () => {
      if (this.props.onErrorChange) {
        const finalError = this.state.errorText || errorText;
        this.props.onErrorChange(finalError);
      }
    });
  }

  parseData() {
    const defaultData = {nodes: [], links: [], categories: []};
    const text = this.props.graphText || "";
    if (text.trim() === "") {
      return {data: defaultData, errorText: "Graph text is empty"};
    }
    try {
      const obj = JSON.parse(text);
      if (Array.isArray(obj.nodes) && Array.isArray(obj.links)) {
        // Process categories
        const categories = obj.categories || [];
        return {data: {nodes: obj.nodes, links: obj.links, categories}, errorText: ""};
      } else {
        return {data: defaultData, errorText: "Invalid graph format: must have 'nodes' and 'links' arrays"};
      }
    } catch (e) {
      return {data: defaultData, errorText: `JSON parse error: ${e.message}`};
    }
  }

  getOption() {
    const {nodes, links, categories} = this.state.data;
    const layout = this.props.layout || "force";

    // Helper function to validate and sanitize icon URLs
    const sanitizeIconUrl = (iconUrl) => {
      if (!iconUrl || typeof iconUrl !== "string") {
        return null;
      }
      // Only allow http, https, and data URLs
      const urlPattern = /^(https?:\/\/|data:image\/)/i;
      if (!urlPattern.test(iconUrl)) {
        return null;
      }
      return iconUrl;
    };

    // Transform nodes to ECharts format
    const echartNodes = nodes.map(node => {
      const sanitizedIcon = sanitizeIconUrl(node.icon);
      return {
        id: node.id,
        name: node.name || node.id,
        symbolSize: node.symbolSize || 50,
        x: node.x,
        y: node.y,
        value: node.value,
        category: node.category,
        // Support for icon
        symbol: sanitizedIcon ? `image://${sanitizedIcon}` : "circle",
        label: {
          show: true,
          position: "bottom",
          formatter: sanitizedIcon ? `{name|${node.name || node.id}}` : "{b}",
          rich: {
            name: {
              fontSize: 12,
              color: "#333",
              padding: [2, 0, 0, 0],
            },
          },
        },
      };
    });

    // Transform links to ECharts format
    const echartLinks = links.map(link => ({
      source: link.source,
      target: link.target,
    }));

    const option = {
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (params.dataType === "node") {
            return `${params.data.name}<br/>Value: ${params.data.value || "N/A"}`;
          } else if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}`;
          }
          return "";
        },
      },
      legend: this.props.showLegend !== false && categories.length > 0 ? [
        {
          data: categories.map(cat => ({
            name: cat.name,
            icon: "circle",
          })),
          orient: "horizontal",
          top: 10,
          left: "center",
        },
      ] : [],
      series: [
        {
          type: "graph",
          layout: layout,
          data: echartNodes,
          links: echartLinks,
          categories: categories,
          roam: true,
          draggable: true,
          label: {
            show: true,
            position: "bottom",
          },
          lineStyle: {
            color: "source",
            curveness: 0.3,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 3,
            },
          },
          force: layout === "force" ? {
            repulsion: 500,
            edgeLength: 100,
            layoutAnimation: false,
          } : undefined,
          circular: layout === "circular" ? {
            rotateLabel: true,
          } : undefined,
        },
      ],
    };

    return option;
  }

  render() {
    return (
      <div
        ref={this.containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {(this.state.errorText || this.state.renderError) && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 77, 79, 0.9)",
              color: "white",
              padding: "20px",
              borderRadius: 8,
              fontSize: 14,
              maxWidth: "80%",
              textAlign: "center",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{fontWeight: "bold", marginBottom: "8px"}}>Graph Error</div>
            <div>{this.state.errorText || this.state.renderError}</div>
          </div>
        )}
        {!this.state.errorText && !this.state.renderError && (
          <GraphErrorBoundary onError={(error) => this.handleRenderError(error)}>
            <ReactEcharts
              ref={this.chartRef}
              option={this.getOption()}
              style={{height: "100%", width: "100%"}}
              notMerge={true}
              lazyUpdate={true}
            />
          </GraphErrorBoundary>
        )}
      </div>
    );
  }
}

export default GraphDataPage;

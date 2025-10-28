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
      selectedNode: null,
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
      const isSelected = this.state.selectedNode && this.state.selectedNode.id === node.id;
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
        // Add selection indicator
        itemStyle: isSelected ? {
          borderColor: "#1890ff",
          borderWidth: 4,
          shadowBlur: 10,
          shadowColor: "#1890ff",
        } : undefined,
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
        show: false,
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
          edgeSymbol: ["none", "none"],
          edgeSymbolSize: [0, 0],
          lineStyle: {
            color: "source",
            curveness: 0.3,
          },
          emphasis: {
            disabled: true,
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

  handleNodeClick = (params) => {
    if (params.dataType === "node") {
      // Find the full node data
      const node = this.state.data.nodes.find(n => n.id === params.data.id);
      this.setState({
        selectedNode: node,
      });
    }
  };

  handleClosePanel = () => {
    this.setState({
      selectedNode: null,
    });
  };

  onChartReady = (chartInstance) => {
    // Set cursor to pointer on node hover using public containPixel API
    // This ensures compatibility with future ECharts versions
    chartInstance.getZr().on("mousemove", (params) => {
      const pointInPixel = [params.offsetX, params.offsetY];
      if (chartInstance.containPixel("series", pointInPixel)) {
        chartInstance.getZr().setCursorStyle("pointer");
      } else {
        chartInstance.getZr().setCursorStyle("default");
      }
    });
  };

  renderNodePanel() {
    const {selectedNode} = this.state;
    if (!selectedNode) {
      return null;
    }

    // Helper function to validate and sanitize icon URLs
    // Same validation logic as used in getOption method
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

    // Safely render additional properties
    const MAX_VALUE_LENGTH = 100;
    const renderValue = (value) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      // For objects/arrays, stringify but truncate if too long
      try {
        const str = JSON.stringify(value);
        return str.length > MAX_VALUE_LENGTH ? str.substring(0, MAX_VALUE_LENGTH) + "..." : str;
      } catch (e) {
        return "[Complex Object]";
      }
    };

    const sanitizedIcon = sanitizeIconUrl(selectedNode.icon);

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "300px",
          maxHeight: "80%",
          background: "white",
          border: "1px solid #d9d9d9",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          padding: "16px",
          zIndex: 1001,
          overflow: "auto",
        }}
      >
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px"}}>
          <h3 style={{margin: 0, fontSize: "16px", fontWeight: 600}}>Node Details</h3>
          <button
            onClick={this.handleClosePanel}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
              color: "#999",
            }}
          >
            ×
          </button>
        </div>
        <div style={{fontSize: "14px"}}>
          <div style={{marginBottom: "8px"}}>
            <strong>ID:</strong> <span style={{color: "#666"}}>{selectedNode.id}</span>
          </div>
          <div style={{marginBottom: "8px"}}>
            <strong>Name:</strong> <span style={{color: "#666"}}>{selectedNode.name || selectedNode.id}</span>
          </div>
          {selectedNode.value !== undefined && (
            <div style={{marginBottom: "8px"}}>
              <strong>Value:</strong> <span style={{color: "#666"}}>{selectedNode.value}</span>
            </div>
          )}
          {selectedNode.category !== undefined && (
            <div style={{marginBottom: "8px"}}>
              <strong>Category:</strong> <span style={{color: "#666"}}>{selectedNode.category}</span>
            </div>
          )}
          {selectedNode.symbolSize !== undefined && (
            <div style={{marginBottom: "8px"}}>
              <strong>Symbol Size:</strong> <span style={{color: "#666"}}>{selectedNode.symbolSize}</span>
            </div>
          )}
          {sanitizedIcon && (
            <div style={{marginBottom: "8px"}}>
              <strong>Icon:</strong>
              <div style={{marginTop: "4px"}}>
                <img src={sanitizedIcon} alt="Node icon" style={{maxWidth: "100%", maxHeight: "100px"}} />
              </div>
            </div>
          )}
          {Object.keys(selectedNode).filter(key =>
            !["id", "name", "value", "category", "symbolSize", "icon", "x", "y"].includes(key)
          ).map(key => (
            <div key={key} style={{marginBottom: "8px"}}>
              <strong>{key}:</strong> <span style={{color: "#666"}}>{renderValue(selectedNode[key])}</span>
            </div>
          ))}
        </div>
      </div>
    );
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
              style={{height: "100%", width: "100%", cursor: "default"}}
              notMerge={true}
              lazyUpdate={true}
              onEvents={{
                click: this.handleNodeClick,
              }}
              onChartReady={this.onChartReady}
            />
          </GraphErrorBoundary>
        )}
        {this.renderNodePanel()}
      </div>
    );
  }
}

export default GraphDataPage;

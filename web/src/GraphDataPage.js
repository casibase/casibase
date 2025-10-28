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
import * as Setting from "./Setting";

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

  componentWillUnmount() {
    // Component cleanup if needed
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
    const themeColor = Setting.getThemeColor();

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

    // Helper function to darken a color (for border)
    const darkenColor = (color, amount = 20) => {
      // Validate hex color format
      if (!color || typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return "#000000"; // Fallback to black
      }
      const hex = color.replace("#", "");
      const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount);
      const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    };

    // Helper function to create rgba from hex
    const hexToRgba = (hex, alpha) => {
      // Validate hex color format
      if (!hex || typeof hex !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        return "rgba(0, 0, 0, 1)"; // Fallback to black
      }
      // Validate alpha range (handle 0 as valid)
      const validAlpha = alpha !== undefined ? Math.max(0, Math.min(1, alpha)) : 1;
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
    };

    const borderColor = darkenColor(themeColor, 20);
    const shadowColor = hexToRgba(themeColor, 0.8);

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
        // Add selection indicator using theme color
        itemStyle: isSelected ? {
          color: themeColor,
          borderColor: borderColor,
          borderWidth: 6,
          shadowBlur: 20,
          shadowColor: shadowColor,
        } : undefined,
        label: {
          show: true,
          position: "bottom",
          formatter: sanitizedIcon ? `{name|${node.name || node.id}}` : "{b}",
          rich: {
            name: {
              fontSize: 12,
              color: isSelected ? "#ffffff" : "#333",
              backgroundColor: isSelected ? themeColor : "transparent",
              padding: isSelected ? [4, 8, 4, 8] : [2, 0, 0, 0],
              borderRadius: isSelected ? 4 : 0,
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
          roam: true, // Enable pan and zoom
          draggable: true, // Allow dragging nodes
          scaleLimit: {
            min: 0.2,
            max: 5,
          },
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
            focus: "none", // Prevent auto-focusing/centering when clicking
            scale: false, // Prevent scaling on hover
          },
          blur: {
            // Keep nodes visible when not focused
            itemStyle: {
              opacity: 1,
            },
            lineStyle: {
              opacity: 1,
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

  handleNodeClick = (params) => {
    // Only handle node clicks, ignore other data types
    if (params.dataType === "node" && params.data) {
      // Find the full node data
      const node = this.state.data.nodes.find(n => n.id === params.data.id);
      if (node) {
        this.setState({
          selectedNode: node,
        });
      }
    }
  };

  handleMouseOver = (params) => {
    // Set cursor to pointer (hand icon) when hovering over nodes
    if (params.dataType === "node") {
      const chartInstance = this.chartRef.current?.getEchartsInstance();
      if (chartInstance) {
        chartInstance.getZr().setCursorStyle("pointer");
      }
    }
  };

  handleMouseOut = (params) => {
    // Reset cursor to default (arrow icon) when not over nodes
    if (params.dataType === "node") {
      const chartInstance = this.chartRef.current?.getEchartsInstance();
      if (chartInstance) {
        chartInstance.getZr().setCursorStyle("default");
      }
    }
  };

  handleClosePanel = () => {
    this.setState({
      selectedNode: null,
    });
  };

  onChartReady = (chartInstance) => {
    // Chart is ready, but cursor handling is done via mouseover/mouseout events
    // Keep this method for potential future initialization needs
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
          border: this.props.showBorder ? "1px solid #d9d9d9" : "none",
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
                mouseover: this.handleMouseOver,
                mouseout: this.handleMouseOut,
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

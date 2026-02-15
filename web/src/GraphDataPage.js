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
import * as Setting from "./Setting";
import * as AssetBackend from "./backend/AssetBackend";
import * as ScanBackend from "./backend/ScanBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import {transformAssetsToGraph} from "./utils/assetToGraph";
import {ScanDetailPopover} from "./common/ScanDetailPopover";

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
      nodeScans: [],
      loadingScans: false,
      allScans: [],
      allProviders: [],
    };
    this.chartRef = React.createRef();
    this.containerRef = React.createRef();
    this.hiddenCategories = new Set();
  }

  componentDidMount() {
    this.loadGraphData();
    this.loadAllScans();
    this.loadAllProviders();
  }

  loadAllScans = async() => {
    const category = this.props.category || "Default";
    if (category === "Assets") {
      try {
        const owner = this.props.owner || this.props.account?.name || "admin";
        const res = await ScanBackend.getScans(owner);
        if (res.status === "ok") {
          this.setState({allScans: res.data || []});
        }
      } catch (error) {
        // Ignore errors
      }
    }
  };

  loadAllProviders = async() => {
    const category = this.props.category || "Default";
    if (category === "Assets") {
      try {
        const owner = this.props.owner || this.props.account?.name || "admin";
        const res = await ProviderBackend.getProviders(owner);
        if (res.status === "ok") {
          this.setState({allProviders: res.data || []});
        }
      } catch (error) {
        // Ignore errors
      }
    }
  };

  getProviderForScan = (scanProviderName) => {
    if (!scanProviderName) {
      return null;
    }
    return this.state.allProviders.find(provider => provider.name === scanProviderName);
  };

  componentDidUpdate(prevProps) {
    if (this.props.graphText !== prevProps.graphText ||
        this.props.layout !== prevProps.layout ||
        this.props.category !== prevProps.category ||
        this.props.density !== prevProps.density) {
      this.loadGraphData();
    }
  }

  async loadGraphData() {
    const category = this.props.category || "Default";

    if (category === "Assets") {
      // Fetch assets and transform to graph data
      try {
        const owner = this.props.owner || this.props.account?.name;
        if (!owner) {
          this.setState({
            data: {nodes: [], links: [], categories: []},
            errorText: "Owner is required for Asset Graph",
            renderError: "",
          });
          if (this.props.onErrorChange) {
            this.props.onErrorChange("Owner is required for Asset Graph");
          }
          return;
        }

        const res = await AssetBackend.getAssets(owner);
        if (res.status === "ok" && res.data) {
          const graphData = transformAssetsToGraph(res.data);
          this.setState({
            data: graphData,
            errorText: "",
            renderError: "",
          });
          if (this.props.onErrorChange) {
            this.props.onErrorChange("");
          }
        } else {
          this.setState({
            data: {nodes: [], links: [], categories: []},
            errorText: `Failed to fetch assets: ${res.msg || "Unknown error"}`,
            renderError: "",
          });
          if (this.props.onErrorChange) {
            this.props.onErrorChange(`Failed to fetch assets: ${res.msg || "Unknown error"}`);
          }
        }
      } catch (error) {
        this.setState({
          data: {nodes: [], links: [], categories: []},
          errorText: `Error fetching assets: ${error.message}`,
          renderError: "",
        });
        if (this.props.onErrorChange) {
          this.props.onErrorChange(`Error fetching assets: ${error.message}`);
        }
      }
    } else {
      // Default behavior: parse graph text
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
      return {data: defaultData, errorText: ""};
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
    const density = this.props.density || 5; // Default density is 5 (medium)
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

    // Calculate layout-specific spacing based on density
    // Density: 0.1 (very sparse) to 10 (dense)
    // Lower density = more spacing
    const densityFactor = 10.1 - density; // Invert: higher density number = closer nodes
    const repulsion = 200 + (densityFactor * 150); // Range: 215 to 1700
    const edgeLength = 50 + (densityFactor * 50); // Range: 55 to 550

    // Helper function to calculate positions for "none" layout
    const calculateNoneLayoutPositions = (nodes, links) => {
      // Build adjacency list to understand connections
      const adjacency = new Map();
      nodes.forEach(node => adjacency.set(node.id, new Set()));

      links.forEach(link => {
        if (adjacency.has(link.source)) {
          adjacency.get(link.source).add(link.target);
        }
        if (adjacency.has(link.target)) {
          adjacency.get(link.target).add(link.source);
        }
      });

      // Group nodes by their connections (simple clustering)
      const visited = new Set();
      const clusters = [];

      const dfs = (nodeId, cluster) => {
        if (visited.has(nodeId)) {return;}
        visited.add(nodeId);
        cluster.push(nodeId);

        const neighbors = adjacency.get(nodeId);
        if (neighbors) {
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              dfs(neighbor, cluster);
            }
          });
        }
      };

      // Find all clusters
      nodes.forEach(node => {
        if (!visited.has(node.id)) {
          const cluster = [];
          dfs(node.id, cluster);
          clusters.push(cluster);
        }
      });

      // Position nodes based on clusters and density
      const spacing = 150 * densityFactor / 5; // Adjust spacing based on density, range: 3 to 300
      const clusterSpacing = 200 * densityFactor / 5; // Range: 4 to 400
      const nodesPerRow = Math.ceil(Math.sqrt(nodes.length * 1.5));

      let currentX = 0;
      let currentY = 0;
      let maxHeightInRow = 0;

      clusters.forEach((cluster, clusterIndex) => {
        const clusterSize = cluster.length;
        const clusterCols = Math.ceil(Math.sqrt(clusterSize));

        cluster.forEach((nodeId, index) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            const col = index % clusterCols;
            const row = Math.floor(index / clusterCols);

            node.x = currentX + col * spacing;
            node.y = currentY + row * spacing;

            maxHeightInRow = Math.max(maxHeightInRow, (row + 1) * spacing);
          }
        });

        // Move to next cluster position
        currentX += clusterCols * spacing + clusterSpacing;
        if (currentX > nodesPerRow * spacing) {
          currentX = 0;
          currentY += maxHeightInRow + clusterSpacing;
          maxHeightInRow = 0;
        }
      });

      return nodes;
    };

    // Helper function to calculate grid layout positions
    const calculateGridLayoutPositions = (nodes) => {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacing = 150 * densityFactor / 5; // Range: 3 to 300

      nodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.x = col * spacing - (cols * spacing) / 2;
        node.y = row * spacing - (Math.ceil(nodes.length / cols) * spacing) / 2;
      });

      return nodes;
    };

    // Helper function to calculate tree layout positions
    const calculateTreeLayoutPositions = (nodes, links) => {
      // Build adjacency list
      const adjacency = new Map();
      const inDegree = new Map();

      nodes.forEach(node => {
        adjacency.set(node.id, []);
        inDegree.set(node.id, 0);
      });

      links.forEach(link => {
        if (adjacency.has(link.source)) {
          adjacency.get(link.source).push(link.target);
        }
        if (inDegree.has(link.target)) {
          inDegree.set(link.target, inDegree.get(link.target) + 1);
        }
      });

      // Find root nodes (nodes with no incoming edges)
      const roots = [];
      nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
          roots.push(node.id);
        }
      });

      // If no roots found, use first node
      if (roots.length === 0 && nodes.length > 0) {
        roots.push(nodes[0].id);
      }

      // Calculate positions using BFS from roots
      const positioned = new Set();
      const levelSpacing = 200 * densityFactor / 5; // Range: 4 to 400
      const nodeSpacing = 150 * densityFactor / 5; // Range: 3 to 300

      const queue = roots.map(id => ({id, level: 0, parent: null}));
      const levels = new Map();

      while (queue.length > 0) {
        const {id, level} = queue.shift();
        if (positioned.has(id)) {continue;}

        positioned.add(id);
        if (!levels.has(level)) {
          levels.set(level, []);
        }
        levels.get(level).push(id);

        const children = adjacency.get(id) || [];
        children.forEach(childId => {
          if (!positioned.has(childId)) {
            queue.push({id: childId, level: level + 1, parent: id});
          }
        });
      }

      // Position nodes by level
      levels.forEach((nodeIds, level) => {
        const levelWidth = (nodeIds.length - 1) * nodeSpacing;
        nodeIds.forEach((nodeId, index) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            node.x = index * nodeSpacing - levelWidth / 2;
            node.y = level * levelSpacing;
          }
        });
      });

      // Position any unconnected nodes
      let unpositionedCount = 0;
      nodes.forEach(node => {
        if (!positioned.has(node.id)) {
          node.x = unpositionedCount * nodeSpacing;
          node.y = (levels.size) * levelSpacing;
          unpositionedCount++;
        }
      });

      return nodes;
    };

    // Apply custom positioning for certain layouts
    let processedNodes = [...nodes];
    if (layout === "none") {
      processedNodes = calculateNoneLayoutPositions(processedNodes, links);
    } else if (layout === "grid") {
      processedNodes = calculateGridLayoutPositions(processedNodes);
    } else if (layout === "tree") {
      processedNodes = calculateTreeLayoutPositions(processedNodes, links);
    }

    // Transform nodes to ECharts format
    const echartNodes = processedNodes.map(node => {
      const sanitizedIcon = sanitizeIconUrl(node.icon);
      const isSelected = this.state.selectedNode && this.state.selectedNode.id === node.id;
      const scanCount = node.assetName ? this.getScanCountForAsset(node.assetName) : 0;
      const nodeName = node.name || node.id;

      // Create label with badge for scan count
      let labelFormatter;
      if (scanCount > 0) {
        // Add badge indicator for nodes with scans - positioned next to name with spacing
        labelFormatter = sanitizedIcon ?
          `{name|${nodeName}} {badge|${scanCount}}` :
          `${nodeName} {badge|${scanCount}}`;
      } else {
        labelFormatter = sanitizedIcon ? `{name|${nodeName}}` : nodeName;
      }

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
          formatter: labelFormatter,
          rich: {
            name: {
              fontSize: 12,
              color: isSelected ? "#ffffff" : "#333",
              backgroundColor: isSelected ? themeColor : "transparent",
              padding: isSelected ? [4, 8, 4, 8] : [2, 0, 0, 0],
              borderRadius: isSelected ? 4 : 0,
            },
            badge: {
              fontSize: 11,
              fontWeight: "bold",
              color: "#ffffff",
              backgroundColor: "#ff4d4f", // Red background like iOS notification badge
              padding: [3, 7, 3, 7],
              borderRadius: 12,
              align: "center",
              height: 18,
              lineHeight: 18,
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
            name: i18next.t(`graph:${cat.name}`),
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
            curveness: 0,
            width: 2,
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
              width: 2,
            },
          },
          force: layout === "force" ? {
            repulsion: repulsion,
            edgeLength: edgeLength,
            layoutAnimation: true, // Enable animation for force layout
            friction: 0.6,
            gravity: 0.1,
          } : undefined,
          circular: layout === "circular" ? {
            rotateLabel: true,
          } : undefined,
          // For radial layout
          ...(layout === "radial" ? {
            layout: "circular",
            circular: {
              rotateLabel: false,
            },
          } : {}),
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
          loadingScans: true,
          nodeScans: [],
        });
        // Load scans for this asset
        this.loadNodeScans(node);
      }
    }
  };

  loadNodeScans = (node) => {
    // Only load scans if this is an asset node
    if (node.assetName) {
      // Filter scans from cached data
      const nodeScans = this.state.allScans.filter(scan => scan.asset === node.assetName);
      this.setState({
        nodeScans: nodeScans,
        loadingScans: false,
      });
    } else {
      this.setState({
        loadingScans: false,
      });
    }
  };

  getScanCountForAsset = (assetName) => {
    return this.state.allScans.filter(scan => scan.asset === assetName).length;
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
      nodeScans: [],
      loadingScans: false,
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

    // Get category name with i18n support
    const getCategoryName = (categoryIndex) => {
      if (this.state.data.categories && categoryIndex !== undefined && categoryIndex < this.state.data.categories.length) {
        const categoryName = this.state.data.categories[categoryIndex].name;
        // Translate category names
        return i18next.t(`graph:${categoryName}`);
      }
      return categoryIndex;
    };

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "320px",
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
          <h3 style={{margin: 0, fontSize: "16px", fontWeight: 600}}>{i18next.t("graph:Node Details")}</h3>
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
          {selectedNode.displayName && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Display name")}:</strong> <span style={{color: "#666"}}>{selectedNode.displayName}</span>
            </div>
          )}
          {selectedNode.assetType && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Type")}:</strong> <span style={{color: "#666"}}>{selectedNode.assetType}</span>
            </div>
          )}
          {selectedNode.assetId && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:ID")}:</strong> <span style={{color: "#666", wordBreak: "break-all"}}>{selectedNode.assetId}</span>
            </div>
          )}
          {selectedNode.category !== undefined && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Category")}:</strong> <span style={{color: "#666"}}>{getCategoryName(selectedNode.category)}</span>
            </div>
          )}
          {selectedNode.provider && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Provider")}:</strong> <span style={{color: "#666"}}>{selectedNode.provider}</span>
            </div>
          )}
          {selectedNode.region && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Region")}:</strong> <span style={{color: "#666"}}>{selectedNode.region}</span>
            </div>
          )}
          {selectedNode.zone && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Zone")}:</strong> <span style={{color: "#666"}}>{selectedNode.zone}</span>
            </div>
          )}
          {selectedNode.owner && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Owner")}:</strong> <span style={{color: "#666"}}>{selectedNode.owner}</span>
            </div>
          )}
          {selectedNode.createdTime && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("general:Created time")}:</strong> <span style={{color: "#666"}}>{Setting.getFormattedDate(selectedNode.createdTime)}</span>
            </div>
          )}
          {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
            <div style={{marginBottom: "8px"}}>
              <strong>{i18next.t("asset:Properties")}:</strong>
              <div style={{marginTop: "4px", fontSize: "12px", background: "#f5f5f5", padding: "8px", borderRadius: "4px", maxHeight: "150px", overflow: "auto"}}>
                {selectedNode.properties.ipAddresses && selectedNode.properties.ipAddresses.length > 0 && (
                  <div style={{marginBottom: "4px"}}>
                    <strong>IP Addresses:</strong> {selectedNode.properties.ipAddresses.join(", ")}
                  </div>
                )}
                {selectedNode.properties.resourceGroupId && (
                  <div style={{marginBottom: "4px"}}>
                    <strong>Resource Group:</strong> {selectedNode.properties.resourceGroupId}
                  </div>
                )}
                {selectedNode.properties.createTime && (
                  <div style={{marginBottom: "4px"}}>
                    <strong>Create Time:</strong> {selectedNode.properties.createTime}
                  </div>
                )}
                {selectedNode.properties.expireTime && (
                  <div style={{marginBottom: "4px"}}>
                    <strong>Expire Time:</strong> {selectedNode.properties.expireTime}
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedNode.assetName && (
            <div style={{marginTop: "16px", borderTop: "1px solid #e8e8e8", paddingTop: "12px"}}>
              <strong style={{fontSize: "14px"}}>{i18next.t("scan:Related Scans")}:</strong>
              <div style={{marginTop: "8px"}}>
                {this.state.loadingScans ? (
                  <div style={{textAlign: "center", padding: "20px", color: "#999"}}>
                    {i18next.t("general:Loading")}...
                  </div>
                ) : this.state.nodeScans.length > 0 ? (
                  <div style={{display: "flex", flexWrap: "wrap", gap: "4px"}}>
                    {this.state.nodeScans.map((scan) => {
                      const provider = this.getProviderForScan(scan.provider);
                      return (
                        <ScanDetailPopover
                          key={scan.name}
                          scan={scan}
                          provider={provider}
                          placement="left"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div style={{textAlign: "center", padding: "20px", color: "#999"}}>
                    {i18next.t("scan:No scans found")}
                  </div>
                )}
              </div>
            </div>
          )}
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
              notMerge={false}
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

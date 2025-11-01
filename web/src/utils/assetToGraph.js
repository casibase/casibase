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

import {StaticBaseUrl} from "../Conf";

/**
 * Transform asset list data to graph data structure
 * @param {Array} assets - Array of asset objects from API
 * @returns {Object} Graph data with nodes, links, and categories
 */
export function transformAssetsToGraph(assets) {
  if (!assets || !Array.isArray(assets)) {
    return {nodes: [], links: [], categories: []};
  }

  const nodes = [];
  const links = [];
  const categories = [];
  const categoryMap = new Map();
  const resourceTypeMap = new Map();

  // Define category mapping for different resource types
  const resourceTypeCategories = {
    "VPC": "Network",
    "VSwitch": "Network",
    "Network Interface": "Network",
    "Security Group": "Security",
    "ECS Instance": "Compute",
    "Disk": "Storage",
    "Snapshot": "Storage",
    "Image": "Storage",
    "ACS::ECS::AutoSnapshotPolicy": "Policy",
  };

  // Define icons for different resource types
  const resourceTypeIcons = {
    "VPC": `${StaticBaseUrl}/img/cloud/vpc.png`,
    "VSwitch": `${StaticBaseUrl}/img/cloud/vswitch.png`,
    "Network Interface": `${StaticBaseUrl}/img/cloud/network.png`,
    "Security Group": `${StaticBaseUrl}/img/cloud/securitygroup.png`,
    "ECS Instance": `${StaticBaseUrl}/img/cloud/vm.png`,
    "Disk": `${StaticBaseUrl}/img/cloud/disk.png`,
    "Snapshot": `${StaticBaseUrl}/img/cloud/snapshot.png`,
    "Image": `${StaticBaseUrl}/img/cloud/image.png`,
    "ACS::ECS::AutoSnapshotPolicy": `${StaticBaseUrl}/img/cloud/policy.png`,
  };

  // Helper function to get or create a category
  const getCategoryIndex = (categoryName) => {
    if (!categoryMap.has(categoryName)) {
      const index = categories.length;
      categoryMap.set(categoryName, index);
      categories.push({name: categoryName});
    }
    return categoryMap.get(categoryName);
  };

  // Helper function to parse properties JSON
  const parseProperties = (propertiesStr) => {
    try {
      return JSON.parse(propertiesStr || "{}");
    } catch (e) {
      return {};
    }
  };

  // Helper function to extract IP addresses from properties
  const getIpAddresses = (properties) => {
    if (properties.ipAddresses && Array.isArray(properties.ipAddresses)) {
      return properties.ipAddresses;
    }
    return [];
  };

  // First pass: Create nodes for all assets
  assets.forEach((asset, index) => {
    const properties = parseProperties(asset.properties);
    const resourceType = asset.resourceType;
    const categoryName = resourceTypeCategories[resourceType] || "Other";
    const categoryIndex = getCategoryIndex(categoryName);

    // Store resource info for link creation
    resourceTypeMap.set(asset.resourceId, {
      id: asset.resourceId,
      resourceType: resourceType,
      properties: properties,
      region: asset.region,
      zone: asset.zone,
      ipAddresses: getIpAddresses(properties),
    });

    const node = {
      id: asset.resourceId,
      name: asset.displayName || asset.resourceId,
      symbolSize: 50 + (index % 3) * 10,
      x: (index % 5) * 200 - 400,
      y: Math.floor(index / 5) * 150 - 300,
      value: 50 + (index % 5) * 10,
      category: categoryIndex,
      icon: resourceTypeIcons[resourceType] || `${StaticBaseUrl}/img/cloud/default.png`,
      // Additional asset metadata
      displayName: asset.displayName,
      resourceId: asset.resourceId,
      resourceType: asset.resourceType,
      region: asset.region,
      zone: asset.zone,
      provider: asset.provider,
      owner: asset.owner,
      createdTime: asset.createdTime,
      properties: properties,
    };

    nodes.push(node);
  });

  // Second pass: Create links based on relationships
  const linkSet = new Set();

  assets.forEach((asset) => {
    const sourceInfo = resourceTypeMap.get(asset.resourceId);
    if (!sourceInfo) {return;}

    const properties = sourceInfo.properties;
    const resourceType = asset.resourceType;

    // Link ECS Instances to their Network Interfaces (by matching IP addresses)
    if (resourceType === "ECS Instance") {
      const instanceIPs = sourceInfo.ipAddresses;
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "Network Interface") {
          const targetInfo = resourceTypeMap.get(otherAsset.resourceId);
          const niIPs = targetInfo?.ipAddresses || [];

          // Check if they share any IP addresses
          const hasCommonIP = instanceIPs.some(ip => niIPs.includes(ip));
          if (hasCommonIP) {
            const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({
                source: asset.resourceId,
                target: otherAsset.resourceId,
              });
            }
          }
        }
      });
    }

    // Link Network Interfaces to VSwitch (by matching zone)
    if (resourceType === "Network Interface" && asset.zone) {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "VSwitch" && otherAsset.zone === asset.zone) {
          const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.resourceId,
              target: otherAsset.resourceId,
            });
          }
        }
      });
    }

    // Link VSwitch to VPC (by region)
    if (resourceType === "VSwitch" && asset.region) {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "VPC" && otherAsset.region === asset.region) {
          const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.resourceId,
              target: otherAsset.resourceId,
            });
          }
        }
      });
    }

    // Link Disks to ECS Instances (by zone proximity)
    if (resourceType === "Disk" && asset.zone) {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "ECS Instance" && otherAsset.zone === asset.zone) {
          const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.resourceId,
              target: otherAsset.resourceId,
            });
          }
        }
      });
    }

    // Link Security Groups to VPC (by region)
    if (resourceType === "Security Group" && asset.region) {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "VPC" && otherAsset.region === asset.region) {
          const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.resourceId,
              target: otherAsset.resourceId,
            });
          }
        }
      });
    }

    // Link Snapshots to Disks (by properties or resourceGroupId)
    if (resourceType === "Snapshot") {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "Disk") {
          // Check if snapshot name contains disk reference or they share resourceGroupId
          const targetProperties = parseProperties(otherAsset.properties);
          if (properties.resourceGroupId && properties.resourceGroupId === targetProperties.resourceGroupId) {
            const linkKey = `${otherAsset.resourceId}->${asset.resourceId}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({
                source: otherAsset.resourceId,
                target: asset.resourceId,
              });
            }
          }
        }
      });
    }

    // Link Images to ECS Instances (by resourceGroupId)
    if (resourceType === "Image") {
      assets.forEach((otherAsset) => {
        if (otherAsset.resourceType === "ECS Instance") {
          const targetProperties = parseProperties(otherAsset.properties);
          if (properties.resourceGroupId && properties.resourceGroupId === targetProperties.resourceGroupId) {
            const linkKey = `${asset.resourceId}->${otherAsset.resourceId}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({
                source: asset.resourceId,
                target: otherAsset.resourceId,
              });
            }
          }
        }
      });
    }
  });

  return {
    nodes: nodes,
    links: links,
    categories: categories,
  };
}

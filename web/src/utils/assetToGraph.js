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
import * as Setting from "../Setting";

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
  const assetMap = new Map();

  // Define category mapping for different asset types
  const typeCategories = {
    "VPC": "Network",
    "VSwitch": "Network",
    "Network Interface": "Network",
    "Security Group": "Security",
    "Virtual Machine": "Compute",
    "Disk": "Storage",
    "Snapshot": "Storage",
    "Image": "Storage",
    "Snapshot Policy": "Policy",
  };

  // Get icons for different asset types from shared Setting
  const typeIcons = Setting.getAssetTypeIcons();

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
    const assetType = asset.type;
    const categoryName = typeCategories[assetType] || "Other";
    const categoryIndex = getCategoryIndex(categoryName);

    // Store asset info for link creation
    assetMap.set(asset.id, {
      id: asset.id,
      assetType: assetType,
      properties: properties,
      region: asset.region,
      zone: asset.zone,
      ipAddresses: getIpAddresses(properties),
    });

    const node = {
      id: asset.id,
      name: asset.displayName || asset.id,
      symbolSize: 50 + (index % 3) * 10,
      x: (index % 5) * 200 - 400,
      y: Math.floor(index / 5) * 150 - 300,
      value: 50 + (index % 5) * 10,
      category: categoryIndex,
      icon: typeIcons[assetType] || `${StaticBaseUrl}/img/cloud/default.png`,
      // Additional asset metadata
      displayName: asset.displayName,
      assetName: asset.name,
      assetId: asset.id,
      assetType: asset.type,
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
    const sourceInfo = assetMap.get(asset.id);
    if (!sourceInfo) {return;}

    const properties = sourceInfo.properties;
    const assetType = asset.type;

    // Link Virtual Machines to their Network Interfaces (by matching IP addresses)
    if (assetType === "Virtual Machine") {
      const instanceIPs = sourceInfo.ipAddresses;
      assets.forEach((otherAsset) => {
        if (otherAsset.type === "Network Interface") {
          const targetInfo = assetMap.get(otherAsset.id);
          const niIPs = targetInfo?.ipAddresses || [];

          // Check if they share any IP addresses
          const hasCommonIP = instanceIPs.some(ip => niIPs.includes(ip));
          if (hasCommonIP) {
            const linkKey = `${asset.id}->${otherAsset.id}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({
                source: asset.id,
                target: otherAsset.id,
              });
            }
          }
        }
      });
    }

    // Link Network Interfaces to VSwitch (by matching zone)
    if (assetType === "Network Interface" && asset.zone) {
      assets.forEach((otherAsset) => {
        if (otherAsset.type === "VSwitch" && otherAsset.zone === asset.zone) {
          const linkKey = `${asset.id}->${otherAsset.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.id,
              target: otherAsset.id,
            });
          }
        }
      });
    }

    // Link VSwitch to VPC (by region)
    if (assetType === "VSwitch" && asset.region) {
      assets.forEach((otherAsset) => {
        if (otherAsset.type === "VPC" && otherAsset.region === asset.region) {
          const linkKey = `${asset.id}->${otherAsset.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.id,
              target: otherAsset.id,
            });
          }
        }
      });
    }

    // Link Disks to Virtual Machines (by instanceId from disk properties)
    if (assetType === "Disk" && properties.instanceId) {
      // Only create link if the target instance exists
      if (assetMap.has(properties.instanceId)) {
        const linkKey = `${asset.id}->${properties.instanceId}`;
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: asset.id,
            target: properties.instanceId,
          });
        }
      }
    }

    // Link Security Groups to VPC (by region)
    if (assetType === "Security Group" && asset.region) {
      assets.forEach((otherAsset) => {
        if (otherAsset.type === "VPC" && otherAsset.region === asset.region) {
          const linkKey = `${asset.id}->${otherAsset.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              source: asset.id,
              target: otherAsset.id,
            });
          }
        }
      });
    }

    // Link Snapshots to Disks (by diskId from snapshot properties)
    if (assetType === "Snapshot" && properties.diskId) {
      // Only create link if the source disk exists
      if (assetMap.has(properties.diskId)) {
        const linkKey = `${properties.diskId}->${asset.id}`;
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: properties.diskId,
            target: asset.id,
          });
        }
      }
    }

    // Link Images to Virtual Machines that use them (by imageId from instance properties)
    if (assetType === "Virtual Machine" && properties.imageId) {
      // Only create link if the source image exists
      if (assetMap.has(properties.imageId)) {
        const linkKey = `${properties.imageId}->${asset.id}`;
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: properties.imageId,
            target: asset.id,
          });
        }
      }
    }
  });

  return {
    nodes: nodes,
    links: links,
    categories: categories,
  };
}

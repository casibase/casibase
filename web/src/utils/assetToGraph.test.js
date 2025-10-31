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

import {transformAssetsToGraph} from "./assetToGraph";

// eslint-disable-next-line no-undef
describe("transformAssetsToGraph", () => {
  // eslint-disable-next-line no-undef
  test("should return empty graph data for null input", () => {
    const result = transformAssetsToGraph(null);
    // eslint-disable-next-line no-undef
    expect(result).toEqual({nodes: [], links: [], categories: []});
  });

  // eslint-disable-next-line no-undef
  test("should return empty graph data for empty array", () => {
    const result = transformAssetsToGraph([]);
    // eslint-disable-next-line no-undef
    expect(result).toEqual({nodes: [], links: [], categories: []});
  });

  // eslint-disable-next-line no-undef
  test("should create nodes with asset metadata", () => {
    const assets = [
      {
        owner: "admin",
        name: "test-asset",
        createdTime: "2025-10-29T22:37:42+08:00",
        updatedTime: "2025-10-29T22:37:42+08:00",
        displayName: "Test ECS Instance",
        provider: "provider_cloud_alibabacloud",
        resourceId: "i-test123",
        resourceType: "ECS Instance",
        region: "cn-beijing",
        zone: "cn-beijing-k",
        state: "",
        tag: "",
        properties: "{\"createTime\":\"2022-11-11T14:17:00Z\",\"ipAddresses\":[\"192.168.1.1\"]}",
      },
    ];

    const result = transformAssetsToGraph(assets);

    // eslint-disable-next-line no-undef
    expect(result.nodes).toHaveLength(1);
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].displayName).toBe("Test ECS Instance");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].resourceType).toBe("ECS Instance");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].resourceId).toBe("i-test123");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].region).toBe("cn-beijing");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].zone).toBe("cn-beijing-k");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].provider).toBe("provider_cloud_alibabacloud");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].owner).toBe("admin");
    // eslint-disable-next-line no-undef
    expect(result.nodes[0].properties).toHaveProperty("ipAddresses");
  });

  // eslint-disable-next-line no-undef
  test("should create proper categories for different resource types", () => {
    const assets = [
      {
        owner: "admin",
        name: "ecs-1",
        displayName: "ECS 1",
        provider: "provider_cloud_alibabacloud",
        resourceId: "i-ecs1",
        resourceType: "ECS Instance",
        region: "cn-beijing",
        zone: "cn-beijing-k",
        properties: "{}",
      },
      {
        owner: "admin",
        name: "vpc-1",
        displayName: "VPC 1",
        provider: "provider_cloud_alibabacloud",
        resourceId: "vpc-1",
        resourceType: "VPC",
        region: "cn-beijing",
        zone: "",
        properties: "{}",
      },
      {
        owner: "admin",
        name: "disk-1",
        displayName: "Disk 1",
        provider: "provider_cloud_alibabacloud",
        resourceId: "d-disk1",
        resourceType: "Disk",
        region: "cn-beijing",
        zone: "cn-beijing-k",
        properties: "{}",
      },
    ];

    const result = transformAssetsToGraph(assets);

    // eslint-disable-next-line no-undef
    expect(result.categories).toContainEqual({name: "Compute"});
    // eslint-disable-next-line no-undef
    expect(result.categories).toContainEqual({name: "Network"});
    // eslint-disable-next-line no-undef
    expect(result.categories).toContainEqual({name: "Storage"});
  });

  // eslint-disable-next-line no-undef
  test("should create links between related resources", () => {
    const assets = [
      {
        owner: "admin",
        name: "ecs-1",
        displayName: "ECS Instance 1",
        provider: "provider_cloud_alibabacloud",
        resourceId: "i-ecs1",
        resourceType: "ECS Instance",
        region: "cn-beijing",
        zone: "cn-beijing-k",
        properties: "{\"ipAddresses\":[\"192.168.1.1\"]}",
      },
      {
        owner: "admin",
        name: "ni-1",
        displayName: "Network Interface 1",
        provider: "provider_cloud_alibabacloud",
        resourceId: "eni-ni1",
        resourceType: "Network Interface",
        region: "cn-beijing",
        zone: "cn-beijing-k",
        properties: "{\"ipAddresses\":[\"192.168.1.1\"]}",
      },
    ];

    const result = transformAssetsToGraph(assets);

    // Should create a link between ECS instance and Network Interface with shared IP
    // eslint-disable-next-line no-undef
    expect(result.links.length).toBeGreaterThan(0);
  });
});

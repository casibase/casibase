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

import React, {useEffect, useMemo, useState} from "react";
import {Tree} from "antd";
import * as AssetBackend from "../../backend/AssetBackend";
import * as Setting from "../../Setting";
import Search from "antd/es/input/Search";

const AssetTree = ({onSelect, account}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [load, setLoad] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  useEffect(() => {
    AssetBackend.getAssets(account.owner, "", "", "name", account.name)
      .then((res) => {
        setLoad(false);
        if (res.status === "ok") {
          setTreeData(transformData(res.data));
        } else {
          Setting.showMessage("error", `Failed to get assets: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `Failed to get assets: ${error}`);
      });
  }, []);

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onChange = (e) => {
    const {value} = e.target;
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  const handleNodeSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      onSelect(selectedKeys[0]);
    }
  };

  const transformData = (data) => {
    const categorizedAssets = {
      default: [],
    };

    data.forEach((asset) => {
      const {os, tag} = asset;

      if (tag) {
        if (!categorizedAssets[tag]) {
          categorizedAssets[tag] = [];
        }

        categorizedAssets[tag].push({
          title: asset.name,
          key: asset.owner + "/" + asset.name,
        });
      } else if (os) {
        if (!categorizedAssets[os]) {
          categorizedAssets[os] = [];
        }

        categorizedAssets[os].push({
          title: asset.name,
          key: asset.owner + "/" + asset.name,
        });
      } else {
        categorizedAssets.default.push({
          title: asset.name,
          key: asset.owner + "/" + asset.name,
        });
      }
    });

    const treeNodes = [];
    const keys = [];

    Object.entries(categorizedAssets).forEach(([category, assets]) => {
      if (assets.length > 0) {
        treeNodes.push({
          title: category,
          key: category.toLowerCase(),
          children: assets,
          selectable: false,
        });
        keys.push(category.toLowerCase());
      }
    });
    setExpandedKeys(keys);
    return treeNodes;
  };

  const filteredTreeData = useMemo(() => {
    if (!searchValue) {
      setAutoExpandParent(true);
      return treeData;
    }

    const filterTreeNode = (node) => {
      const {title, children, key} = node;
      const isMatched = title.toLowerCase().includes(searchValue.toLowerCase());

      if (isMatched) {
        setExpandedKeys((prevExpandedKeys) => [...prevExpandedKeys, key]);
        return node;
      }

      if (children) {
        const filteredChildren = children
          .map(filterTreeNode)
          .filter((filteredNode) => filteredNode);

        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
      }

      return null;
    };

    return treeData.map(filterTreeNode).filter((filteredNode) => filteredNode);
  }, [searchValue, treeData]);

  if (load) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Search
        style={{
          marginBottom: 8,
        }}
        placeholder="Search"
        onChange={onChange}
      />
      <Tree
        onSelect={handleNodeSelect}
        treeData={filteredTreeData}
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        defaultExpandAll={true}
        autoExpandParent={autoExpandParent}
      />
    </div>
  );
};

export default AssetTree;

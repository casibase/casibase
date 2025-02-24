// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import * as NodeBackend from "../../backend/NodeBackend";
import * as Setting from "../../Setting";
import Search from "antd/es/input/Search";

const NodeTree = ({onSelect, account}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [load, setLoad] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  useEffect(() => {
    NodeBackend.getNodes(account.owner, "", "", "name", account.name)
      .then((res) => {
        setLoad(false);
        if (res.status === "ok") {
          setTreeData(transformData(res.data));
        } else {
          Setting.showMessage("error", `Failed to get nodes: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `Failed to get nodes: ${error}`);
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
    const categorizedNodes = {
      default: [],
    };

    data.forEach((node) => {
      const {os, tag} = node;

      if (tag) {
        if (!categorizedNodes[tag]) {
          categorizedNodes[tag] = [];
        }

        categorizedNodes[tag].push({
          title: node.name,
          key: node.owner + "/" + node.name,
        });
      } else if (os) {
        if (!categorizedNodes[os]) {
          categorizedNodes[os] = [];
        }

        categorizedNodes[os].push({
          title: node.name,
          key: node.owner + "/" + node.name,
        });
      } else {
        categorizedNodes.default.push({
          title: node.name,
          key: node.owner + "/" + node.name,
        });
      }
    });

    const treeNodes = [];
    const keys = [];

    Object.entries(categorizedNodes).forEach(([category, nodes]) => {
      if (nodes.length > 0) {
        treeNodes.push({
          title: category,
          key: category.toLowerCase(),
          children: nodes,
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

export default NodeTree;

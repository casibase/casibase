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

import React, {useEffect, useState} from "react";
import {Tabs} from "antd";
import GuacdPage from "./GuacdPage";
import i18next from "i18next";

const RemoteDesktop = (props) => {
  const [activeKey, setActiveKey] = useState("");
  const [panes, setPanes] = useState([]);
  const [clients, setClients] = useState(new Map());

  useEffect(() => {
    if (props.node) {
      addPane(props.node);
    }
  }, [props.node]);

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  const handleTabEdit = (targetKey, action) => {
    if (action === "add") {
      addPane(props.node);
    } else {
      removePane(targetKey);
    }
  };

  const addPane = (node) => {
    const activeKey = `node-${Date.now()}`;

    for (const pane of panes) {
      if (pane.title === node.name) {
        setActiveKey(pane.key);
        return;
      }
    }

    const newPane = {
      label: node.name,
      children: <GuacdPage
        nodeId={`${node.owner}/${node.name}`}
        activeKey={activeKey}
        closePane={removePane}
        toggleFullscreen={props.toggleFullscreen}
        addClient={(client) => {
          setClients(clients => new Map(clients.set(activeKey, client)));
        }}
      />,
      key: activeKey,
    };

    setPanes(panes => [...panes, newPane]);
    setActiveKey(activeKey);
  };

  const removePane = (targetKey) => {
    let lastIndex;
    panes.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });

    const updatedPanes = panes.filter((pane) => pane.key !== targetKey);

    if (updatedPanes.length && activeKey === targetKey) {
      if (lastIndex >= 0) {
        setActiveKey(updatedPanes[lastIndex].key);
      } else {
        setActiveKey(updatedPanes[0].key);
      }
    }

    const client = clients.get(targetKey);
    if (client) {
      client.disconnect();
    }

    setPanes(updatedPanes);
  };

  if (!props.node) {
    return <div className="remote-desktop">
      <p style={{fontSize: 18}}>{i18next.t("node:Please select a node")}</p>
    </div>;
  }

  return (
    <Tabs
      items={panes}
      activeKey={activeKey}
      onChange={handleTabChange}
      type="editable-card"
      onEdit={handleTabEdit}
      hideAdd
      tabBarStyle={{margin: 0, height: 40}}
    />
  );
};

export default RemoteDesktop;

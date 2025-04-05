// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {InfoCircleOutlined} from "@ant-design/icons";

const StoreInfoTitle = (props) => {
  const {chat, stores} = props;

  // Find the store info for the current chat
  const storeInfo = chat
    ? stores?.find(store => store.name === chat.store)
    : null;

  return storeInfo ? (
    <div style={{
      padding: "10px 15px",
      backgroundColor: "#f0f2f5",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{display: "flex", alignItems: "center"}}>
        <InfoCircleOutlined style={{marginRight: "8px", color: "#1890ff"}} />
        <span><strong>Store: </strong>{storeInfo.displayName || storeInfo.name}</span>
        {storeInfo.type && (
          <span style={{marginLeft: "20px"}}><strong>Type: </strong>{storeInfo.type}</span>
        )}
        {storeInfo.provider && (
          <span style={{marginLeft: "20px"}}><strong>Provider: </strong>{storeInfo.provider}</span>
        )}
      </div>
      {storeInfo.url && (
        <div>
          <strong>URL: </strong>{storeInfo.url}
        </div>
      )}
    </div>
  ) : (
    <div style={{
      padding: "10px 15px",
      backgroundColor: "#f0f2f5",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      alignItems: "center",
    }}>
      <InfoCircleOutlined style={{marginRight: "8px", color: "#1890ff"}} />
      <span><strong>Store: </strong>{chat?.store || "Default Store"}</span>
    </div>
  );
};

export default StoreInfoTitle;

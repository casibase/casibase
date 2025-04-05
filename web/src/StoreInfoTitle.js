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

import React, {useEffect, useRef, useState} from "react";
import {Select} from "antd";
import * as Setting from "./Setting";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as ChatBackend from "./backend/ChatBackend";
import * as StoreBackend from "./backend/StoreBackend";

const StoreInfoTitle = (props) => {
  const {chat, stores, onChatUpdated, onStoreUpdated} = props;
  const [modelProviders, setModelProviders] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use refs to track the latest state values
  const storeRef = useRef();
  const providerRef = useRef();
  const chatRef = useRef();

  // Update refs when props change
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  // Find the current store info
  const storeInfo = chat
    ? stores?.find(store => store.name === chat.store)
    : null;

  // Initialize the local state when props change
  useEffect(() => {
    if (storeInfo) {
      setSelectedStore(storeInfo);
      storeRef.current = storeInfo;
      setSelectedProvider(storeInfo.modelProvider);
      providerRef.current = storeInfo.modelProvider;
    }
  }, [storeInfo]);

  // Get model providers when component mounts
  useEffect(() => {
    if (chat) {
      ProviderBackend.getProviders(chat.owner)
        .then((res) => {
          if (res.status === "ok") {
            const providers = res.data.filter(provider => provider.category === "Model");
            setModelProviders(providers);
          }
        });
    }
  }, [chat]);

  // Combined update function to handle both store and provider updates
  const updateStoreAndChat = async(newStore, newProvider) => {
    if (isUpdating) {return;} // Prevent concurrent updates

    setIsUpdating(true);
    try {
      let updatedStore = {...storeRef.current};
      const updatedChat = {...chatRef.current};
      let storeChanged = false;
      let providerChanged = false;

      // Update store if needed
      if (newStore && newStore.name !== updatedChat.store) {
        updatedChat.store = newStore.name;
        storeChanged = true;

        // If store changes, also get its provider
        if (newStore.modelProvider && newStore.modelProvider !== providerRef.current) {
          updatedStore = newStore;
          providerChanged = true;
        }
      }

      // Update provider if needed
      if (newProvider && (!storeChanged || newProvider !== updatedStore.modelProvider)) {
        updatedStore.modelProvider = newProvider;
        providerChanged = true;
      }

      // Save changes to the backend
      if (storeChanged || providerChanged) {
        let storePromise = Promise.resolve();
        let chatPromise = Promise.resolve();

        // Update the store if needed
        if (providerChanged) {
          storePromise = StoreBackend.updateStore(updatedStore.owner, updatedStore.name, updatedStore);
        }

        // Update the chat if needed
        if (storeChanged) {
          chatPromise = ChatBackend.updateChat(updatedChat.owner, updatedChat.name, updatedChat);
        }

        // Wait for both updates to complete
        const [storeRes, chatRes] = await Promise.all([
          storePromise,
          chatPromise,
        ]);

        // Handle responses
        if ((providerChanged && storeRes.status !== "ok") ||
            (storeChanged && chatRes.status !== "ok")) {
          throw new Error("Failed to update settings");
        }

        // Update was successful
        if (providerChanged) {
          Setting.showMessage("success", "Model updated successfully");
          if (onStoreUpdated) {
            onStoreUpdated(updatedStore);
          }
        }

        if (storeChanged) {
          Setting.showMessage("success", "Store updated successfully");
          if (onChatUpdated) {
            onChatUpdated(updatedChat);
          }
        }

        // Update local refs
        storeRef.current = updatedStore;
        providerRef.current = updatedStore.modelProvider;
        chatRef.current = updatedChat;
      }
    } catch (error) {
      Setting.showMessage("error", `Update failed: ${error.message}`);

      // Revert UI state on error
      setSelectedStore(storeRef.current);
      setSelectedProvider(providerRef.current);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStoreChange = (value) => {
    // Find the store object
    const newStore = stores?.find(store => store.name === value);
    if (newStore && chat) {
      // Update local state immediately for UI responsiveness
      setSelectedStore(newStore);

      // Also update the provider if the new store has one
      if (newStore.modelProvider) {
        setSelectedProvider(newStore.modelProvider);
      }

      // Trigger the combined update
      updateStoreAndChat(newStore, newStore.modelProvider);
    }
  };

  const handleProviderChange = (value) => {
    // Find the provider object
    const newProvider = modelProviders.find(provider => provider.name === value);
    if (newProvider && storeInfo) {
      // Update local state immediately for UI responsiveness
      setSelectedProvider(newProvider.name);

      // Trigger the combined update
      updateStoreAndChat(null, newProvider.name);
    }
  };

  return (
    <div style={{
      padding: "10px 15px",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{display: "flex", alignItems: "center"}}>
        <div style={{marginRight: "20px"}}>
          <span style={{marginRight: "5px"}}><strong>Store:</strong></span>
          <Select
            value={selectedStore?.name || storeInfo?.name || "Default Store"}
            style={{width: 150}}
            onChange={handleStoreChange}
            disabled={isUpdating}
          >
            {stores?.map(store => (
              <Select.Option key={store.name} value={store.name}>
                {store.displayName || store.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <span style={{marginRight: "5px"}}><strong>Model:</strong></span>
          <Select
            value={selectedProvider || storeInfo?.modelProvider || "Default"}
            style={{width: 180}}
            onChange={handleProviderChange}
            disabled={isUpdating}
          >
            {modelProviders.map(provider => (
              <Select.Option key={provider.name} value={provider.name}>
                {provider.displayName || provider.name}
              </Select.Option>
            ))}
            {modelProviders.length === 0 && (
              <Select.Option key="default" value="Default">
                    Default
              </Select.Option>
            )}
          </Select>
        </div>
      </div>

      {storeInfo && (
        <div>
          {storeInfo.type && (
            <span><strong>Type:</strong> {storeInfo.type}</span>
          )}
          {storeInfo.url && (
            <span style={{marginLeft: "15px"}}>
              <strong>URL:</strong> {Setting.getShortText(storeInfo.url, 30)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreInfoTitle;

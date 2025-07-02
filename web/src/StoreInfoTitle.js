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

import React, {useEffect, useMemo, useRef, useState} from "react";
import {Button, Select, Switch} from "antd";
import {MinusOutlined, PlusOutlined} from "@ant-design/icons";
import * as Setting from "./Setting";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as ChatBackend from "./backend/ChatBackend";
import i18next from "i18next";

const StoreInfoTitle = (props) => {
  const {chat, stores, onChatUpdated, onStoreChange, autoRead, onUpdateAutoRead, account, paneCount = 1, onPaneCountChange, showPaneControls = false} = props;

  const [modelProviders, setModelProviders] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [defaultStore, setDefaultStore] = useState(null);

  // Use refs to track the latest state values
  const storeRef = useRef();
  const providerRef = useRef();
  const chatRef = useRef();

  useEffect(() => {
    if (stores) {
      const foundDefaultStore = stores.find(store => store.isDefault);
      setDefaultStore(foundDefaultStore);
    }
  }, [stores]);

  // Filter stores based on user type and pane count
  const filteredStores = useMemo(() => {
    if (!stores || !defaultStore) {return [];}

    // In multi-pane mode, all stores are available
    if (paneCount > 1) {
      return stores;
    }

    // In single chat mode: all users (including admin and chat-admin) can only see childStores
    if (defaultStore.childStores && defaultStore.childStores.length > 0) {
      const childStoreNames = new Set(defaultStore.childStores);
      return stores.filter(store => childStoreNames.has(store.name));
    }

    return [];
  }, [stores, defaultStore, paneCount]);

  // Check if user can manage panes: only admin and chat-admin
  const canManagePanes = useMemo(() => {
    return account?.isAdmin || account?.type === "chat-admin";
  }, [account?.isAdmin, account?.type]);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Common breakpoint for mobile devices
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

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
      const provider = chat?.modelProvider || storeInfo.modelProvider;
      setSelectedProvider(provider);
      providerRef.current = provider;
    }
  }, [storeInfo, chat]);

  // Get model providers when component mounts
  useEffect(() => {
    if (!chat || !defaultStore || !defaultStore.childModelProviders || defaultStore.childModelProviders.length === 0) {
      setModelProviders([]);
    } else {
      ProviderBackend.getProviders(chat.owner)
        .then((res) => {
          if (res.status === "ok") {
            const providers = res.data.filter(provider =>
              provider.category === "Model" && defaultStore.childModelProviders.includes(provider.name)
            );
            setModelProviders(providers);
          }
        });
    }
  }, [chat, defaultStore]);

  // Combined update function to handle both store and provider updates
  const updateStoreAndChat = async(newStore, newProvider) => {
    if (isUpdating) {return;} // Prevent concurrent updates

    setIsUpdating(true);
    try {
      const updatedChat = {...chatRef.current};
      let storeChanged = false;
      let providerChanged = false;

      // Update store if needed
      if (newStore && newStore.name !== updatedChat.store) {
        updatedChat.store = newStore.name;
        storeChanged = true;
      }

      // Update provider in chat (not in store!)
      if (newProvider !== undefined && newProvider !== updatedChat.modelProvider) {
        updatedChat.modelProvider = newProvider;
        providerChanged = true;
      }

      // Save changes to the backend
      if (storeChanged || providerChanged) {
        const chatRes = await ChatBackend.updateChat(updatedChat.owner, updatedChat.name, updatedChat);

        if (chatRes.status !== "ok") {
          throw new Error("Failed to update settings");
        }

        // Update was successful
        if (onChatUpdated) {
          onChatUpdated(updatedChat);
        }

        // Update local refs
        chatRef.current = updatedChat;
        if (newProvider !== undefined) {
          providerRef.current = newProvider;
          setSelectedProvider(newProvider); // Sync UI state after successful update
        }
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error.message}`);

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
      if (!chat.modelProvider && newStore.modelProvider) {
        setSelectedProvider(newStore.modelProvider);
      }

      // Trigger the combined update
      updateStoreAndChat(newStore, newStore.modelProvider);

      if (onStoreChange) {
        const updatedChat = onStoreChange(newStore);
        if (updatedChat) {
          chatRef.current = updatedChat;
        }
      }
    }
  };

  const handleProviderChange = (value) => {
    // Find the provider object
    const newProvider = modelProviders.find(provider => provider.name === value);
    if (newProvider && storeInfo) {

      // Trigger the combined update
      updateStoreAndChat(null, newProvider.name);
    }
  };

  // Pane control functions
  const addPane = () => {
    const newCount = paneCount + 1;
    if (newCount > 4) {
      return;
    }
    if (onPaneCountChange) {
      onPaneCountChange(newCount);
    }
  };

  const deletePane = () => {
    if (paneCount <= 1) {
      return;
    }
    if (onPaneCountChange) {
      onPaneCountChange(paneCount - 1);
    }
  };

  const shouldShowTitleBar = paneCount === 1 && (filteredStores.length > 0 || modelProviders.length > 0 || storeInfo?.showAutoRead || (showPaneControls && canManagePanes));

  if (!shouldShowTitleBar) {
    return null;
  }

  return (
    <div style={{
      padding: "10px 15px",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{display: "flex", alignItems: "center"}}>
        {filteredStores.length > 0 && (
          <div style={{marginRight: "20px"}}>
            {!isMobile && <span style={{marginRight: "10px"}}>{i18next.t("general:Store")}:</span>}
            <Select value={selectedStore?.name || storeInfo?.name || (filteredStores[0]?.name)} style={{width: isMobile ? "35vw" : "12rem"}} onChange={handleStoreChange} disabled={isUpdating}>
              {filteredStores.map(store => (
                <Select.Option key={store.name} value={store.name}>
                  {store.displayName || store.name}
                </Select.Option>
              ))}
            </Select>
          </div>)}

        {modelProviders.length > 0 && (
          <div>
            {!isMobile && <span style={{marginRight: "10px"}}>{i18next.t("general:Model")}:</span>}
            <Select value={selectedProvider || chat?.modelProvider || storeInfo?.modelProvider || (modelProviders[0]?.name)} style={{width: isMobile ? "35vw" : "15rem"}} onChange={handleProviderChange} disabled={isUpdating} popupMatchSelectWidth={false} optionLabelProp="children" suffixIcon={<div />}>
              {modelProviders.map(provider => {
                const displayName = provider.displayName || provider.name;
                return (
                  <Select.Option
                    key={provider.name}
                    value={provider.name}
                  >
                    <div style={{display: "flex", alignItems: "center"}}>
                      <img
                        src={Setting.getProviderLogoURL(provider)}
                        alt={provider.name}
                        style={{width: 20, height: 20, marginRight: 8}}
                      />
                      <span>{displayName || provider.name}</span>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </div>)}

        {
          storeInfo?.showAutoRead && (
            <div>
              <span style={{marginLeft: "20px", marginRight: "10px"}}>{i18next.t("store:Auto read")}:</span>
              <Switch checked={autoRead} onChange={checked => {
                onUpdateAutoRead(checked);
              }} />
            </div>
          )
        }

        {showPaneControls && canManagePanes && (
          <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <span style={{fontSize: "12px", color: "#666", marginLeft: "20px", marginRight: "10px"}}>{i18next.t("chat:Panes")}: {paneCount}</span>
            <Button size="small" icon={<PlusOutlined />} onClick={addPane} />
            <Button size="small" icon={<MinusOutlined />} onClick={deletePane} disabled={paneCount <= 1} />
          </div>
        )}
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

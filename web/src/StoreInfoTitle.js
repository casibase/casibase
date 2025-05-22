import React, {useEffect, useMemo, useRef, useState} from "react";
import {Select, Switch} from "antd";
import * as Setting from "./Setting";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as ChatBackend from "./backend/ChatBackend";
import * as StoreBackend from "./backend/StoreBackend";
import i18next from "i18next";

const StoreInfoTitle = (props) => {
  const {chat, stores, onChatUpdated, onStoreUpdated, autoRead, onUpdateAutoRead} = props;
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
  // Filter stores to show default store and its child stores
  const filteredStores = useMemo(() => {
    if (!stores || !defaultStore) {return [];}

    if (defaultStore.childStores && defaultStore.childStores.length > 0) {
      const childStoreNames = new Set(defaultStore.childStores);
      return stores.filter(store => childStoreNames.has(store.name));
    }

    return [];
  }, [stores, defaultStore]);

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
      setSelectedProvider(storeInfo.modelProvider);
      providerRef.current = storeInfo.modelProvider;
    }
  }, [storeInfo]);

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
          if (onStoreUpdated) {
            onStoreUpdated(updatedStore);
          }
        }

        if (storeChanged) {
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

  const shouldShowTitleBar = filteredStores.length > 0 || modelProviders.length > 0 || storeInfo?.showAutoRead;

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
            <Select
              value={selectedStore?.name || storeInfo?.name || "Default Store"}
              style={{width: isMobile ? "35vw" : "12rem"}}
              onChange={handleStoreChange}
              disabled={isUpdating}
            >
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
            <Select
              value={selectedProvider || storeInfo?.modelProvider || "Default"}
              style={{width: isMobile ? "35vw" : "15rem"}}
              onChange={handleProviderChange}
              disabled={isUpdating}
              popupMatchSelectWidth ={false}
              optionLabelProp="children"
              suffixIcon={<div />}
            >
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
              {modelProviders.length === 0 && (
                <Select.Option key="default" value="Default">
                        Default
                </Select.Option>
              )}
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

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

class ChatRouterUtils {
  static isNewChatRoute(match) {
    if (!match) {
      return false;
    }

    const {chatName, storeName} = match.params;
    const path = window.location.pathname;

    return !!(storeName && !chatName && path.endsWith("/chat"));
  }

  static generateChatUrl(chatName, storeName) {
    const path = window.location.pathname;

    if (path.startsWith("/stores/")) {
      return `/stores/admin/${storeName}/chat${chatName ? "/" + chatName : ""}`;
    }

    return `/admin/${storeName}/chat${chatName ? "/" + chatName : ""}`;
  }

  static updateStoreAndUrl(chat, newStore, goToLinkSoft, generateUrlFn) {
    if (!chat) {
      return null;
    }

    const updatedChat = {...chat, store: newStore.name};
    goToLinkSoft(generateUrlFn(chat.name, newStore.name));
    return updatedChat;
  }

  static handleNewChatRoute(getStore, newChat, ChatBackend, goToLinkSoft, generateChatUrl, setState, getMessages, getGlobalStores, showMessage, i18next, currentData) {
    const storeName = getStore();
    const selectStore = {name: storeName};
    const newChatObj = newChat(undefined, selectStore);

    return ChatBackend.addChat(newChatObj).then((res) => {
      if (res.status === "ok") {
        goToLinkSoft(generateChatUrl(newChatObj.name, newChatObj.store));

        setState({
          chat: newChatObj,
          messages: [],
          loading: false,
          data: [newChatObj, ...(currentData || [])],
        });

        getMessages(newChatObj);
        getGlobalStores();

        return true;
      } else {
        setState({loading: false});
        showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        return false;
      }
    }).catch(error => {
      setState({loading: false});
      showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      return false;
    });
  }

  static handleStoreUrlMismatch(stores, getStore, currentChat, ChatBackend, setState) {
    const urlStoreName = getStore();
    if (urlStoreName && currentChat && currentChat.store !== urlStoreName) {
      const targetStore = stores.find(store => store.name === urlStoreName);
      if (targetStore) {
        const updatedChat = {...currentChat, store: urlStoreName};
        ChatBackend.updateChat(updatedChat.owner, updatedChat.name, updatedChat)
          .then((res) => {
            if (res.status === "ok") {
              setState({chat: updatedChat});
            }
          });
      }
    }
  }
}

export default ChatRouterUtils;

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

import * as Setting from "../Setting";
import {renderText} from "../ChatMessageRender";
import moment from "moment";
import {checkProvider} from "./ProviderWidget";
import * as ChatBackend from "../backend/ChatBackend";
import i18next from "i18next";
import * as MessageBackend from "../backend/MessageBackend";

function newTestMessage(text, author, provider, account) {
  const randomName = Setting.getRandomName();
  const messageText = text;
  return {
    owner: "admin",
    name: `message_${randomName}`,
    createdTime: moment().format(),
    organization: account.owner,
    user: account.name,
    chat: `chat_${provider.name}`,
    replyTo: "",
    author: author,
    text: messageText,
    isHidden: false,
    isDeleted: false,
    isAlerted: false,
    isRegenerated: false,
    fileName: "",
    html: renderText(messageText),
    errorText: "",
    reasonText: "",
  };
}

export async function sendTestModel(provider, originalProvider, question, owner, user, setLoading = null, setAnswer = null) {
  await checkProvider(provider, originalProvider);
  if (setLoading) {
    setLoading(true);
  }

  const providerName = provider.name;

  const response = await fetch(`${Setting.ServerUrl}/api/get-answer?provider=${encodeURIComponent(providerName)}&question=${encodeURIComponent(question)}&framework=chat_${encodeURIComponent(providerName)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
    },
  });

  const result = await response.json();

  if (result.status === "ok") {
    if (setAnswer) {
      setAnswer(result.data);
      setLoading(false);
    }
  } else {
    Setting.showMessage("error", Setting.getRefinedErrorText(result.msg));
    if (setAnswer) {
      setAnswer("");
    }
  }
}

export function sendTestMessage(provider, originalProvider, messageText, account, setLoading, setMessages, messages) {
  if (!messageText.trim()) {return;}

  const userMessage = newTestMessage(messageText, account.name, provider, account);

  const aiMessage = newTestMessage("", "AI", provider, account);
  aiMessage.replyTo = userMessage.name;

  const newMessages = [...messages, userMessage, aiMessage];
  setMessages(newMessages);

  sendTestModel(provider, originalProvider, messageText, account.owner, account.name, setLoading,
    (answer) => {
      const updatedMessages = [...newMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      lastMessage.text = answer;
      lastMessage.html = renderText(answer);
      setMessages(updatedMessages);
    }
  );
}

export function getTestMessages(provider, account, setMessages) {
  const testChatName = `chat_${provider.name}`;

  MessageBackend.getChatMessages(account.owner, testChatName)
    .then((res) => {
      if (res.status === "ok") {
        if (res.data) {
          res.data.map((message) => {
            message.html = renderText(message.text);
            return message;
          });
        }
        setMessages(res.data || []);
      } else {
        setMessages([]);
      }
    })
    .catch(error => {
      setMessages([]);
    });
}

export function clearTestMessages(provider, account, setMessages) {
  const testChat = {
    name: `chat_${provider.name}`,
    owner: "admin",
    organization: account.owner,
  };

  ChatBackend.deleteChat(testChat)
    .then((res) => {
      if (res.status === "ok") {
        Setting.showMessage("success", i18next.t("general:Successfully deleted"));
        setMessages([]);
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
      }
    })
    .catch(error => {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
    });
}

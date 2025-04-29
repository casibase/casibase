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
import i18next from "i18next";
import moment from "moment/moment";
import * as MessageBackend from "../backend/MessageBackend";
import * as TtsBackend from "../backend/TtsBackend";
import * as ChatBackend from "../backend/ChatBackend";
import * as ProviderBackend from "../backend/ProviderBackend";

// Global audio player for TTS playback
let audioPlayer = null;

function newChat(owner, user) {
  const randomName = Setting.getRandomName();
  return {
    owner: "admin",
    name: `chat_${randomName}`,
    createdTime: moment().format(),
    updatedTime: moment().format(),
    organization: owner, // Default to admin if props.account not available
    displayName: `${i18next.t("chat:New Chat")} - ${randomName}`,
    category: i18next.t("chat:Default Category"),
    type: "provider",
    user: user,
    user1: "",
    user2: "",
    users: [],
    clientIp: "",
    userAgent: "",
    messageCount: 0,
    tokenCount: 0,
    needTitle: true,
    isHidden: true,
  };
}

function NewMessage(chatName, text) {
  const randomName = Setting.getRandomName();
  return {
    owner: "admin",
    name: `message_${randomName}`,
    createdTime: moment().format(),
    organization: "admin",
    user: "admin",
    chat: chatName,
    replyTo: "",
    author: "AI",
    text: text,
    isHidden: true,
    isDeleted: false,
    isAlerted: false,
    isRegenerated: false,
    fileName: "",
  };
}

async function checkProvider(provider, originalProvider) {
  const hasChanges = JSON.stringify(originalProvider) !== JSON.stringify(provider);
  if (hasChanges) {
    const saveRes = await ProviderBackend.updateProvider(provider.owner, provider.name, provider);

    if (saveRes.status === "ok") {
      Setting.showMessage("success", i18next.t("general:Successfully saved"));
    } else {
      Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${saveRes.msg}`);
    }
  }
}

export async function sendTestTts(provider, originalProvider, text, owner, user, setLoading = null) {
  await checkProvider(provider, originalProvider);
  if (setLoading) {
    setLoading(true);
  }

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer = null;
  }

  try {
    if (provider.chatName === "") {
      const chat = newChat(owner, user);
      provider.chatName = chat.name;

      const chatRes = await ChatBackend.addChat(chat);
      if (chatRes.status !== "ok") {
        Setting.showMessage("error", `Chat failed to add: ${chatRes.msg}`);
        if (setLoading) {setLoading(false);}
        return;
      }
    }

    const audioBlob = await createMessageAndGenerateAudio(provider, text);

    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayer = new Audio(audioUrl);
      if (audioBlob.type === "application/json") {
        Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
        if (setLoading) {setLoading(false);}
        return;
      }

      audioPlayer.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioPlayer = null;
      };

      audioPlayer.onerror = (e) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to play audio")}: ${e.target.error?.message || "Unknown error"}`);
        URL.revokeObjectURL(audioUrl);
        if (setLoading) {setLoading(false);}
      };

      await audioPlayer.play();
    }
  } catch (error) {
    Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error.message}`);
  } finally {
    if (setLoading) {
      setLoading(false);
    }
  }
}

async function createMessageAndGenerateAudio(provider, text) {
  const message = NewMessage(provider.chatName, text);

  const res = await MessageBackend.addMessage(message);

  if (res.status !== "ok") {
    throw new Error(`Failed to create message: ${res.msg}`);
  }

  // Get the message ID from the response
  const providerId = `${provider.owner}/${provider.name}`;
  const messageId = `${message.owner}/${message.name}`;

  return await TtsBackend.generateTextToSpeechAudio("", providerId, messageId);
}

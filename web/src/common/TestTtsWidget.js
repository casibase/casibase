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

// Global audio player for TTS playback
let audioPlayer = null;

export function sendTestTts(provider, text) {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer = null;
  }

  createMessageAndGenerateAudio(provider, text)
    .then(audioBlob => {
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);

        audioPlayer = new Audio(audioUrl);

        audioPlayer.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioPlayer = null;
        };

        audioPlayer.play();
      }
    })
    .catch(error => {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error.message}`);
    });
}

async function createMessageAndGenerateAudio(provider, text) {
  const message = createNewMessage(provider.chatName, text);

  const res = await MessageBackend.addMessage(message);

  if (res.status !== "ok") {
    throw new Error(`Failed to create message: ${res.msg}`);
  }

  // Get the message ID from the response
  const storeId = `${res.data.owner}/${res.data.store}`;
  const messageId = `${message.owner}/${message.name}`;

  return await TtsBackend.generateTextToSpeechAudio(storeId, messageId);
}

function createNewMessage(chatName, text) {
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

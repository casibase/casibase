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
import * as TtsBackend from "../backend/TtsBackend";
import * as ProviderBackend from "../backend/ProviderBackend";

// Global audio player for TTS playback
let audioPlayer = null;

async function checkProvider(provider, originalProvider) {
  const hasChanges = JSON.stringify(originalProvider) !== JSON.stringify(provider);
  if (hasChanges) {
    const saveRes = await ProviderBackend.updateProvider(provider.owner, provider.name, provider);
    if (saveRes.status !== "ok") {
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
    const providerId = `${provider.owner}/${provider.name}`;
    const audioBlob = await TtsBackend.generateTextToSpeechAudio("", providerId, "", text);

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
        Setting.showMessage("error", `${i18next.t("provider:Failed to play audio")}: ${e.target.error?.message || "Unknown error"}`);
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

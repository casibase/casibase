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

import * as Setting from "./Setting";
import * as TTSBackend from "./backend/TtsBackend";

class TtsHelper {
  constructor(component) {
    this.component = component;
    this.synth = window.speechSynthesis;
    this.audioPlayer = null;
  }

  pauseReading() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
    } else {
      this.synth.pause();
    }
    this.component.setState({isReading: false});
  }

  resumeReading() {
    if (this.audioPlayer) {
      this.audioPlayer.play();
    } else {
      this.synth.resume();
    }
    this.component.setState({isReading: true});
  }

  cancelReading() {
    this.synth.cancel();
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
  }

  // Main method to handle TTS functionality
  readMessage(message, store) {
    // Cancel any current reading
    this.cancelReading();

    const useCloudTTS = store &&
            store.textToSpeechProvider &&
            store.textToSpeechProvider !== "";

    if (useCloudTTS) {
      this.component.setState({
        readingMessage: message.name,
        isReading: true,
      });

      const storeId = `${store.owner}/${store.name}`;
      const messageId = `${message.owner}/${message.name}`;

      TTSBackend.getTextToSpeechAudio(storeId, messageId)
        .then(blob => {
          const audioUrl = URL.createObjectURL(blob);

          // Create a new audio player
          this.audioPlayer = new Audio(audioUrl);

          // set the onended callback to revoke the object URL
          this.audioPlayer.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            this.component.setState({
              isReading: false,
              readingMessage: null,
            });
          };

          this.audioPlayer.play();
        })
        .catch(error => {
          Setting.showMessage("error", `TTS failed: ${error.message}. Falling back to browser TTS.`);
          this.useBrowserTTS(message);
        });
    } else {
      this.useBrowserTTS(message);
    }
  }

  useBrowserTTS(message) {
    this.synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(message.text);
    utterThis.lang = Setting.getLanguage();
    utterThis.addEventListener("end", () => {
      this.synth.cancel();
      this.component.setState({isReading: false, readingMessage: null});
    });
    this.synth.speak(utterThis);
    this.component.setState({
      readingMessage: message.name,
      isReading: true,
    });
  }

  cleanup() {
    this.synth.cancel();
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
  }
}

export default TtsHelper;

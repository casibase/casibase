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

import * as Setting from "./Setting";
import * as TTSBackend from "./backend/TtsBackend";

class TtsHelper {
  constructor(component) {
    this.component = component;
    this.synth = window.speechSynthesis;
    this.audioPlayer = null;
    this.eventSource = null;
    this.audioContext = null;
    this.audioQueue = [];
    this.isProcessingQueue = false;
    this.currentAudioSource = null;
  }

  pauseReading() {
    if (this.audioContext) {
      this.audioContext.suspend();
    } else if (this.audioPlayer) {
      this.audioPlayer.pause();
    } else {
      this.synth.pause();
    }
    this.component.setState({isReading: false});
  }

  resumeReading() {
    if (this.audioContext) {
      this.audioContext.resume();
    } else if (this.audioPlayer) {
      this.audioPlayer.play();
    } else {
      this.synth.resume();
    }
    this.component.setState({isReading: true});
  }

  cancelReading() {
    if (this.synth) {
      this.synth.cancel();
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }

    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }

    this.audioQueue = [];
    this.isProcessingQueue = false;

    // Reset loading state when canceling
    this.component.setState({
      isLoadingTTS: false,
    });
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

      if (store.enableTtsStreaming) {
        this.useStreamingTTS(message, storeId, messageId);
      } else {
        // Set loading state before starting non-streaming TTS
        this.component.setState({
          isLoadingTTS: true,
        });
        this.useNonStreamingTTS(message, storeId, messageId);
      }
    } else {
      this.useBrowserTTS(message);
    }
  }

  useStreamingTTS(message, storeId, messageId) {
    this.eventSource = TTSBackend.generateTextToSpeechAudioStream(storeId, messageId);

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    this.audioQueue = [];
    this.isProcessingQueue = false;

    this.eventSource.addEventListener("chunk", (e) => {
      try {
        const eventData = JSON.parse(e.data);
        if (eventData.type === "audio") {
          const binaryString = atob(eventData.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          this.audioQueue.push(bytes.buffer);

          if (!this.isProcessingQueue) {
            this.processAudioQueue();
          }
        }
      } catch (error) {
        Setting.showMessage("error", "TTS stream failed. Falling back to browser TTS.");
        this.useBrowserTTS(message);
      }
    });

    this.eventSource.addEventListener("end", () => {
      this.audioQueue.push("END");

      if (!this.isProcessingQueue) {
        this.processAudioQueue();
      }

      this.eventSource.close();
      this.eventSource = null;
    });

    this.eventSource.addEventListener("error", (e) => {
      try {
        const errorData = JSON.parse(e.data);
        Setting.showMessage("error", `TTS failed: ${errorData.error}. Falling back to browser TTS.`);
      } catch (error) {
        Setting.showMessage("error", "TTS stream failed. Falling back to browser TTS.");
      }

      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      this.component.setState({
        isReading: false,
        readingMessage: null,
      });

      this.useBrowserTTS(message);
    });
  }

  useNonStreamingTTS(message, storeId, messageId) {
    TTSBackend.generateTextToSpeechAudio(storeId, "", messageId, "")
      .then(blob => {
        // Reset loading state when data is received
        this.component.setState({
          isLoadingTTS: false,
        });

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
        // Reset loading state on error
        this.component.setState({
          isLoadingTTS: false,
        });

        Setting.showMessage("error", `TTS failed: ${error.message}. Falling back to browser TTS.`);
        this.useBrowserTTS(message);
      });
  }

  processAudioQueue() {
    if (this.audioQueue.length === 0 || !this.component.state.isReading) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const item = this.audioQueue.shift();

    if (item === "END") {
      this.component.setState({
        isReading: false,
        readingMessage: null,
      });
      this.isProcessingQueue = false;
      return;
    }

    this.audioContext.decodeAudioData(item, (buffer) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.processAudioQueue();
      };

      source.start(0);
      this.currentAudioSource = source;
    }, (error) => {
      this.processAudioQueue();
    });
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
    this.cancelReading();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.component.setState({
      isLoadingTTS: false,
    });
  }
}

export default TtsHelper;

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
import BrowserSpeechToTextProvider from "./SpeechProvider/BrowserSpeechToTextProvider";
import RemoteSpeechToTextProvider from "./SpeechProvider/RemoteSpeechToTextProvider";
import {bufferToWav} from "./SpeechProvider/AudioUtils";

class SpeechToTextHelper {
  constructor(component) {
    this.component = component;
    this.audioChunks = [];
    this.isRecording = false;

    this.browserProvider = new BrowserSpeechToTextProvider(this);
    this.remoteProvider = new RemoteSpeechToTextProvider(this);
  }

  initBrowserRecognition(resultCallback) {
    return this.browserProvider.initBrowserRecognition(resultCallback);
  }

  startRecording() {
    return this.remoteProvider.startRecording();
  }

  stopRecording() {
    return this.remoteProvider.stopRecording();
  }

  stopRecognition() {
    this.browserProvider.stopRecognition();
    this.remoteProvider.stopRecording();
  }

  // Convert audio to WAV format
  convertToWav(audioBlob) {
    return new Promise((resolve, reject) => {
      if (!audioBlob || audioBlob.size === 0) {
        reject(new Error("Invalid audio data: empty or null blob"));
        return;
      }

      if (audioBlob.type === "audio/wav") {
        resolve(audioBlob);
        return;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({
        sampleRate: 16000, // Force 16kHz sample rate for compatibility
      });

      // Create a file reader to read the blob
      const reader = new FileReader();

      reader.onload = function(e) {
        if (!e.target.result || e.target.result.byteLength === 0) {
          reject(new Error("Audio data is empty after reading file"));
          return;
        }

        audioContext.decodeAudioData(e.target.result)
          .then(buffer => {
            try {
              const wavBuffer = bufferToWav(buffer, 16000); // Force 16kHz sample rate
              const wavBlob = new Blob([wavBuffer], {type: "audio/wav"});
              resolve(wavBlob);
            } catch (wavError) {
              reject(wavError);
            }
          })
          .catch(error => {
            Setting.showMessage("error", "Could not process audio recording. Please try again or speak more clearly.");
            reject(error);
          });
      };

      reader.onerror = function(error) {
        reject(error);
      };

      reader.readAsArrayBuffer(audioBlob);
    });
  }

  // Process audio file with speech recognition
  processAudioFile(audioBlob, store, resultCallback) {
    if (!audioBlob || audioBlob.size === 0) {
      Setting.showMessage("error", "No audio data was captured. Please try again.");
      return;
    }
    this.remoteProvider.processWithCloud(audioBlob, store, resultCallback);
  }

  // Clean up resources
  cleanup() {
    this.browserProvider.cleanup();
    this.remoteProvider.cleanup();
    this.audioChunks = [];
  }
}

export default SpeechToTextHelper;

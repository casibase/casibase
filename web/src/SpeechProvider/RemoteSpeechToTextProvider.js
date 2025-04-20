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
import * as STTBackend from "../backend/SttBackend";

class RemoteSpeechToTextProvider {
  constructor(parent) {
    this.parent = parent;
    this.audioRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.mediaStream = null;
  }

  startRecording() {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        reject(new Error("Media recording is not supported in this browser."));
        return;
      }

      // Reset audio chunks before starting new recording
      this.audioChunks = [];

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,        // Force mono channel
        sampleRate: 16000,       // Request 16kHz sample rate
      };

      navigator.mediaDevices.getUserMedia({audio: audioConstraints})
        .then(stream => {
          // Store the media stream for proper cleanup
          this.mediaStream = stream;

          // Find best supported format
          let options;
          const mimeTypes = [
            "audio/wav",
            "audio/webm;codecs=pcm",
            "audio/webm;codecs=opus",
            "audio/webm",
          ];

          for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
              options = {mimeType: type};
              break;
            }
          }

          // Create the media recorder with the best available options
          try {
            this.audioRecorder = options ?
              new MediaRecorder(stream, options) :
              new MediaRecorder(stream);
          } catch (e) {
            this.audioRecorder = new MediaRecorder(stream);
          }

          this.audioRecorder.addEventListener("dataavailable", event => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
              // Make sure parent also has access to the chunks
              this.parent.audioChunks = this.audioChunks;
            }
          });

          this.audioRecorder.addEventListener("stop", () => {
            if (this.audioChunks.length === 0 || !this.audioChunks.some(chunk => chunk.size > 0)) {
              reject(new Error("No audio data was captured during recording."));
              return;
            }

            const mimeType = this.audioChunks[0].type || this.audioRecorder.mimeType || "audio/webm";
            const audioBlob = new Blob(this.audioChunks, {type: mimeType});
            resolve(audioBlob);
          });

          // Add error handler for the MediaRecorder
          this.audioRecorder.addEventListener("error", error => {
            reject(error);
          });

          this.audioRecorder.start(100); // Collect data in 100ms chunks for better performance
          this.isRecording = true;
          this.parent.isRecording = true;
        })
        .catch(error => {
          reject(error);
          Setting.showMessage("error", `Microphone access error: ${error.message}`);
        });
    });
  }

  stopRecording() {
    if (this.audioRecorder && this.isRecording) {
      try {
        this.audioRecorder.stop();
        this.isRecording = false;
        this.parent.isRecording = false;

        // Release the media stream if it exists
        this._releaseMediaStream();

        return true;
      } catch (error) {
        this.isRecording = false;
        this.parent.isRecording = false;
        this.audioRecorder = null;

        // Release the media stream on error too
        this._releaseMediaStream();

        return false;
      }
    }
    return false;
  }

  _releaseMediaStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  processWithCloud(audioBlob, store, resultCallback) {
    // First convert to WAV format for server processing
    this.parent.convertToWav(audioBlob)
      .then(wavBlob => {
        const storeId = `${store.owner}/${store.name}`;
        return STTBackend.processSpeechToText(storeId, wavBlob);
      })
      .then(result => {
        if (result.status === "ok" && result.data) {
          // Get the actual text from the result
          const transcriptText = typeof result.data === "string" ? result.data :
            (result.data.text ? result.data.text : JSON.stringify(result.data));

          // Create a synthetic event similar to SpeechRecognition result
          const syntheticEvent = {
            results: [[{
              transcript: transcriptText,
              confidence: 1.0,
            }]],
            isFinal: true,
          };

          if (resultCallback && typeof resultCallback === "function") {
            try {
              resultCallback(syntheticEvent);
              Setting.showMessage("success", "Speech recognition completed");
            } catch (callbackError) {
              Setting.showMessage("error", "Error displaying speech recognition result");
            }
          } else {
            Setting.showMessage("error", "Cannot display speech recognition result");
          }
        } else {
          throw new Error(result.msg || "Speech-to-text processing failed");
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Cloud speech-to-text failed: ${error.message}. Falling back to browser recognition.`);
      });
  }

  cleanup() {
    this.stopRecording();
    this.audioChunks = [];
  }
}

export default RemoteSpeechToTextProvider;

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
import {showMessage} from "../Setting";

class BrowserSpeechToTextProvider {
  constructor(parent) {
    this.parent = parent;
    this.recognition = null;
    this.lastCallback = null;  // Store the callback for use when stopping
  }

  initBrowserRecognition(resultCallback) {
    // Initialize Web Speech API recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Setting.showMessage("error", "Speech recognition is not supported in this browser.");
      return null;
    }

    // Clean up any existing recognition instance before creating a new one
    if (this.recognition) {
      this.stopRecognition();
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = Setting.getLanguage();

    // Store the callback for use when stopping
    this.lastCallback = resultCallback;

    this.recognition.onresult = (event) => {
      if (resultCallback && typeof resultCallback === "function") {
        // Check if the last result is final
        const results = event.results;
        const lastResult = results[results.length - 1];
        const isFinal = lastResult.isFinal;

        // Create a modified event with isFinal flag
        const modifiedEvent = {
          results: event.results,
          isFinal: isFinal,
        };

        resultCallback(modifiedEvent);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        Setting.showMessage("error", `Speech recognition error: ${event.error}`);
      }
    };

    try {
      this.recognition.start();
      return this.recognition;
    } catch (error) {
      Setting.showMessage("error", `Failed to start speech recognition: ${error.message}`);
      this.recognition = null;
      return null;
    }
  }

  stopRecognition() {
    if (this.recognition) {
      try {
        // Before aborting, collect any existing results and send a final synthetic event
        if (this.recognition.results && this.recognition.results.length > 0 && this.lastCallback) {
          const transcript = this._collectTranscript(this.recognition.results);

          if (transcript && transcript.trim() !== "") {
            // Only send if we have actual text
            const finalEvent = {
              results: [[{
                transcript: transcript,
                confidence: 0.9,
              }]],
              isFinal: true,
            };

            // Call the callback with our synthetic final result
            this.lastCallback(finalEvent);

            // Clear the stored callback
            this.lastCallback = null;
          }
        }

        // Now abort the recognition
        this.recognition.abort();
      } catch (error) {
        showMessage("error", `Error stopping speech recognition: ${error.message}`);
      }

      this.recognition = null;
    }
  }

  // Helper method to collect transcript from recognition results
  _collectTranscript(results) {
    let transcript = "";

    try {
      // Convert recognition results to transcript text
      for (let i = 0; i < results.length; i++) {
        // Take the most confident alternative from each result
        if (results[i][0] && results[i][0].transcript) {
          transcript += results[i][0].transcript + " ";
        }
      }
    } catch (error) {
      showMessage("error", `Error collecting transcript: ${error.message}`);
    }

    return transcript.trim();
  }

  cleanup() {
    this.stopRecognition();
    this.lastCallback = null;
  }
}

export default BrowserSpeechToTextProvider;

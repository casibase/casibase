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

export class SuggestionCarrier {
  constructor() {
    this.divider = "|||";
  }

  parseAnswerAndSuggestions = (answer) => {
    const parts = answer.split(this.divider);
    const suggestionTexts = parts.slice(1);

    const suggestions = suggestionTexts.map(text => {
      return {
        text: text,
        isHit: false,
      };
    });

    return {
      finalAnswer: parts[0],
      suggestionArray: suggestions,
    };
  };
}

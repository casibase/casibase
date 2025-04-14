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

export class TitleCarrier {
  constructor(needTitle) {
    this.needTitle = needTitle;
    this.divider = "=====";
  }

  parseAnswerAndTitle = (answer) => {
    if (!this.needTitle) {
      return {parsedAnswer: answer, title: ""};
    }
    const parts = answer.split(this.divider);
    if (parts.length < 2) {
      return {parsedAnswer: answer, title: ""};
    }

    const parsedAnswer = parts[0];
    const title = parts[1];

    return {
      parsedAnswer,
      title: title,
    };
  };
}

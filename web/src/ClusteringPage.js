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

import React from "react";
import * as Conf from "./Conf";
import * as WordsetBackend from "./backend/WordsetBackend";
import WordsetGraph from "./WordsetGraph";
import * as Setting from "./Setting";

class ClusteringPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordset: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getWordset();
  }

  getWordset() {
    WordsetBackend.getWordset(Conf.DefaultOwner, Conf.DefaultWordsetName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({wordset: res.data});
        } else {
          Setting.showMessage("error", `Failed to get wordset: ${res.msg}`);
        }
      });
  }

  render() {
    return (this.state.wordset === undefined || this.state.wordset === null) ? null : (
      <WordsetGraph wordset={this.state.wordset} wordsetName={this.state.wordset.name} />
    );
  }
}

export default ClusteringPage;

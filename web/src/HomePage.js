// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import FileTreePage from "./FileTreePage";
import {Redirect} from "react-router-dom";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      store: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getStore();
  }

  getStore() {
    StoreBackend.getStore("admin", "_casibase_default_store_")
      .then((res) => {
        if (res.status === "ok") {
          if (res.data2 !== null && res.data2.includes("error")) {
            res.data.error = res.data2;
          }

          this.setState({
            store: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get store: ${res.msg}`);
        }
      });
  }

  render() {
    if (this.props.account.tag === "Video") {
      return <Redirect to="/videos" />;
    } else {
      if (this.state.store === null) {
        return null;
      } else {
        return <FileTreePage account={this.props.account} storeName={this.state.store.name} />;
      }
    }
  }
}

export default HomePage;

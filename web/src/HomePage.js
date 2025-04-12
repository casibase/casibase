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
import FileTreePage from "./FileTreePage";
import {Redirect} from "react-router-dom";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import ChatPage from "./ChatPage";
import UsagePage from "./UsagePage";

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
          if (res.data && typeof res.data2 === "string" && res.data2 !== "") {
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
    if (Setting.isAnonymousUser(this.props.account) || Setting.isChatUser(this.props.account) || Setting.getUrlParam("isRaw") !== null) {
      if (!this.props.account) {
        return null;
      }

      return (
        <ChatPage account={this.props.account} />
      );
    }

    if (this.props.account?.tag === "Video") {
      return <Redirect to="/videos" />;
    } else {
      if (this.state.store === null) {
        return null;
      } else {
        if (this.props.account.name === "admin" || this.props.account.type === "chat-admin") {
          return <UsagePage account={this.props.account} />;
        }

        return <FileTreePage account={this.props.account} storeName={this.state.store.name} />;
      }
    }
  }
}

export default HomePage;

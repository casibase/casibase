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
import {Button, Result} from "antd";
import i18next from "i18next";

class BaseListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      data: [],
      loading: false,
      searchText: "",
      searchedColumn: "",
      isAuthorized: true,
    };
  }

  render() {
    if (!this.state.isAuthorized) {
      return (
        <Result
          status="403"
          title="403 Unauthorized"
          subTitle={i18next.t("general:Sorry, you do not have permission to access this page or logged in status invalid.")}
          extra={<a href="/"><Button type="primary">{i18next.t("general:Back Home")}</Button></a>}
        />
      );
    }

    return (
      <div>
        {
          this.renderTable(this.state.data)
        }
      </div>
    );
  }
}

export default BaseListPage;

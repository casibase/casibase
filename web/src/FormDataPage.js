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

import React, {Component} from "react";
import {Spin} from "antd";
import * as Setting from "./Setting";
import * as FormBackend from "./backend/FormBackend";
import i18next from "i18next";
import FormDataTablePage from "./FormDataTablePage";

class FormDataPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      formName: props.match.params.formName,
      form: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getForm();
  }

  getForm() {
    FormBackend.getForm(this.props.account.name, this.state.formName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            form: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  render(record) {
    if (!this.state.form) {
      return (
        <div className="App">
          <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
        </div>
      );
    }

    if (this.state.form.type === "Table" || this.state.form.type === "") {
      return <FormDataTablePage {...this.props} />;
    } else if (this.state.form.type === "iFrame") {
      return (
        <iframe id="formData" title="formData" src={this.state.form.url} style={{width: "100%", height: "calc(100vh - 134px)"}} scrolling="no" />
      );
    } else {
      return `Unsupported form type: ${this.state.form.type}`;
    }
  }
}

export default FormDataPage;

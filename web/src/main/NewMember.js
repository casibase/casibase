// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import { withRouter, Link } from "react-router-dom";
import * as Setting from "../Setting";
import * as MemberBackend from "../backend/MemberBackend";
import "./const";
import Select2 from "react-select2-wrapper";
import { Area_Code } from "./const";
import i18next from "i18next";

class NewMember extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {},
      message: "",
    };
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  addMember() {
    if (this.state.form.areaCode === undefined) {
      this.updateFormField("areaCode", Area_Code[0].value);
    }

    if (this.state.form.id === "" || this.state.form.id === undefined) {
      this.setState({
        message: "Please input username",
      });
      return;
    }
    if (
      this.state.form.password === "" ||
      this.state.form.password === undefined
    ) {
      this.setState({
        message: "Please input password",
      });
      return;
    }

    MemberBackend.addMember(this.state.form).then((res) => {
      console.log(res);
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("member:Add member information sucess"),
        });
      } else if (res.status === "fail") {
        this.setState({
          message: i18next.t("error:Unauthorized"),
        });
      } else if (res.status === "error") {
        this.setState({
          message: i18next.t("error:Add new member error"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  getIndexFromAreaCode(value) {
    for (let i = 0; i < Area_Code.length; i++) {
      if (Area_Code[i].value === value) {
        return i;
      }
    }

    return -1;
  }

  render() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          <Link to="/admin/member">
            {i18next.t("member:Member management")}
          </Link>
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          {i18next.t("member:Add new member")}
        </div>
        <div className="inner">
          {this.state.message !== "" ? (
            <div className="message" onClick={() => this.clearMessage()}>
              <li className="fa fa-exclamation-triangle"></li>
              &nbsp; {this.state.message}
            </div>
          ) : null}
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Username")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="id"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("id", event.target.value)
                    }
                    autoComplete="off"
                  />
                  <span className="negative"> *</span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Password")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="password"
                    className="sl"
                    name="password"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("password", event.target.value)
                    }
                    autoComplete="off"
                  />
                  <span className="negative"> *</span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Email")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="email"
                    onChange={(event) =>
                      this.updateFormField("email", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="company"
                    onChange={(event) =>
                      this.updateFormField("company", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company title")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="companyTitle"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("companyTitle", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Location")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="location"
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("location", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" valign="top">
                  <div className="sep5"></div>
                  {i18next.t("signup:Area code")}
                </td>
                <td width="auto" align="left">
                  <Select2
                    value={this.getIndexFromAreaCode(this.state.form.areaCode)}
                    style={{
                      width: Setting.PcBrowser ? "300px" : "200px",
                      fontSize: "14px",
                    }}
                    data={Area_Code.map((code, i) => {
                      return { text: `${code.label}`, id: i };
                    })}
                    onSelect={(event) => {
                      const s = event.target.value;
                      if (s === null) {
                        return;
                      }

                      const index = parseInt(s);
                      const codeValue = Area_Code[index].value;
                      this.updateFormField("areaCode", codeValue);
                    }}
                    options={{
                      placeholder: i18next.t(
                        "signup:Please select a area code"
                      ),
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Phone")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="location"
                    maxLength="11"
                    onChange={(event) =>
                      this.updateFormField("phone", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left">
                  <input
                    type="submit"
                    className="super normal button"
                    value={i18next.t("member:Save")}
                    onClick={() => this.addMember()}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(NewMember);

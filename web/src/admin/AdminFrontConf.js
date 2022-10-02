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
import {Link, withRouter} from "react-router-dom";
import * as Setting from "../Setting";
import i18next from "i18next";
import * as ConfBackend from "../backend/ConfBackend";

class AdminFrontConf extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      Management_LIST: [{label: "Visual Conf", value: "visualConf"}],
      field: "visualConf",
      conf: [
        {id: "forumName", value: ""},
        {id: "logoImage", value: ""},
        {id: "signinBoxStrong", value: ""},
        {id: "signinBoxSpan", value: ""},
        {id: "footerAdvise", value: ""},
        {id: "footerDeclaration", value: ""},
        {id: "footerLogoImage", value: ""},
        {id: "footerLogoUrl", value: ""},
      ],
      form: {},
      changeForm: {},
      message: "",
      memberId: props.match.params.memberId,
    };
    this.state.url = "/admin/frontconf";
  }

  componentDidMount() {
    this.getFrontConf(this.state.field);
  }

  changeField(field) {
    this.setState(
      {
        field: field,
      },
      () => {
        this.getFrontConf(this.state.field);
      }
    );
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.field === item.value ? "tab_current" : "tab"} onClick={() => this.changeField(item.value)}>
        {item.label}
      </a>
    );
  }

  getFrontConf(field) {
    ConfBackend.getFrontConfsByField(field).then((res) => {
      const form = this.state.form;
      const conf = this.state.conf;
      for (const k in res.data) {
        form[res.data[k].id] = res.data[k].value;
      }
      for (const i in conf) {
        conf[i].value = form[conf[i].id];
      }
      this.setState({
        conf: conf,
        form: form,
      });
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  inputChange(event, id) {
    event.target.style.height = event.target.scrollHeight + "px";
    const forms = this.state.changeForm;
    const form = this.state.form;
    form[id] = event.target.value;
    forms[id] = event.target.value;
    this.setState({
      form: form,
      changeForm: forms,
    });
  }

  updateConf() {
    const confs = [];
    for (const k in this.state.changeForm) {
      confs.push({id: k, value: this.state.changeForm[k], field: this.state.field});
    }

    ConfBackend.updateFrontConfsByField(this.state.field, confs).then((res) => {
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("poster:Update frontconf information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  updateConfToDefault() {
    ConfBackend.restoreFrontConfs(this.state.field).then((res) => {
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("poster:Update frontconf information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
      window.location.reload();
    });
  }

  convert(s) {
    let str;
    switch (s) {
      case "forumName":
        str = i18next.t("frontConf:Forum name");
        break;
      case "logoImage":
        str = i18next.t("frontConf:Logo image");
        break;
      case "footerLogoImage":
        str = i18next.t("frontConf:Footer Logo image");
        break;
      case "footerLogoUrl":
        str = i18next.t("frontConf:Footer Logo URL");
        break;
      case "signinBoxStrong":
        str = i18next.t("frontConf:Right title");
        break;
      case "signinBoxSpan":
        str = i18next.t("frontConf:Right subtitle");
        break;
      case "footerDeclaration":
        str = i18next.t("frontConf:Footer title");
        break;
      case "footerAdvise":
        str = i18next.t("frontConf:Footer subtitle");
        break;
    }
    return str;
  }

  render() {
    return (
      <div>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("admin:FrontConf management")}
          </div>
          <div className="cell">
            {this.state.Management_LIST.map((item) => {
              return this.renderManagementList(item);
            })}
          </div>
        </div>
        <div className="box">
          {this.state.message !== "" ? (
            <div className="message" onClick={() => this.clearMessage()}>
              <li className="fa fa-exclamation-triangle"></li>
              &nbsp; {this.state.message}
            </div>
          ) : null}
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                {this.state.conf.map((item) => {
                  return (
                    <tr key={item.id}>
                      <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                        {this.convert(item.id)}
                      </td>
                      <td width="auto" align="left">
                        <textarea rows="1" style={{width: "80%"}} value={this.state.form[item.id]} onChange={(event) => this.inputChange(event, item.id)} />
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right"></td>
                  <td width="auto" align="left">
                    <input type="submit" className="super normal button" value={i18next.t("frontConf:Save")} onClick={() => this.updateConf()} />
                    &emsp;&emsp;&emsp;&emsp;
                    <input type="button" className="super normal button" value={i18next.t("frontConf:Reset")} onClick={() => this.updateConfToDefault()} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(AdminFrontConf);

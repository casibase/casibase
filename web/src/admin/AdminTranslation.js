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
import * as TranslatorBackend from "../backend/TranslatorBackend";
import * as Setting from "../Setting";
import i18next from "i18next";
import Select2 from "react-select2-wrapper";

class AdminTranslation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "",
      errMessage: "",
      translators: [],
      apis: ["Google"],
      form: {
        id: "",
        name: "",
        translator: "",
        key: "",
        enable: false,
        visible: false,
      },
      event: "config",
      Management_LIST: [
        {label: "Config Translator", value: "config"},
        {label: "Create", value: "create"},
        {label: "Manage", value: "manage"},
      ],
      color: "",
      backgroundColor: "",
      displayColorPicker: false,
      displayBackgroundColorPicker: false,
    };
    this.state.url = "/admin/translation";
  }

  getAll() {
    TranslatorBackend.getTranslator().then((res) => {
      this.setState(
        {
          translators: res,
        },
        () => {
          this.getEnableFromList(this.state.translators);
        }
      );
    });
  }

  getEnableFromList(translatorArray) {
    if (translatorArray) {
      translatorArray.forEach((item) => {
        if (item.enable) {
          this.setState({
            form: item,
          });
        }
      });
    }
  }

  renderSelectPlatform() {
    if (this.state.translators === null) {
      return;
    }

    return (
      <Select2
        value={this.getIndexFromTranslatorId(this.state.form.id)}
        style={{
          width: Setting.PcBrowser ? "300px" : "200px",
          fontSize: "14px",
        }}
        data={this.state.translators.map((translatorItem, index) => {
          return {
            text: `${translatorItem.name} / ${translatorItem.translator}`,
            id: index,
          };
        })}
        onSelect={(event) => {
          const selected = event.target.value;
          if (selected === null) {
            return;
          }

          const selectedIndex = parseInt(selected);
          this.setState({
            form: this.state.translators[selectedIndex],
          });
        }}
        options={{
          placeholder: i18next.t("translator:Please select a translator platform"),
        }}
      />
    );
  }

  renderSelectAPI() {
    if (this.state.apis === null) {
      return;
    }

    return (
      <Select2
        value={this.state.form.translator}
        style={{
          width: Setting.PcBrowser ? "300px" : "200px",
          fontSize: "14px",
        }}
        data={this.state.apis.map((apiItem) => {
          return {text: apiItem, id: apiItem};
        })}
        onSelect={(event) => {
          const selected = event.target.value;
          if (selected === null) {
            return;
          }

          this.setState((prevState) => {
            prevState.form.translator = selected;
            return prevState;
          });
        }}
        options={{
          placeholder: i18next.t("translator:Please select a translator api"),
        }}
      />
    );
  }

  getIndexFromTranslatorId(translatorId) {
    for (let i = 0; i < this.state.translators.length; i++) {
      if (this.state.translators[i].id === translatorId) {
        return i;
      }
    }

    return -1;
  }

  updateTranslator() {
    this.clearMessage();
    this.clearErrorMessage();

    if (this.state.form.id === "") {
      this.setState({
        errMessage: i18next.t("translator:Please select a translator platform"),
      });
      return;
    }

    if (this.state.form.key === "") {
      this.setState({errMessage: i18next.t("translator:Please input key")});
      return;
    }

    this.setState(
      (prevState) => {
        prevState.form.enable = true;
        return prevState;
      },
      () => {
        TranslatorBackend.updateTranslator(this.state.form).then((res) => {
          if (res.status === "ok") {
            this.setState({
              message: i18next.t("translator:Update translator information success"),
            });
          } else {
            this.setState({
              errMessage: res?.msg,
            });
          }
        });
      }
    );
  }

  addTranslator() {
    this.clearMessage();
    this.clearErrorMessage();

    this.setState((prevState) => {
      prevState.form.enable = false;
      return prevState;
    });

    if (this.state.form.id === "") {
      this.setState({errMessage: i18next.t("translator:Please input id")});
      return;
    }

    if (this.state.form.name === "") {
      this.setState({errMessage: i18next.t("translator:Please input name")});
      return;
    }

    if (this.state.form.translator === "") {
      this.setState({
        errMessage: i18next.t("translator:Please select a translator api"),
      });
      return;
    }

    if (this.state.form.key === "") {
      this.setState({errMessage: i18next.t("translator:Please input key")});
      return;
    }

    TranslatorBackend.addTranslator(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("translator:Add translator information success"),
        });
      } else {
        this.setState({
          errMessage: i18next.t(`error:${res?.msg}`),
        });
      }
    });
  }

  deleteTranslator(translator) {
    if (window.confirm(`${i18next.t("translator:Are you sure to delete translator")} ${translator.name} ?`)) {
      if (translator.enable) {
        alert(i18next.t("translator:Please disable it first"));
        return;
      }
      TranslatorBackend.delTranslator(translator.id).then((res) => {
        if (res.status === "ok") {
          this.setState({
            message: i18next.t("translator:Delete translator success"),
          });

          this.setState({
            translators: this.state.translators.reduce((total, current) => {
              current.id !== translator.id && total.push(current);
              return total;
            }, []),
          });
        } else {
          this.setState({
            errMessage: i18next.t(`error:${res?.msg}`),
          });
        }
      });
    }
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  clearErrorMessage() {
    this.setState({
      errMessage: "",
    });
  }

  changeEvent(event) {
    switch (event) {
      case "config":
        this.getAll();
        break;
      case "create":
        this.setState({
          form: {
            id: "",
            name: "",
            translator: "",
            key: "",
            enable: false,
            visible: false,
          },
        });
        break;
      case "manage":
        this.getAll();
        break;
      default:
        break;
    }

    this.setState({
      event: event,
      message: "",
      errMessage: "",
    });
  }

  renderProblem() {
    const problems = [];

    if (this.state.errMessage !== "") {
      problems.push(this.state.errMessage);
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearErrorMessage()}>
        {i18next.t("error:Please resolve the following issues before submitting")}
        <ul>
          {problems.map((problem, i) => {
            return <li key={i}>{problem}</li>;
          })}
        </ul>
      </div>
    );
  }

  componentDidMount() {
    this.getAll();
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.event === item.value ? "tab_current" : "tab"} onClick={() => this.changeEvent(item.value)}>
        {i18next.t(`translator:${item.label}`)}
      </a>
    );
  }

  renderTranslators(translator) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "60" : "auto"} align="left">
                <span>{translator?.id}</span>
              </td>
              <td width={pcBrowser ? "200" : "auto"} align="center">
                <span>{translator?.name}</span>
              </td>
              <td width={pcBrowser ? "200" : "auto"} align="center">
                <span>{translator?.translator}</span>
              </td>
              <td width={pcBrowser ? "200" : "auto"} align="center">
                {translator?.enable ? <span className="positive">{i18next.t("translator:Enable")}</span> : <span className="gray">{i18next.t("translator:Disable")}</span>}
              </td>
              <td>
                <a onClick={() => this.deleteTranslator(translator)}>{i18next.t("translator:Delete")}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderFormBox(form) {
    return (
      <div>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("translator:Translator management")}
          </div>
          <div className="cell">
            {this.state.Management_LIST.map((item) => {
              return this.renderManagementList(item);
            })}
          </div>
          {form}
        </div>
      </div>
    );
  }

  render() {
    switch (this.state.event) {
      case "config":
        return this.renderFormBox(
          <div className="box">
            {this.renderProblem()}
            {this.state.message !== "" ? (
              <div className="message" onClick={() => this.clearMessage()}>
                <li className="fa fa-exclamation-triangle" />
                &nbsp; {this.state.message}
              </div>
            ) : null}
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Translation Platform")}
                    </td>
                    <td width="auto" align="left">
                      {this.renderSelectPlatform()}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Key")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        onChange={(event) => {
                          const targetVal = event.target.value;
                          this.setState((prevState) => {
                            prevState.form.key = targetVal;
                            return prevState;
                          });
                        }}
                        value={this.state.form?.key}
                        style={{width: 300}}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Visible")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        type="radio"
                        onClick={() => {
                          this.setState((prevState) => {
                            prevState.form.visible = true;
                            return prevState;
                          });
                        }}
                        checked={this.state.form?.visible}
                        name="visible"
                      />
                      {i18next.t("tab:show")}{" "}
                      <input
                        type="radio"
                        onClick={() => {
                          this.setState((prevState) => {
                            prevState.form.visible = false;
                            return prevState;
                          });
                        }}
                        checked={!this.state.form?.visible}
                        name="visible"
                      />
                      {i18next.t("tab:hidden")}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right"></td>
                    <td width="auto" align="left">
                      <input type="submit" className="super normal button" value={i18next.t("translator:Save")} onClick={() => this.updateTranslator()} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case "create":
        return this.renderFormBox(
          <div className="box">
            {this.renderProblem()}
            {this.state.message !== "" ? (
              <div className="message" onClick={() => this.clearMessage()}>
                <li className="fa fa-exclamation-triangle" />
                &nbsp; {this.state.message}
              </div>
            ) : null}
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Translation Platform ID")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        onChange={(event) => {
                          const targetVal = event.target.value;
                          this.setState((prevState) => {
                            prevState.form.id = targetVal;
                            return prevState;
                          });
                        }}
                        value={this.state.form.id}
                        style={{width: 300}}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Translation Platform Name")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        onChange={(event) => {
                          const targetVal = event.target.value;
                          this.setState((prevState) => {
                            prevState.form.name = targetVal;
                            return prevState;
                          });
                        }}
                        value={this.state.form.name}
                        style={{width: 300}}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Translation API")}
                    </td>
                    <td width="auto" align="left">
                      {this.renderSelectAPI()}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Key")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        onChange={(event) => {
                          const targetVal = event.target.value;
                          this.setState((prevState) => {
                            prevState.form.key = targetVal;
                            return prevState;
                          });
                        }}
                        value={this.state.form.key}
                        style={{width: 300}}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("translator:Visible")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        type="radio"
                        onClick={() => {
                          this.setState((prevState) => {
                            prevState.form.visible = true;
                            return prevState;
                          });
                        }}
                        checked={this.state.form.visible}
                        name="visible"
                      />
                      {i18next.t("tab:show")}{" "}
                      <input
                        type="radio"
                        onClick={() => {
                          this.setState((prevState) => {
                            prevState.form.visible = false;
                            return prevState;
                          });
                        }}
                        checked={!this.state.form.visible}
                        name="visible"
                      />
                      {i18next.t("tab:hidden")}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right"></td>
                    <td width="auto" align="left">
                      <input type="submit" className="super normal button" value={i18next.t("translator:Save")} onClick={() => this.addTranslator()} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case "manage":
        return this.renderFormBox(
          <div className="box">
            {this.renderProblem()}
            {this.state.message !== "" ? (
              <div className="message" onClick={() => this.clearMessage()}>
                <li className="fa fa-exclamation-triangle" />
                &nbsp; {this.state.message}
              </div>
            ) : null}
            <div id="all-translators">
              {this.state.translators !== null && this.state.translators.length !== 0 ? (
                this.state.translators.map((translator) => this.renderTranslators(translator))
              ) : (
                <div
                  className="cell"
                  style={{
                    textAlign: "center",
                    height: "100px",
                    lineHeight: "100px",
                  }}
                >
                  {this.state.translators === null ? i18next.t("loading:Data is loading...") : i18next.t("translator:No translator yet")}
                </div>
              )}
            </div>
          </div>
        );
    }
  }
}

export default withRouter(AdminTranslation);

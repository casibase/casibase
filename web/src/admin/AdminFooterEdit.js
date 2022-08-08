// Copyright 2022 The casbin Authors. All Rights Reserved.
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
import * as Tools from "../main/Tools";
import {Controlled as CodeMirrorsEditor} from "react-codemirror2";

class AdminFrontConf extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      content: "",
      publishClicked: false,
      id: this.props.id,
      message: "",
    };
  }

  componentDidMount() {
    this.i18nTag = `admin:${this.state?.id.charAt(0).toUpperCase() + this.state?.id.slice(1)}`;
    this.getContent(this.state.id);
    this.getFrontConf(this.state.id);
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

  getContent(id) {
    ConfBackend.getFrontConfById(id).then((res) => {
      console.log(res.data.value);
      this.setState({
        content: res.data.value,
      });
    });
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.field === item.value ? "tab_current" : "tab"} onClick={() => this.changeField(item.value)}>
        {item.label}
      </a>
    );
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  getFrontConf(id) {
    ConfBackend.getFrontConfById(id).then((res) => {
      console.log(res.data[0]);
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  updateConf() {
    this.setState({publishClicked: true});
    const confs = [];
    for (const k in this.state.changeForm) {
      confs.push({id: k, value: this.state.changeForm[k], field: this.state.field});
    }
    ConfBackend.updateFrontConfById(this.state.id, this.state.content).then((res) => {
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("poster:Update frontconf information success"),
          publishClicked: false,
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  renderEditor() {
    return (
      <div
        style={{
          overflow: "hidden",
          overflowWrap: "break-word",
          resize: "none",
          height: "auto",
        }}
        className={"mll"}
        id="reply_content"
      >
        <div className={"cm-short-content"}>
          <CodeMirrorsEditor
            editorDidMount={(editor) => Tools.attachEditor(editor)}
            onPaste={() => Tools.uploadMdFile()}
            value={this.state.content}
            onDrop={() => Tools.uploadMdFile()}
            options={{
              mode: "markdown",
              lineNumbers: false,
              lineWrapping: true,
              extraKeys: {"Ctrl-Space": "autocomplete"},
              hintOptions: {
                alignWithWord: false,
                closeOnUnfocus: false,
                closeOnBlur: false,
                className: "textcomplete-item",
              },
            }}
            onBeforeChange={(editor, data, value) => {
              this.setState({content: value});
            }}
            onChange={(editor, data, value) => {}}
          />
        </div>
      </div>
    );
  }

  render() {
    const blurStyle = {color: "#ccc", pointerEvents: "none"};

    return (
      <div>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t(this.i18nTag)}
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
            <div className={`cell ${this.props.nodeId}`}>
              <div
                style={{
                  overflow: "hidden",
                }}
              >
                {this.renderEditor()}
              </div>
              <div className="sep10" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={this.updateConf.bind(this)} type="submit" disabled={Setting.isFileUploading(this.state.content)} className="super normal button">
                  <li className={this.state.publishClicked ? "fa fa-circle-o-notch fa-spin" : "fa fa-paper-plane"} />
                  &nbsp;{this.state.publishClicked ? i18next.t("new:Publishing...") : i18next.t("frontConf:Save")}
                </button>
              </div>

              <div
                style={{
                  overflow: "hidden",
                }}
              >
                <div style={blurStyle} className="fr">
                  <div className="sep5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(AdminFrontConf);

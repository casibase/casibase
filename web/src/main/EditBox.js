// Copyright 2020 The casbin Authors. All Rights Reserved.
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
import * as Setting from "../Setting";
import { withRouter, Link } from "react-router-dom";
import * as TopicBackend from "../backend/TopicBackend";
import * as ReplyBackend from "../backend/ReplyBackend";
import { Resizable } from "re-resizable";
import { Controlled as CodeMirror } from "react-codemirror2";
import * as Tools from "./Tools";
import i18next from "i18next";

const pangu = require("pangu");

class EditBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      objectId: props.match.params.id,
      editType: props.match.params.editType,
      editObject: [],
      nodes: [],
      form: {},
    };
  }

  componentDidMount() {
    this.getEditObject();
    Setting.initOSSClient(this.props.account?.id);
  }

  initForm() {
    let form = this.state.form;
    form["id"] = this.state.editObject?.id;
    if (this.state.editType === "topic") {
      form["title"] = this.state.editObject?.title;
      form["nodeId"] = this.state.editObject?.nodeId;
    }
    form["content"] = this.state.editObject?.content;
    this.setState({
      form: form,
    });
  }

  editContent() {
    if (this.state.editType === "topic") {
      TopicBackend.editTopicContent(this.state.form).then((res) => {
        if (res.status === "ok") {
          this.props.history.push(`/t/${this.state.editObject?.id}`);
        } else {
          Setting.showMessage("error", res?.msg);
        }
      });
      return;
    }
    ReplyBackend.editReplyContent(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(
          `/t/${this.state.editObject?.topicId}#r_${this.state.editObject?.id}`
        );
      } else {
        Setting.showMessage("error", res?.msg);
      }
    });
  }

  getEditObject() {
    if (this.state.editType === "topic") {
      TopicBackend.getTopic(this.state.objectId).then((res) => {
        this.setState(
          {
            editObject: res,
          },
          () => {
            this.initForm();
          }
        );
      });
      return;
    }
    ReplyBackend.getReplyWithDetails(this.state.objectId).then((res) => {
      this.setState(
        {
          editObject: res,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  editor() {
    return (
      <CodeMirror
        editorDidMount={(editor) => Tools.attachEditor(editor)}
        onPaste={() => Tools.uploadMdFile()}
        value={this.state.form.content}
        onDrop={() => Tools.uploadMdFile()}
        options={{ mode: "markdown", lineNumbers: false, lineWrapping: true }}
        onBeforeChange={(editor, data, value) => {
          this.updateFormField("content", value);
        }}
        onChange={(editor, data, value) => {}}
      />
    );
  }

  render() {
    if (this.state.editObject !== null && this.state.editObject.length === 0) {
      return (
        <div class="box">
          <div class="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span class="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("loading:Content loading")}
          </div>
          <div class="cell">
            <span class="gray bigger">
              {i18next.t("loading:Please wait patiently...")}
            </span>
          </div>
        </div>
      );
    }

    if (this.state.editObject === null || !this.state.editObject?.editable) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("edit:Edit content")}
          </div>
          <div className="inner">
            {i18next.t("edit:You cannot edit this content.")}
          </div>
        </div>
      );
    }

    if (this.state.editType === "reply") {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("edit:Edit reply")}
          </div>
          <div className="cell">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td>
                    <div
                      style={{
                        overflow: "hidden",
                        overflowWrap: "break-word",
                        resize: "none",
                        height: "320",
                      }}
                      name="content"
                      className="mle tall"
                      id="reply_content"
                    >
                      <Resizable
                        enable={false}
                        defaultSize={{
                          width: 730,
                          height: 310,
                        }}
                      >
                        {this.editor()}
                      </Resizable>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="submit"
                      value={i18next.t("edit:Save")}
                      className="super normal button"
                      onClick={() => this.editContent()}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return (
      <div class="box">
        <div class="header">
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span class="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/go/${this.state.editObject?.nodeId}`}>
            {" "}
            {this.state.editObject?.nodeName}
          </Link>{" "}
          <span class="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/t/${this.state.editObject?.id}`}>
            {" "}
            {pangu.spacing(this.state.editObject?.title)}
          </Link>{" "}
          <span class="chevron">&nbsp;›&nbsp;</span>{" "}
          {i18next.t("edit:Edit topic")}
        </div>
        <div class="cell">
          <table cellpadding="5" cellspacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td>
                  <textarea
                    type="text"
                    maxLength="120"
                    name="title"
                    class="mle"
                    name="title"
                    value={this.state.form.title}
                    onChange={(event) => {
                      this.updateFormField("title", event.target.value);
                    }}
                  ></textarea>
                </td>
              </tr>
              <tr>
                <td>
                  <div
                    style={{
                      overflow: "hidden",
                      overflowWrap: "break-word",
                      resize: "none",
                      height: "320",
                    }}
                    name="content"
                    class="mle tall"
                    id="topic_content"
                  >
                    <Resizable
                      enable={false}
                      defaultSize={{
                        width: 730,
                        height: 310,
                      }}
                    >
                      {this.editor()}
                    </Resizable>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <input
                    type="submit"
                    value={i18next.t("edit:Save")}
                    class="super normal button"
                    onClick={() => this.editContent()}
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

export default withRouter(EditBox);

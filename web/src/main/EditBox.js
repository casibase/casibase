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
import {Link, withRouter} from "react-router-dom";
import * as TopicBackend from "../backend/TopicBackend";
import * as ReplyBackend from "../backend/ReplyBackend";
import {Controlled as CodeMirror} from "react-codemirror2";
import TagsInput from "react-tagsinput";
import "../tagsInput.css";
import * as Tools from "./Tools";
import i18next from "i18next";
import Editor from "./richTextEditor";
import Select2 from "react-select2-wrapper";
import * as Conf from "../Conf";

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
      tags: [],
      form: {},
      editor: [
        {
          text: i18next.t("new:Markdown"),
          id: 0,
        },
        {
          text: i18next.t("new:RichText"),
          id: 1,
        },
      ],
      placeholder: "",
    };
  }

  componentDidMount() {
    this.getEditObject();
  }

  initForm() {
    const form = this.state.form;
    form["id"] = this.state.editObject?.id;
    if (this.state.editType === "topic") {
      form["title"] = this.state.editObject?.title;
      form["nodeId"] = this.state.editObject?.nodeId;
      if (this.state.editObject?.tags != null) {
        this.setState({
          tags: this.state.editObject?.tags,
        });
      }
    }
    form["content"] = this.state.editObject?.content;
    form["editorType"] = this.state.editObject?.editorType;
    this.setState({
      form: form,
      placeholder: i18next.t(`new:${this.state.editObject?.editorType}`),
    });
  }

  handleChange(tags) {
    this.updateFormField("tags", tags);
    this.setState({
      tags: tags,
    });
  }

  editContent() {
    // topic
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
    // reply
    ReplyBackend.editReplyContent(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(`/t/${this.state.editObject?.topicId}#r_${this.state.editObject?.id}`);
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
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  renderEditorSelect() {
    return (
      <div>
        {i18next.t("new:Switch editor")}
        &nbsp;{" "}
        <Select2
          value={this.state.form.editorType}
          style={{width: "110px", fontSize: "14px"}}
          data={this.state.editor.map((node, i) => {
            return {text: `${node.text}`, id: i};
          })}
          onSelect={(event) => {
            const s = event.target.value;
            if (s === null) {
              return;
            }
            const index = parseInt(s);
            if (index === 0) {
              this.updateFormField("editorType", "markdown");
              this.setState({
                placeholder: i18next.t("new:Markdown"),
              });
            } else {
              this.updateFormField("editorType", "richtext");
              this.setState({
                placeholder: i18next.t("new:RichText"),
              });
            }
          }}
          options={{placeholder: this.state.placeholder}}
        />
      </div>
    );
  }

  renderEditor() {
    if (!this.state.form.editorType || this.state.form.editorType === "markdown") {
      return (
        <div
          style={{
            overflow: "hidden",
            overflowWrap: "break-word",
            resize: "none",
            height: "auto",
            minHeight: "320px",
          }}
          name="content"
          className="mle tall"
          id="reply_content"
        >
          <div className={"cm-long-content"}>
            <CodeMirror
              editorDidMount={(editor) => Tools.attachEditor(editor)}
              onPaste={() => Tools.uploadMdFile()}
              value={this.state.form.content}
              onDrop={() => Tools.uploadMdFile()}
              options={{
                mode: "markdown",
                lineNumbers: false,
                lineWrapping: true,
              }}
              onBeforeChange={(editor, data, value) => {
                this.updateFormField("content", value);
              }}
              onChange={(editor, data, value) => {}}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div
          style={{
            overflow: "hidden",
            overflowWrap: "break-word",
            resize: "none",
            minHeight: "172",
            height: "auto",
          }}
          name="content"
          className="mle"
          id="reply_content"
        >
          <Editor
            defaultValue={this.state.form.content}
            language={i18next.language}
            height="auto"
            id="richTextEditor"
            onBeforeChange={(value) => {
              this.updateFormField("content", value);
            }}
          />
        </div>
      );
    }
  }

  render() {
    if (this.state.editObject !== null && this.state.editObject.length === 0) {
      if (!Conf.ShowLoadingIndicator) {
        return null;
      }

      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Content loading")}
          </div>
          <div className="cell">
            <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
          </div>
        </div>
      );
    }

    if (this.state.editObject === null || !this.state.editObject?.editable) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("edit:Edit content")}
          </div>
          <div className="inner">{i18next.t("edit:You cannot edit this content.")}</div>
        </div>
      );
    }

    if (this.state.editType === "reply") {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("edit:Edit reply")}
          </div>
          <div className="cell">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td>{this.renderEditor()}</td>
                </tr>
                <tr>
                  <td style={{display: "flex", justifyContent: "space-between"}}>
                    <div>
                      <input type="submit" value={i18next.t("edit:Save")} disabled={Setting.isFileUploading(this.state.form.content)} className="super normal button" onClick={() => this.editContent()} />
                    </div>
                    {this.renderEditorSelect()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/go/${encodeURIComponent(this.state.editObject?.nodeId)}`}> {this.state.editObject?.nodeName}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/t/${this.state.editObject?.id}`}> {pangu.spacing(this.state.editObject?.title)}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("edit:Edit topic")}
          {/* todo */}
        </div>
        <div className="cell">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td>
                  <textarea
                    type="text"
                    maxLength="120"
                    className="mle"
                    name="title"
                    value={this.state.form.title}
                    onChange={(event) => {
                      this.updateFormField("title", event.target.value);
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td>{this.renderEditor()}</td>
              </tr>
              <tr>
                <TagsInput
                  inputProps={{
                    maxLength: "8",
                    placeholder: "After adding tags press Enter,only add up to four tags,the length of each tag is up to 8",
                  }}
                  maxTags="4"
                  value={this.state.tags}
                  onChange={this.handleChange.bind(this)}
                />
                <td style={{display: "flex", justifyContent: "space-between"}}>
                  <div>
                    <input type="submit" value={i18next.t("edit:Save")} disabled={Setting.isFileUploading(this.state.form.content)} className="super normal button" onClick={() => this.editContent()} />
                  </div>
                  {this.renderEditorSelect()}
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

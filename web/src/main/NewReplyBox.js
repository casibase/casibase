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
import * as MemberBackend from "../backend/MemberBackend";
import * as ReplyBackend from "../backend/ReplyBackend";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import {Link, withRouter} from "react-router-dom";
import "../Reply.css";
import * as Tools from "./Tools";
import "../codemirrorSize.css";
import "../node.css";
import "./node-casbin.css";
import * as CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "./show-hint.css";
import {Controlled as CodeMirrorsEditor} from "react-codemirror2";
import i18next from "i18next";
import Editor from "./richTextEditor";
import Select2 from "react-select2-wrapper";
import * as Conf from "../Conf";

class NewReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: null,
      form: {},
      isTypingStarted: false,
      problem: [],
      message: null,
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
      publishClicked: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.synonyms = this.synonyms.bind(this);
  }

  UNSAFE_componentWillMount() {
    MemberBackend.getMemberEditorType().then((res) => {
      const editorType = res.data ? res.data : Conf.DefaultEditorType;
      this.updateFormField("editorType", editorType);
      this.setState({
        placeholder: i18next.t(`new:${this.state.form.editorType}`),
      });
    });
  }

  backToTop() {
    Setting.scrollToTop();
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  isOkToSubmit() {
    if (!this.state.isTypingStarted) {
      return false;
    }

    const problems = [];
    if (this.state.form.content === "") {
      problems.push(i18next.t("error:Reply content cannot be empty"));
    }

    return problems.length === 0;
  }

  renderProblem() {
    if (!this.state.isTypingStarted) {
      return null;
    }

    const problems = [];
    if (this.state.form.content === "") {
      problems.push(i18next.t("error:Reply content cannot be empty"));
    }

    if (this.state.message !== null) {
      problems.push(i18next.t(`error:${this.state.message}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem">
        {i18next.t("reply:Please resolve the following issues before submitting")}
        <ul>
          {problems.map((problem, i) => {
            return <li key={i}>{problem}</li>;
          })}
        </ul>
      </div>
    );
  }

  publishReply() {
    const editorType = this.state.form.editorType;
    if ((!editorType || editorType === "markdown") && this.props.content !== undefined) {
      this.updateFormField("content", this.props.content);
    }
    if (!this.isOkToSubmit()) {
      return;
    }
    if (this.state.publishClicked) {
      return;
    }
    this.setState({
      publishClicked: true,
    });
    this.updateFormField("parentId", this.props.parent.id);

    this.updateFormField("topicId", this.props.topic?.id);
    ReplyBackend.addReply(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.onReplyChange("");
        this.props.refreshReplies();
        this.props.cancelReply();
        this.setState({
          form: {},
          publishClicked: false,
        });
        Setting.scrollToBottom();
        this.props.refreshAccount();
      } else {
        this.setState({
          message: res.msg,
          publishClicked: false,
        });
      }
    });

    if (this.props.topic) {
      FavoritesBackend.addFavorites(this.props.topic.id, "subscribe_topic").then((res) => {
        if (res.status === "ok") {
          this.props.refreshAccount();
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
    }
  }

  handleChange(editor, value) {
    this.props.onReplyChange(value);
    this.updateFormField("content", this.props.content);
    if (this.state.message !== null) {
      this.setState({
        message: null,
      });
    }
    if (value.substring(value.length - 1) === "@") {
      CodeMirror.commands.autocomplete(editor, null, {completeSingle: false});
    }
  }

  undockBox() {
    this.props.changeStickyStatus(false);
  }

  dockBox() {
    this.props.changeStickyStatus(true);
  }

  synonyms(cm, option) {
    const comp = this.props.memberList;
    const res = [];
    return new Promise(function(accept) {
      setTimeout(function() {
        const cursor = cm.getCursor(),
          line = cm.getLine(cursor.line);
        let start = cursor.ch,
          end = cursor.ch;
        while (start && line.charAt(start - 1) !== "@") {
          --start;
        }
        while (end < line.length && /\w/.test(line.charAt(end))) {
          ++end;
        }
        const word = line.slice(start, end).toLowerCase();
        for (let i = 0; i < comp.length; i++) {
          if (comp[i].includes(word)) {
            res.push(comp[i]);
          }
        }
        return accept({
          list: res,
          from: CodeMirror.Pos(cursor.line, start + 1),
          to: CodeMirror.Pos(cursor.line, end),
        });
      }, 100);
    });
  }

  renderEditor(needLogin) {
    if (needLogin) {
      if (Conf.ShowEmbedButtons) {
        return (
          <div style={{width: "100%", textAlign: "center"}}>
            <div style={{marginTop: 30, marginBottom: 30}}>
              <input
                style={{marginRight: 20}}
                onClick={() => {
                  const encodedUrl = encodeURIComponent(window.location.href);
                  localStorage.setItem("loginCallbackUrl", encodedUrl);
                  window.location.href = Setting.getSigninUrl();
                }}
                type="submit"
                value={i18next.t("reply:Sign in")}
                className="super normal button"
              />
              <input
                onClick={() => {
                  const encodedUrl = encodeURIComponent(window.location.href);
                  localStorage.setItem("loginCallbackUrl", encodedUrl);
                  window.location.href = Setting.getSignupUrl();
                }}
                type="submit"
                value={i18next.t("reply:Sign up")}
                className="super normal button"
              />
            </div>
          </div>
        );
      } else {
        return (
          <div style={{width: "100%", textAlign: "center"}}>
            <div style={{marginTop: 30, marginBottom: 30}}>
              <input
                onClick={() => {
                  const data = {
                    tag: "casnode",
                    action: "login",
                  };
                  window.parent.postMessage(data, "*");
                }}
                type="submit"
                value={i18next.t("general:Sign In to Comment")}
                className="super normal button"
              />
            </div>
          </div>
        );
      }
    }

    if (!this.state.form.editorType || this.state.form.editorType === "markdown") {
      return (
        <div
          style={{
            overflow: "hidden",
            overflowWrap: "break-word",
            resize: "none",
            height: "auto",
          }}
          className={`mll ${this.props.nodeId}`}
          id="reply_content"
        >
          <div className={"cm-short-content"}>
            <CodeMirrorsEditor
              editorDidMount={(editor) => Tools.attachEditor(editor)}
              onPaste={() => Tools.uploadMdFile()}
              value={this.props.content}
              onFocus={() => this.dockBox(true)}
              onDrop={() => Tools.uploadMdFile()}
              options={{
                mode: "markdown",
                lineNumbers: false,
                lineWrapping: true,
                theme: `${this.props.nodeId}`,
                extraKeys: {"Ctrl-Space": "autocomplete"},
                hintOptions: {
                  hint: this.synonyms,
                  alignWithWord: false,
                  closeOnUnfocus: false,
                  closeOnBlur: false,
                  className: "textcomplete-item",
                },
              }}
              onBeforeChange={(editor, data, value) => {
                this.handleChange(editor, value);
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

  renderEditorSelect(blurStyle) {
    return (
      <div style={blurStyle}>
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

  render() {
    if (this.props.topic === null) {
      return null;
    }

    const needLogin = this.props.account === undefined || this.props.account === null;
    if (!this.props.isEmbedded && needLogin) {
      return null;
    }

    const blurStyle = needLogin ? {color: "#ccc", pointerEvents: "none"} : null;

    return (
      <div className={["box", this.props.sticky ? "sticky" : "", `${this.props.nodeId}`].join(" ")} id="reply-box">
        <div style={blurStyle} className={`cell ${this.props.nodeId}`}>
          <div className="fr">
            {this.props.parent?.id > 0 ? (
              <a onClick={this.props.cancelReply.bind(this)} style={{display: this.props.sticky ? "" : "none"}} id="cancel-button" className={`${this.props.nodeId}`}>
                {i18next.t("reply:Cancel reply to {username}").replace("{username}", this.props.parent.username)}
              </a>
            ) : null}{" "}
            &nbsp; &nbsp;{" "}
            <a onClick={this.undockBox.bind(this)} style={{display: this.props.sticky ? "" : "none"}} id="undock-button" className={`${this.props.nodeId}`}>
              {i18next.t("reply:Undock")}
            </a>{" "}
            &nbsp; &nbsp;{" "}
            <a href="#" onClick={this.backToTop.bind(this)} className={`${this.props.nodeId}`} style={blurStyle}>
              {i18next.t("reply:Back to Top")}
            </a>
          </div>
          {i18next.t("reply:Add a New Comment")}
        </div>
        {this.renderProblem()}
        <div className={`cell ${this.props.nodeId}`}>
          <div
            style={{
              overflow: "hidden",
            }}
          >
            {this.renderEditor(needLogin)}
          </div>
          <div className="sep10" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button style={blurStyle} onClick={this.publishReply.bind(this)} type="submit" disabled={Setting.isFileUploading(this.state.form.content)} className="super normal button">
              <li className={this.state.publishClicked ? "fa fa-circle-o-notch fa-spin" : "fa fa-paper-plane"} />
              &nbsp;{this.state.publishClicked ? i18next.t("new:Publishing...") : i18next.t("reply:Reply")}
            </button>
            {this.renderEditorSelect(blurStyle)}
          </div>

          <div
            style={{
              overflow: "hidden",
            }}
          >
            <div style={blurStyle} className="fr">
              <div className="sep5" />
              <span className="gray" style={blurStyle}>
                {i18next.t("reply:Make your comment helpful for others as much as possible")}
              </span>
            </div>
          </div>
        </div>

        <div className="inner">
          <div className="fr">
            <Link style={blurStyle} to="/" className={`${this.props.nodeId}`}>
              ← {Setting.getForumName()}
            </Link>
          </div>
          &nbsp;
        </div>
      </div>
    );
  }
}

export default withRouter(NewReplyBox);

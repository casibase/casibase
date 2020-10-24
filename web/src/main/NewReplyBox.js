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
import * as TopicBackend from "../backend/TopicBackend";
import * as ReplyBackend from "../backend/ReplyBackend";
import {withRouter, Link} from "react-router-dom";
import '../Reply.css'
import * as Tools from "./Tools";
import "../codemirrorSize.css"
import "../node.css"
import "./node-casbin.css"
import * as CodeMirror from "codemirror"
import "codemirror/addon/hint/show-hint"
import "./show-hint.css"
import {Controlled as CodeMirrorsEditor} from "react-codemirror2";
import {Resizable} from "re-resizable";
import i18next from "i18next";

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
      initOSSClientStatus: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.synonyms = this.synonyms.bind(this);
  }

  componentDidMount() {
    this.getTopic();
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId)
      .then((res) => {
        this.setState({
          topic: res,
        }, () => {
          this.updateFormField("topicId", this.state.topic.id)
        });
      });
  }

  backToTop() {
    Setting.scrollToTop();
  }

  initOSS() {
    Setting.initOSSClient(this.props.member)
    this.setState({
      initOSSClientStatus: true
    });
  }

  updateFormField(key, value) {
    let form = this.state.form;
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

    let problems = [];
    if (this.state.form.content === "") {
      problems.push(i18next.t("error:Reply content cannot be empty"));
    }

    return problems.length === 0
  }

  renderProblem() {
    if (!this.state.isTypingStarted) {
      return null;
    }

    let problems = [];
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
          {
            problems.map((problem, i) => {
              return <li>{problem}</li>;
            })
          }
        </ul>
      </div>
    );
  }

  publishReply() {
    if (this.props.content !== undefined) {
      this.updateFormField("content", this.props.content);
    }
    if (!this.isOkToSubmit()) {
      return;
    }

    ReplyBackend.addReply(this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          this.props.onReplyChange("")
          this.props.refreshReplies();
          Setting.scrollToBottom();
        } else {
           this.setState({
             message: res.msg,
           });
        }
      });
  }

  handleChange(editor, value) {
    this.props.onReplyChange(value);
    this.updateFormField("content", this.props.content);
    if (this.state.message !== null) {
      this.setState({
        message: null,
      });
    }
    if (value.substring(value.length-1) === "@") {
      CodeMirror.commands.autocomplete(editor, null, { completeSingle: false });
    }
  }

  undockBox() {
    this.props.changeStickyStatus(false);
  }

  dockBox() {
    this.props.changeStickyStatus(true);
  }

  synonyms(cm, option) {
    let comp = this.props.memberList;
    let res = [];
    return new Promise(function(accept) {
      setTimeout(function() {
        let cursor = cm.getCursor(), line = cm.getLine(cursor.line);
        let start = cursor.ch, end = cursor.ch;
        while (start && line.charAt(start - 1) !== "@") --start;
        while (end < line.length && /\w/.test(line.charAt(end))) ++end;
        let word = line.slice(start, end).toLowerCase();
        for (let i = 0; i < comp.length; i++) if (comp[i].includes(word)) {res.push(comp[i]);}
        return accept({list: res,
          from: CodeMirror.Pos(cursor.line, start+1),
          to: CodeMirror.Pos(cursor.line, end)})
      }, 100);
    });
  }

  render() {
    if (this.state.topic === null) {
      return null;
    }

    if (this.props.member !== null) {
      if (!this.state.initOSSClientStatus) {
        this.initOSS();
      }
    }

    return (
      <div className={["box", this.props.sticky ? "sticky" : "", `${this.props.nodeId}`].join(' ')} id="reply-box">
        <div className={`cell ${this.props.nodeId}`}>
          <div className="fr">
            <a onClick={this.undockBox.bind(this)} style={{display: this.props.sticky ? "" : "none"}} id="undock-button" className={`${this.props.nodeId}`}>
              {i18next.t("reply:Undock")}
            </a>
            {" "}&nbsp; &nbsp;{" "}
            <a href="#" onClick={this.backToTop.bind(this)} className={`${this.props.nodeId}`}>
              {i18next.t("reply:Back to Top")}
            </a>
          </div>
          {i18next.t("reply:Add a New Comment")}
        </div>
        {
          this.renderProblem()
        }
        <div className={`cell ${this.props.nodeId}`} >
          <div style={{overflow: "hidden", overflowWrap: "break-word", resize: "none", height: "112px"}} className={`mll ${this.props.nodeId}`} id="reply_content" >
            <Resizable
              enable={false}
              defaultSize={{
                height:112,
              }}
            >
              <CodeMirrorsEditor
                editorDidMount={(editor) => Tools.attachEditor(editor)}
                onPaste={() => Tools.uploadMdFile()}
                value={this.props.content}
                onFocus={() => this.dockBox(true)}
                onDrop={() => Tools.uploadMdFile()}
                options={{
                  mode: 'markdown', lineNumbers: false, lineWrapping: true, theme:`${this.props.nodeId}`,
                  extraKeys:{"Ctrl-Space": "autocomplete"}, hintOptions: {hint: this.synonyms, alignWithWord: false, closeOnUnfocus:false, closeOnBlur: false, className: "textcomplete-item"}
                }}
                onBeforeChange={(editor, data, value) => {
                  this.handleChange(editor, value)
                }}
                onChange={(editor, data, value) => {
                }}
              />
            </Resizable>
          </div>
          <div className="sep10" />
          <div className="fr">
            <div className="sep5" />
            <span className="gray">
              {i18next.t("reply:Make your comment helpful for others as much as possible")}
            </span>
          </div>
          <input onClick={this.publishReply.bind(this)} type="submit" value={i18next.t("reply:Reply")} className="super normal button" />
        </div>
        <div className="inner">
          <div className="fr">
            <Link to="/" className={`${this.props.nodeId}`}>
              ←{" "}{Setting.getForumName()}
            </Link>
          </div>
          &nbsp;
        </div>
      </div>
    );
  }
}

export default withRouter(NewReplyBox);

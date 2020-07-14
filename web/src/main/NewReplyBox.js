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
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import '../Reply.css'
import * as Tools from "./Tools";
import {Controlled as CodeMirror} from "react-codemirror2";
import i18next from "i18next";

class NewReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: null,
      form: {topicId: props.match.params.topicId},
      isTypingStarted: false,
      problem: [],
    };
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount() {
    this.getTopic();
    Setting.initOSSClient(this.props.member)
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId)
      .then((res) => {
        this.setState({
          topic: res,
        });
      });
  }

  backToTop() {
    Setting.scrollToTop();
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
    )
  }

  publishReply() {
    if (this.props.content !== undefined) {
      this.updateFormField("content", this.props.content)
    }
    if (!this.isOkToSubmit()) {
      return;
    }

    ReplyBackend.addReply(this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          Setting.refresh();
          Setting.scrollToBottom();
        } else {
          // this.setState({
          //   message: res.msg,
          // });
        }
      });
  }

  handleChange(value) {
    this.props.onReplyChange(value);
    this.updateFormField("content", this.props.content);
  }

  undockBox() {
    this.props.changeStickyStatus(false)
  }

  dockBox() {
    this.props.changeStickyStatus(true)
  }

  render() {
    if (this.state.topic === null) {
      return null
    }

    return (
      <div className={["box", this.props.sticky ? "sticky" : ""].join(' ')} id="reply-box">
        <div className="cell">
          <div className="fr">
            <a onClick={this.undockBox.bind(this)} style={{display: this.props.sticky ? "" : "none"}} id="undock-button">
              {i18next.t("reply:Undock")}
            </a>
            {" "}&nbsp; &nbsp;{" "}
            <a href="#" onClick={this.backToTop.bind(this)}>
              {i18next.t("reply:Back to Top")}
            </a>
          </div>
          {i18next.t("reply:Add a New Comment")}
        </div>
        {
          this.renderProblem()
        }
        <div className="cell" >
          <div style={{overflow: "hidden", overflowWrap: "break-word", resize: "none", height: "112px"}} className="mll" id="reply_content" >
            <CodeMirror
              editorDidMount={(editor) => Tools.attachEditor(editor)}
              onPaste={() => Tools.uploadPic()}
              value={this.props.content}
              onFocus={() => this.dockBox(true)}
              onDrop={() => Tools.uploadPic()}
              options={{mode: 'markdown', lineNumbers: false}}
              onBeforeChange={(editor, data, value) => {
                this.handleChange(value)
              }}
              onChange={(editor, data, value) => {
              }}
            />
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
            <a href="/">
              ← {Setting.getForumName()}
            </a>
          </div>
          &nbsp;
        </div>
      </div>
    );
  }
}

export default withRouter(NewReplyBox);

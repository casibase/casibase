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
      problems.push("Reply content cannot be empty");
    }

    return problems.length === 0
  }

  renderProblem() {
    if (!this.state.isTypingStarted) {
      return null;
    }

    let problems = [];
    if (this.state.form.content === "") {
      problems.push("Reply content cannot be empty");
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem">
        Please resolve the following issues before submitting:
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

  handleChange(e) {
    this.props.onReplyChange(e.target.value);
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
              Undock Reply Box
            </a>
            {" "}&nbsp; &nbsp;{" "}
            <a href="#" onClick={this.backToTop.bind(this)}>
              Back to Top
            </a>
          </div>
          Add a New Comment
        </div>
        {
          this.renderProblem()
        }
        <div className="cell" >
          <textarea onChange={this.handleChange} value={this.props.content} name="content" maxLength="10000" className="mll" id="reply_content" onFocus={() => this.dockBox(true)} style={{overflow: "hidden", overflowWrap: "break-word", resize: "none", height: "112px"}} />
          <div className="sep10" />
          <div className="fr">
            <div className="sep5" />
            <span className="gray">
              Make your comment helpful for others as much as possible
            </span>
          </div>
          <input onClick={this.publishReply.bind(this)} type="submit" value="Submit" className="super normal button" />
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

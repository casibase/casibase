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
import * as NodeBackend from "../backend/NodeBackend";
import * as TopicBackend from "../backend/TopicBackend";
import * as Setting from "../Setting";
import {withRouter} from "react-router-dom";

import "codemirror/lib/codemirror.css"
require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require('react-markdown')

class NewNodeTopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      isPreviewEnabled: false,
      isTypingStarted: false,
      nodeId: "",
      nodeInfo: {},
      problems: [],
    };

    this.renderLargeSize = this.renderLargeSize.bind(this)
    this.renderSmallSize = this.renderSmallSize.bind(this)
    this.publishTopic = this.publishTopic.bind(this)
  }

  componentDidMount() {
    this.getNodeInfo()
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  enablePreview() {
    this.setState({
      isPreviewEnabled: !this.state.isPreviewEnabled,
    });
  }

  isOkToSubmit() {
    if (!this.state.isTypingStarted) {
      return false;
    }

    let problems = [];
    if (this.state.form.title === "" || this.state.form.title === undefined) {
      problems.push("Reply title cannot be empty");
    }
    this.setState({
      problems: problems,
    })

    return problems.length === 0
  }

  publishTopic() {
    if (!this.isOkToSubmit()) {
      return;
    }

    this.updateFormField("nodeId", this.state.nodeInfo.id)
    this.updateFormField("nodeName", this.state.nodeInfo.name)

    TopicBackend.addTopic(this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          Setting.goToLink(`/go/${this.state.nodeInfo.id}`);
        } else {
          // this.setState({
          //   message: res.msg,
          // });
        }
      });
  }

  renderProblem() {
    let problems = this.state.problems
    if (this.state.problems.length === 0) {
      return null
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

  getNodeInfo() {
    NodeBackend.getNode(this.props.nodeId)
      .then((res) => {
        this.setState({
          nodeInfo: res,
        });
      });
  }

  renderPreview() {
    return (
      <div>
        {
          !this.state.isPreviewEnabled ? null :
            <div className="dock_area">
              <div className="inner">
                <div className="fr gray" id="syntax_text">
                  Already enabled Markdown &nbsp;
                </div>
                <span className="gray">
              Content Preview
            </span>
              </div>
            </div>
        }
        <div className="inner" id="topic_preview">
          <div className="topic_content">
            <div className="markdown_body">
              {
                !this.state.isPreviewEnabled ? null : <ReactMarkdown source={this.state.form.body} />
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderHeader() {
    return (
      <div className="header">
        <a href="/">{Setting.getForumName()}</a>
        <span className="chevron">&nbsp;›&nbsp;</span>
        <a href={`/go/${this.props.nodeId}`}> {this.state.nodeInfo?.name} </a>
        <span className="chevron">&nbsp;›&nbsp;</span> New Topic
      </div>
    )
  }

  renderSmallSize() {
    return (
      <div class="box">
        <div class="cell">
          <textarea type="text" rows="1" maxLength="120" name="title" class="sll" id="topic_title" onChange={event => {this.updateFormField("title", event.target.value)}} placeholder="Please input the topic title. The body can be empty if the title expresses the full idea" >
            {
              this.state.form.title
            }
          </textarea>
          <div class="sep10"></div>
          <textarea name="content" class="mll" id="topic_content" placeholder="Content" maxLength="20000" onChange={event => {this.updateFormField("body", event.target.value)}} >
            {
              this.state.form.body
            }
          </textarea>
          <div class="sep10"></div>
          <input type="hidden" name="once" />
          <input type="submit" value="Publish" class="super normal button" onClick={this.publishTopic.bind(this)} />
        </div>
        <div class="inner"><div class="fr"><a href="/settings/ignore/node/12">Ignore this node</a>
          &nbsp; <span class="fade">Topics in the ignored nodes will not appear on the homepage.</span></div>
          &nbsp;
        </div>
      </div>
    )
  }

  renderLargeSize() {
    return (
      <div className="box" id="box">
        {this.renderHeader()}
        {this.renderProblem()}
        <div className="cell">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td>
                <textarea className="mle" rows="4" name="title" id="topic_title" maxLength="120" onChange={event => {this.updateFormField("title", event.target.value)}} autoFocus="autofocus">
                  {
                    this.state.form.title
                  }
                </textarea>
              </td>
            </tr>
            <tr>
              <td>
                <textarea className="mle" rows="10" name="content" id="topic_content" maxLength="20000" onChange={event => {this.updateFormField("body", event.target.value)}} >
                  {
                    this.state.form.body
                  }
                </textarea>
              </td>
            </tr>
            <tr>
              <td>
                <input type="hidden" name="once"/>
                <button type="button" className="super normal button" onClick={this.enablePreview.bind(this)}>
                  <li className="fa fa-eye"></li>
                  &nbsp;Preview
                </button>
                &nbsp;
                <button type="submit" className="super normal button" onClick={this.publishTopic.bind(this)}>
                  <li className="fa fa-paper-plane"></li>
                  &nbsp;Publish
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        {this.renderPreview()}
      </div>
    )
  }

  render() {
    if (this.props.size === "small") {
      return this.renderSmallSize()
    }else {
      return this.renderLargeSize()
    }
  }
}

export default  withRouter(NewNodeTopicBox);

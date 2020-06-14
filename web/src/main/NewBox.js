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
import Header from "./Header";
import * as NodeBackend from "../backend/NodeBackend";

import $ from "jquery"
import Select2 from 'react-select2-wrapper';

import {Controlled as CodeMirror} from 'react-codemirror2'
import "codemirror/lib/codemirror.css"
require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require('react-markdown')

class NewBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      isPreviewEnabled: false,
      nodes: [],
    };
  }

  componentWillMount() {
    this.getNodes();

    this.updateFormField("nodeId", "qna");
  }

  getNodes() {
    NodeBackend.getNodes()
      .then((res) => {
        this.setState({
          nodes: res,
        });
      });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  countField(key) {
    if (this.state.form[key] === undefined) {
      return 0;
    } else {
      return this.state.form[key].length;
    }
  }

  enablePreview() {
    this.setState({
      isPreviewEnabled: !this.state.isPreviewEnabled,
    });
  }

  publishTopic() {
    alert("11")
  }

  getIndexFromNodeId(nodeId) {
    for (let i = 0; i < this.state.nodes.length; i ++) {
      if (this.state.nodes[i].id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  render() {
    return (
      <div className="box" id="box">
        <Header item="New Topic" />
        <form method="post" action="/new" id="compose">
          <div className="cell">
            <div className="fr fade" id="title_remaining">
              {
                120 - this.countField("title")
              }
            </div>
            Topic Title
          </div>
          <div className="cell" style={{padding: "0px"}}>
            <textarea onChange={event => {this.updateFormField("title", event.target.value)}} className="msl" rows="1" maxLength="120" id="topic_title" name="title" autoFocus="autofocus" placeholder="Please input the topic title. The body can be empty if the title expresses the full idea">
              {
                this.state.form.title
              }
            </textarea>
          </div>
          <div className="cell">
            <div className="fr fade" id="content_remaining">
              {
                20000 - this.countField("body")
              }
            </div>
            Body
          </div>
          <div style={{textAlign: "left", borderBottom: "1px solid #e2e2e2", fontSize: "14px", lineHeight: "120%"}}>
            <textarea style={{visibility: "hidden", display: "none"}} maxLength="20000" id="editor" name="content" />
            <CodeMirror
              value={this.state.form.body}
              options={{mode: 'markdown', lineNumbers: true}}
              onBeforeChange={(editor, data, value) => {
                this.updateFormField("body", value);
              }}
              onChange={(editor, data, value) => {
              }}
             />
          </div>
          <div className="cell">
            <Select2
              value={this.getIndexFromNodeId(this.state.form.nodeId)}
              style={{width: "300px", fontSize: "14px"}}
              data={
                this.state.nodes.map((node, i) => {
                  return {text: `${node.name} / ${node.id}`, id: i};
                })
              }
              onSelect={event => {
                const s = $(event.target).val();
                if (s === null) {
                  return;
                }

                const index = parseInt(s);
                const nodeId = this.state.nodes[index].id;
                this.updateFormField("nodeId", nodeId);
              }}
              options={
                {
                  placeholder: "Please select a node",
                }
              }
            />
          </div>
          <div className="cell" style={{lineHeight: "190%"}}>
            Hottest Nodes &nbsp; {
              this.state.nodes.map((node, i) => {
                return (
                  <div style={{display: "inline"}}>
                    <a href="#" onClick={() => this.updateFormField("nodeId", node.id)} className="node">{node.name}</a> &nbsp;
                  </div>
                )
              })
            }
          </div>
        </form>
        <div className="cell">
          <div className="fr">
            <span id="error_message" /> &nbsp;
            <button type="button" className="super normal button" onClick={this.publishTopic.bind(this)}>
              <li className="fa fa-paper-plane" />
              &nbsp;Publish
            </button>
          </div>
          <button className="super normal button" onClick={this.enablePreview.bind(this)}>
            <li className="fa fa-eye" />
            &nbsp;Preview
          </button>
        </div>
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
}

export default NewBox;

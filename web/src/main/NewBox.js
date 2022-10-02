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
import * as MemberBackend from "../backend/MemberBackend";
import * as TopicBackend from "../backend/TopicBackend";
import * as Setting from "../Setting";
import * as Tools from "./Tools";
import NewNodeTopicBox from "./NewNodeTopicBox";
import "../codemirrorSize.css";
import {withRouter} from "react-router-dom";
import i18next from "i18next";
import Select2 from "react-select2-wrapper";
import {Controlled as CodeMirror} from "react-codemirror2";
import Editor from "./richTextEditor";
import * as Conf from "../Conf";
import TagsInput from "react-tagsinput";
import "../tagsInput.css";
import {Helmet} from "react-helmet";

require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require("react-markdown");

class NewBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      isPreviewEnabled: false,
      nodes: [],
      tags: [],
      problems: [],
      message: "",
      isTypingStarted: false,
      nodeId: this.props.match.params.nodeId,
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
      placeholder: i18next.t("new:Switch editor"),
      publishClicked: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getNodes();
    MemberBackend.getMemberEditorType().then((res) => {
      const editorType = res.data ? res.data : Conf.DefaultEditorType;
      this.updateFormField("editorType", editorType);
      this.setState({
        placeholder: i18next.t(`new:${this.state.form.editorType}`),
      });
    });
  }

  getNodes() {
    NodeBackend.getNodes().then((res) => {
      this.setState(
        {
          nodes: res,
        },
        () => {
          this.updateFormField("nodeId", "qna");
          this.updateFormField("nodeName", "问与答");
        }
      );
    });
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  handleValueFromEditor(textValue) {
    this.updateFormField("body", textValue);
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
    if (!this.isOkToSubmit()) {
      return;
    }
    if (this.state.publishClicked) {
      return;
    }
    this.setState({
      publishClicked: true,
    });
    if (!this.state.form.editorType) {
      this.updateFormField("editorType", "markdown");
    }
    TopicBackend.addTopic(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(`/t/${res?.data}/review`);
        this.props.refreshAccount();
      } else {
        this.setState({
          message: res.msg,
          publishClicked: false,
        });
      }
    });
  }

  getIndexFromNodeId(nodeId) {
    for (let i = 0; i < this.state.nodes.length; i++) {
      if (this.state.nodes[i].id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  clearMessage() {
    this.setState({
      message: "",
      problems: [],
    });
  }

  handleChange(tags) {
    this.updateFormField("tags", tags);
    this.setState({
      tags: tags,
    });
  }

  isOkToSubmit() {
    if (!this.state.isTypingStarted) {
      return false;
    }

    const problems = [];
    if (this.state.form.title === "" || this.state.form.title === undefined) {
      problems.push(i18next.t("error:Topic title cannot be empty"));
    }

    this.setState({
      problems: problems,
    });

    return problems.length === 0;
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

  renderProblem() {
    const problems = this.state.problems;

    if (problems.length === 0 && this.state.message === "") {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
        {i18next.t("error:Please resolve the following issues before creating a new topic")}
        <ul>
          {problems.map((problem, i) => {
            return <li key={i}>{problem}</li>;
          })}
          {this.state.message !== "" ? <li>{i18next.t(`error:${this.state.message}`)}</li> : null}
        </ul>
      </div>
    );
  }

  updateTitle(nodeName) {
    document.title = `${i18next.t("new:New Topic")} - ${nodeName} - ${Setting.getForumName()}`;
  }

  render() {
    if (this.state.nodeId !== undefined && this.props.account !== undefined) {
      return <NewNodeTopicBox nodeId={this.state.nodeId} size={"large"} account={this.props.account} refreshAccount={this.props.refreshAccount.bind(this)} />;
    }

    if (this.props.account === null) {
      this.props.history.push(Setting.getSigninUrl());
    }

    return (
      <div className="box" id="box">
        <Helmet>
          <title>{`${i18next.t("new:New Topic")} - ${Setting.getForumName()}`}</title>
        </Helmet>
        {this.renderProblem()}
        <form method="post" action="/new" id="compose">
          <div className="cell">
            <div className="fr fade" id="title_remaining">
              {120 - this.countField("title")}
            </div>
            {i18next.t("new:Topic Title")}
          </div>
          <div className="cell" style={{padding: "0px"}}>
            <textarea
              onChange={(event) => {
                this.updateFormField("title", event.target.value);
              }}
              className="msl"
              rows="1"
              maxLength="120"
              id="topic_title"
              name="title"
              autoFocus="autofocus"
              placeholder={i18next.t("new:Please input the topic title. The body can be empty if the title expresses the full idea")}
            >
              {this.state.form.title}
            </textarea>
          </div>
          <div className="cell">
            <div className="fr fade" id="content_remaining">
              {20000 - this.countField("body")}
            </div>
            {i18next.t("new:Body")}
          </div>
          <div>
            {/* markdown editor */}
            {!this.state.form.editorType || this.state.form.editorType === "markdown" ? (
              <div
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e2e2e2",
                  fontSize: "14px",
                  lineHeight: "120%",
                }}
              >
                <textarea style={{visibility: "hidden", display: "none"}} maxLength="20000" id="editor" name="content" />
                <div className={"cm-long-content"}>
                  <CodeMirror
                    editorDidMount={(editor) => Tools.attachEditor(editor)}
                    onPaste={() => Tools.uploadMdFile()}
                    value={this.state.form.body}
                    onDrop={() => Tools.uploadMdFile()}
                    options={{
                      mode: "markdown",
                      lineNumbers: true,
                      lineWrapping: true,
                    }}
                    onBeforeChange={(editor, data, value) => {
                      this.updateFormField("body", value);
                    }}
                    onChange={(editor, data, value) => {}}
                  />
                </div>
              </div>
            ) : (
              <div style={{display: "block", height: "100%"}}>
                <Editor
                  language={i18next.language}
                  height="400px"
                  id="richTextEditor"
                  onBeforeChange={(value) => {
                    this.updateFormField("body", value);
                  }}
                />
              </div>
            )}
          </div>
          {/* select node */}
          <div className="cell" style={{display: "flex", justifyContent: "space-between"}}>
            <Select2
              value={this.getIndexFromNodeId(this.state.form.nodeId)}
              style={{
                width: Setting.PcBrowser ? "300px" : "200px",
                fontSize: "14px",
              }}
              data={this.state.nodes.map((node, i) => {
                return {text: `${node.name} / ${node.id}`, id: i};
              })}
              onSelect={(event) => {
                const s = event.target.value;
                if (s === null) {
                  return;
                }

                const index = parseInt(s);
                const nodeId = this.state.nodes[index].id;
                const nodeName = this.state.nodes[index].name;
                this.updateFormField("nodeId", nodeId);
                this.updateFormField("nodeName", nodeName);
              }}
              options={{
                placeholder: i18next.t("new:Please select a node"),
              }}
            />
            {this.renderEditorSelect()}
          </div>
          <div className="cell" style={{lineHeight: "190%"}}>
            {i18next.t("new:Hottest Nodes")} &nbsp;{" "}
            {this.state.nodes.map((node, i) => {
              return (
                <div key={node.name} style={{display: "inline"}}>
                  <a
                    href="#"
                    onClick={() => {
                      this.updateFormField("nodeId", node.id);
                      this.updateFormField("nodeName", node.name);
                      this.updateTitle(node.name);
                    }}
                    className="node"
                  >
                    {node.name}
                  </a>{" "}
                  &nbsp;
                </div>
              );
            })}
          </div>
        </form>
        <div style={{}}>
          <div style={{height: 1, borderTop: "1px solid black"}}></div>
          <div style={{height: 3}}></div>
          <TagsInput
            inputProps={{
              maxLength: "8",
              placeholder: "After adding tags press Enter,only add up to four tags,the length of each tag is up to 8",
            }}
            maxTags="4"
            value={this.state.tags}
            onChange={this.handleChange.bind(this)}
          />
        </div>
        <div className="cell">
          <div className="fr">
            <span id="error_message" /> &nbsp;
            <button type="button" disabled={Setting.isFileUploading(this.state.form.body)} className="super normal button" onClick={this.publishTopic.bind(this)}>
              <li className={this.state.publishClicked ? "fa fa-circle-o-notch fa-spin" : "fa fa-paper-plane"} />
              &nbsp;{this.state.publishClicked ? i18next.t("new:Publishing...") : i18next.t("new:Publish")}
            </button>
          </div>
          <div>
            <button className="super normal button" onClick={this.enablePreview.bind(this)}>
              <li className="fa fa-eye" />
              &nbsp;{i18next.t("new:Preview")}
            </button>
          </div>
        </div>
        <div className="inner" id="topic_preview">
          <div className="topic_content">
            {/* preview in markdown */}
            <div className="markdown_body">{!this.state.isPreviewEnabled ? null : <ReactMarkdown source={this.state.form.body} escapeHtml={false} />}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(NewBox);

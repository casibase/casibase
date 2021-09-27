// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import * as NoteBackend from "../backend/NoteBackend";
import i18next from "i18next";
import { withRouter, Link } from "react-router-dom";
import Select2 from "react-select2-wrapper";
import { Controlled as CodeMirror } from "react-codemirror2";
import * as Tools from "./Tools";
import Editor from "./richTextEditor";
require("codemirror/mode/markdown/markdown");

class NewNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {
        parent: "/",
        editorType: "markdown",
      },
      message: "",
      folders: [],
      field: "file",
      editor: [
        {
          text: i18next.t("new:markdown"),
          id: 0,
        },
        {
          text: i18next.t("new:richtext"),
          id: 1,
        },
      ],
      placeholder: i18next.t("new:Switch editor"),
    };
    if (this.props.location.query?.field != undefined) {
      this.state.field = this.props.location.query?.field;
    }
    this.state.url = `/notes/new`;
  }

  componentDidMount() {
    this.getFolder();
  }

  getFolder() {
    NoteBackend.getNotesByParent("/").then((res) => {
      let folders = [];
      for (let i in res) {
        if (res[i].Field == "folder") {
          folders.push(res[i]);
        }
      }
      folders.push({ Name: "/" });
      this.setState({
        folders: folders,
      });
    });
  }

  inputChange(event, id) {
    let form = this.state.form;
    form[id] = event.target.value;
    this.setState({
      form: form,
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  addNote() {
    let form = this.state.form;
    form["field"] = this.state.field;
    NoteBackend.addNote(form).then((res) => {
      if (res.data == true) {
        this.setState({
          message: i18next.t("new:File or folder added successfully"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  renderEditorSelect() {
    return (
      <div>
        {i18next.t("new:Switch editor")}
        &nbsp;{" "}
        <Select2
          value={this.state.form.editorType}
          style={{ width: "110px", fontSize: "14px" }}
          data={this.state.editor.map((node, i) => {
            return { text: `${node.text}`, id: i };
          })}
          onSelect={(event) => {
            const s = event.target.value;
            if (s === null) {
              return;
            }
            const index = parseInt(s);
            if (index === 0) {
              let form = this.state.form;
              form["editorType"] = "markdown";
              this.setState({
                placeholder: i18next.t("new:markdown"),
                form: form,
              });
            } else {
              let form = this.state.form;
              form["editorType"] = "richtext";
              this.setState({
                placeholder: i18next.t("new:richtext"),
                form: form,
              });
            }
          }}
          options={{ placeholder: this.state.placeholder }}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            <Link to="/notes">{i18next.t("general:Note")}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span>
            {i18next.t("note:Create")}
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
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {this.state.field == "folder"
                      ? i18next.t("note:Folder Name")
                      : i18next.t("note:File Name")}
                  </td>
                  <td width="auto" align="left">
                    <input
                      onChange={(event) => this.inputChange(event, "name")}
                    />
                  </td>
                </tr>
                {this.state.field == "file" ? (
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("note:Parent Folder")}
                    </td>
                    <td width="auto" align="left">
                      <Select2
                        value={this.state.form.parent}
                        style={{ width: "110px", fontSize: "14px" }}
                        data={this.state.folders.map((folder, i) => {
                          return { text: `${folder.Name}`, id: i };
                        })}
                        onSelect={(event) => {
                          const s = event.target.value;
                          if (s == "") {
                            return;
                          }
                          const index = parseInt(s);
                          let form = this.state.form;
                          form["parent"] = this.state.folders[index]?.Name;
                          this.setState({
                            form: form,
                          });
                        }}
                        options={{ placeholder: this.state.form.parent }}
                      />
                    </td>
                  </tr>
                ) : null}
                {this.state.field == "file" ? (
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("note:File Content")}
                    </td>
                    <td width="auto" align="left">
                      {this.state.form.editorType === "markdown" ? (
                        <div
                          className={`cm-long-content`}
                          style={{
                            borderWidth: 1,
                            borderColor: "#e2e2e2",
                            borderStyle: "solid",
                          }}
                        >
                          <CodeMirror
                            editorDidMount={(editor) =>
                              Tools.attachEditor(editor)
                            }
                            onPaste={() => Tools.uploadMdFile()}
                            value={this.state.form.content}
                            onDrop={() => Tools.uploadMdFile()}
                            options={{
                              mode: "markdown",
                              lineNumbers: true,
                              lineWrapping: true,
                            }}
                            onBeforeChange={(editor, data, value) => {
                              let form = this.state.form;
                              form["content"] = value;
                              this.setState({
                                form: form,
                              });
                            }}
                            onChange={(editor, data, value) => {}}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            borderWidth: 1,
                            borderColor: "#e2e2e2",
                            borderStyle: "solid",
                            display: "block",
                            height: "100%",
                          }}
                        >
                          <Editor
                            language={i18next.language}
                            height="400px"
                            id="richTextEditor"
                            onBeforeChange={(value) => {
                              let form = this.state.form;
                              form["content"] = value;
                              this.setState({
                                form: form,
                              });
                            }}
                          />
                        </div>
                      )}
                      <div className="sep10"></div>
                      {this.renderEditorSelect()}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td
                    width={Setting.PcBrowser ? "120" : "90"}
                    align="right"
                  ></td>
                  <td width="auto" align="left">
                    <input
                      type="submit"
                      className="super normal button"
                      value={i18next.t("note:Save")}
                      onClick={() => this.addNote()}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(NewNote);

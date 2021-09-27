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
import { withRouter, Link } from "react-router-dom";
import i18next from "i18next";
import * as BalanceBackend from "../backend/BalanceBackend";

const ReactMarkdown = require("react-markdown");

class NoteBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      noteId: this.props.match.params.noteId,
      notes: [],
      note: {},
      name: "",
    };

    this.state.url = `/notes/${this.state.noteId}`;
  }

  componentDidMount() {
    if (this.state.noteId == undefined) {
      this.getNotes("/");
    } else {
      this.getNote(this.state.noteId);
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      var noteId = newProps.match.params.noteId;
      this.setState({
        note: {},
        name: "",
        noteId: noteId,
      });
      if (noteId == undefined) {
        this.getNotes("/");
      } else {
        this.getNote(noteId);
      }
    }
  }

  getNotes(parent) {
    NoteBackend.getNotesByParent(parent).then((res) => {
      this.setState({
        notes: res,
      });
    });
  }

  getNote(id) {
    NoteBackend.getNote(id).then((res) => {
      if (res.Field == "folder") {
        this.getNotes(res.Name);
      } else {
        this.setState({
          note: res,
        });
      }
      this.setState({
        name: res.Name,
      });
    });
  }

  deleteNote(id) {
    if (window.confirm(`Are you sure to delete ${this.state.name}?`)) {
      NoteBackend.deleteNote(id).then((res) => {
        if (res.data == true) {
          Setting.goToLink("/notes");
        }
      });
    }
  }

  renderNote(note) {
    return (
      <div className="box">
        <div style={{ padding: "10px" }} align="left">
          <div className="markdown_body">
            <ReactMarkdown
              renderers={{
                image: this.renderImage,
                link: this.renderLink,
              }}
              source={Setting.getFormattedContent(note.Content, true)}
              escapeHtml={false}
            />
          </div>
        </div>
      </div>
    );
  }

  renderNotes(note) {
    return (
      <div className="box">
        <div style={{ padding: "10px" }} align="left">
          {note.Field == "file" ? (
            <img src={Setting.getStatic("/img/ico_note.png")} />
          ) : (
            <img src={Setting.getStatic("/img/ico_folder_blue.png")} />
          )}
          &nbsp;&nbsp;
          <a href={`/notes/${note.Id}`} className="black">
            {note.Name}
          </a>
        </div>
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
            {this.state.name != "" ? (
              <span className="chevron">&nbsp;›&nbsp;</span>
            ) : null}{" "}
            {this.state.name}
            <div className="sep10"></div>
            <Link
              to={{
                pathname: "/notes/new",
                query: { field: "file" },
              }}
            >
              <input
                type="submit"
                className="super normal button"
                value={i18next.t("note:Create File")}
              />
            </Link>
            <span className="chevron">&nbsp;&nbsp;</span>
            {this.state.noteId == undefined ? (
              <Link
                to={{
                  pathname: "/notes/new",
                  query: { field: "folder" },
                }}
              >
                <input
                  type="submit"
                  className="super normal button"
                  value={i18next.t("note:Create Folder")}
                />
              </Link>
            ) : null}
            <span className="chevron">&nbsp;&nbsp;</span>
            {this.state.noteId != undefined ? (
              <Link to={`/notes/edit/${this.state.noteId}`}>
                <input
                  type="submit"
                  className="super normal button"
                  value={i18next.t("note:Edit")}
                />
              </Link>
            ) : null}
            <span className="chevron">&nbsp;&nbsp;</span>
            {this.state.noteId != undefined ? (
              <input
                type="submit"
                className="super normal button"
                value={i18next.t("note:Delete")}
                onClick={() => this.deleteNote(this.state.noteId)}
              />
            ) : null}
          </div>
        </div>
        {JSON.stringify(this.state.note) === "{}"
          ? this.state.notes?.map((note) => {
              return this.renderNotes(note);
            })
          : this.renderNote(this.state.note)}
      </div>
    );
  }
}

export default withRouter(NoteBox);

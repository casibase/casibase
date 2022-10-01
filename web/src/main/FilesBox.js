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
import * as FileBackend from "../backend/FileBackend";
import * as Setting from "../Setting";
import * as Tools from "./Tools";
import PageColumn from "./PageColumn";
import {Link, withRouter} from "react-router-dom";
import "../deopzone.css";
import Dropzone from "react-dropzone";
import i18next from "i18next";
import * as Conf from "../Conf";

const browserImageSize = require("browser-image-size");

class FilesBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      event: props.match.params.event,
      planes: [],
      filesNum: 0,
      maxFileNum: 0,
      files: [],
      message: "",
      file: [],
      fileHeight: "",
      fileWidth: "",
      fileType: "",
      fileExt: "",
      limit: 25,
      minPage: 1,
      maxPage: -1,
      url: "",
      form: {},
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }

    this.state.url = "/i";
  }

  componentDidMount() {
    this.getFile();
    this.getFiles();
    this.clearMessage();
    this.getFileNum();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      const params = new URLSearchParams(newProps.location.search);
      let page = params.get("p");
      if (page === null) {
        page = 1;
      }
      this.setState(
        {
          page: parseInt(page),
          event: newProps.match.params.event,
        },
        () => {
          this.getFile();
          this.getFiles();
          this.clearMessage();
          this.getFileNum();
        }
      );
    }
  }

  getFile() {
    if (this.state.event === "" || this.state.event === undefined || this.state.event === "upload") {
      return;
    }

    FileBackend.getFile(this.state.event).then((res) => {
      this.setState(
        {
          file: res?.data,
        },
        () => {
          if (this.state.file === null) {
            return;
          }
          if (this.state.file?.fileType === "image") {
            browserImageSize(this.state.file?.fileUrl).then((size) => {
              this.setState({
                fileHeight: size.height,
                fileWidth: size.width,
              });
            });
          }
          if (this.props.edit) {
            this.initForm();
          }
        }
      );
    });
  }

  getFileNum() {
    if (this.state.event !== "upload") {
      return;
    }

    FileBackend.getFileNum().then((res) => {
      this.setState({
        filesNum: res?.data.num,
        maxFileNum: res?.data.maxNum,
      });
    });
  }

  getFiles() {
    if (this.state.event !== undefined) {
      return;
    }

    FileBackend.getFiles(this.state.limit, this.state.page).then((res) => {
      if (res?.status === "ok") {
        this.setState({
          files: res?.data,
          filesNum: res?.data2.num,
          maxFileNum: res?.data2.maxNum,
        });
      }
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  getIndex(file) {
    for (let i = 0; i < this.state.files.length; i++) {
      if (this.state.files[i] === file) {
        return i;
      }
    }

    return -1;
  }

  uploadFile(file) {
    const fileInfo = {name: file[0].path, size: file[0].size, status: false};
    const files = this.state.files;
    files.push(fileInfo);
    this.setState({
      files: files,
    });
    Tools.uploadFile(file[0]);
  }

  deleteFile(file) {
    let fileName;
    if (this.state.event === "upload") {
      fileName = file.name;
    } else {
      fileName = file?.fileName;
    }
    if (!window.confirm(`${i18next.t("file:Confirm to delete")} ${fileName}${i18next.t("file:?")}`)) {
      return;
    }

    FileBackend.deleteFile(file.id).then((res) => {
      if (res?.status === "ok") {
        if (this.state.event !== "upload") {
          this.props.history.push("/i?p=1");
        }
        const index = this.getIndex(file);
        const files = this.state.files;
        files.splice(index, 1);
        this.setState({
          files: files,
          message: "",
          filesNum: res?.data2.num,
          maxFileNum: res?.data2.maxNum,
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  initForm() {
    const form = this.state.form;
    form["fileName"] = this.state.file?.fileName;
    form["desc"] = this.state.file?.desc;
    this.setState({
      form: form,
    });
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  editDesc() {
    if (this.state.form.fileName === "") {
      this.setState({
        message: i18next.t("file:The title information of the image is necessary"),
      });
      return;
    }

    FileBackend.updateFileDesc(this.state.event, this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(`/i/${this.state.event}`);
      } else {
        this.setState({
          message: i18next.t(`"file:${res?.msg}`),
        });
      }
    });
  }

  renderUploadFile(file, index) {
    return (
      <div className="cell" key={index}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={Setting.PcBrowser ? "300" : "180"} align="left">
                <Link to={`${file.id}`}>{file.name}</Link>
              </td>
              <td width="10"></td>
              <td width="auto" valign="middle">
                <span className="item_hot_topic_title">{Setting.getFormattedSize(file.size)}</span>
              </td>
              <td width="auto" align="left" style={{textAlign: "center"}}>
                {file.status ? (
                  <a href="javascript:void(0);" onClick={() => this.deleteFile(file)} className="delete">
                    {i18next.t("file:Delete")}
                  </a>
                ) : (
                  <span className="gray">{i18next.t("file:uploading")}......</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // url: /i/upload
  renderUpload() {
    const progressWidth = (400 / this.state.maxFileNum) * this.state.filesNum;

    return (
      <span>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> <Link to="/i">Files</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("file:Upload new file")}
          </div>
          {this.renderProblem()}
          <div className="cell">
            <span className="gray">{i18next.t("file:Support all types of files within 6MB")}</span>
            <div className="sep10"></div>
            <div id="uploader">
              <Dropzone onDrop={(acceptedFiles) => this.uploadFile(acceptedFiles)}>
                {({getRootProps, getInputProps}) => (
                  <section className="container">
                    <div {...getRootProps({className: "dropzone"})}>
                      <input {...getInputProps()} />
                      <p>{i18next.t("file:Drop files here, or click upload")}</p>
                    </div>
                  </section>
                )}
              </Dropzone>
            </div>
          </div>
          <div className="box" id="upload">
            <div className="cell">
              <span className="gray">{i18next.t("file:Uploaded file")}</span>
            </div>
            {this.state.files?.map((file, index) => this.renderUploadFile(file, index))}
          </div>
          <div className="cell">
            <div className="fr" style={{paddingTop: "2px"}}>
              <div
                style={{
                  width: "400px",
                  height: "10px",
                  backgroundColor: "#e2e2e2",
                }}
              >
                <div
                  style={{
                    width: progressWidth + "px",
                    height: "10px",
                    backgroundColor: "#90909f",
                  }}
                >
                  &nbsp;
                </div>
              </div>
            </div>
            <span className="gray">
              <li className="fa fa-cloud-upload"></li>
              &nbsp; {i18next.t("file:You can upload")} {this.state.maxFileNum - this.state.filesNum} {i18next.t("file:files now")}
            </span>
          </div>
          <div className="inner">
            <span className="gray">
              <li className="fa fa-credit-card"></li>
              &nbsp; <Link to="/balance/add">{i18next.t("file:Recharge to get more storage space")}</Link>
            </span>
          </div>
        </div>
        <div className="sep20"></div>
        <div className="box">
          <div className="header">
            <li className="fa fa-info-circle"></li>
            {i18next.t("file:Privacy and content policy")}
          </div>
          <div className="cell">
            <span className="topic_content">
              {Setting.getForumName()}{" "}
              {i18next.t(
                "file:File Library is a storage and distribution service for publicly sharing files. The final links of all files will not be protected for privacy, and the Referer will not be checked, so external links without any restrictions can be supported."
              )}
              <br />
              <br />
              {i18next.t("file:If the file is something you do not want to be seen by others, then please do not upload it. At the same time, do not upload any file content that is prohibited by law.")}
            </span>
          </div>
        </div>
      </span>
    );
  }

  renderFile() {
    const file = this.state.file;

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> <Link to="/i?p=1">Files</Link> <span className="chevron">&nbsp;›&nbsp;</span> {file?.fileName}
        </div>
        <div className="cell" style={{textAlign: "center", padding: "12px"}}>
          {file?.fileType === "image" ? (
            <a href={file?.fileUrl} className="img_view" target="_blank" rel="noreferrer">
              <img src={file?.fileUrl} border="0" className="embedded_image" />
            </a>
          ) : (
            <a href={file?.fileUrl} className="img_view" target="_blank" rel="noreferrer">
              <div>{i18next.t("file:There is no preview for this type of file, click to download/view")}</div>
            </a>
          )}
        </div>
        <div className="cell">
          <span className="item_title">{file?.fileName}</span>
          <div className="sep5"></div>
          <span className="gray">
            {file?.fileType === "image" ? (
              <span>
                {this.state.fileWidth}𝖷{this.state.fileHeight} &nbsp;·&nbsp;
              </span>
            ) : null}
            {file?.fileExt} {i18next.t("file:file")} &nbsp;·&nbsp; {Setting.getFormattedSize(file?.size)} &nbsp;·&nbsp; {Setting.getPrettyDate(file?.createdTime)}
            <Link to={`/member/${file?.memberId}`}>{file?.memberId}</Link> {i18next.t("file:upload")} &nbsp;·&nbsp; {file?.views} {i18next.t("file:views")}
          </span>
        </div>
        {file?.desc.length !== 0 ? (
          <div className="cell">
            <div className="topic_content">{file?.desc}</div>
          </div>
        ) : null}
        <div className="cell_ops">
          <div className="fr">
            <input type="button" value={i18next.t("file:Delete")} className="super normal button" onClick={() => this.deleteFile(file)} />
          </div>
          <input type="button" value={i18next.t("file:Edit information")} className="super normal button" onClick={() => this.props.history.push(`/i/edit/${file?.id}`)} />
        </div>
      </div>
    );
  }

  // url: /i/edit/:fileId
  renderEditFile() {
    const file = this.state.file;

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> <Link to="/i">Files</Link> <span className="chevron">&nbsp;›&nbsp;</span> <Link to={`/i/${file?.id}`}>{file?.fileName}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("file:Edit file information")}
        </div>
        {this.renderProblem()}
        <div className="grid">
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="160" valign="top" align="center" className="image-edit-left">
                  {file?.fileType === "image" ? (
                    <Link to={`/i/${file?.id}`} target="_blank" title={i18next.t("file:Open in new window")}>
                      <img src={file?.fileUrl} border="0" width="160" />
                    </Link>
                  ) : (
                    <Link to={`/i/${file?.id}`} target="_blank">
                      <div style={{lineHeight: "100px"}}>{i18next.t("file:No preview for this type of file")}</div>
                    </Link>
                  )}
                  <div className="inner">
                    {file?.fileType === "image" ? (
                      <span>
                        {this.state.fileWidth}𝖷{this.state.fileHeight}
                        <div className="sep5"></div>
                      </span>
                    ) : null}
                    {file?.fileExt} {i18next.t("file:file")}
                    <div className="sep5"></div>
                    {Setting.getFormattedSize(file?.size)}
                    <div className="sep5"></div>
                    {file?.views} {i18next.t("file:views")}
                  </div>
                </td>
                <td width="auto" valign="top">
                  <table cellPadding="10" cellSpacing="0" border="0" width="100%">
                    <tr>
                      <td>
                        {i18next.t("file:File title")}
                        <div className="sep5"></div>
                        <input type="text" className="sl" name="title" maxLength="64" style={{width: "100%"}} value={this.state.form.fileName} onChange={(event) => this.updateFormField("fileName", event.target.value)} />
                        <div className="sep10"></div>
                        {i18next.t("file:Description")}
                        <div className="sep5"></div>
                        <textarea className="ml" style={{width: "100%"}} name="description" maxLength="1000" onChange={(event) => this.updateFormField("desc", event.target.value)} value={this.state.form.desc} />
                        <div className="sep10"></div>
                        <input type="submit" value={i18next.t("file:submit")} className="super normal button" onClick={() => this.editDesc()} />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  showPageColumn() {
    if (this.state.filesNum < this.state.limit) {
      return;
    }

    return <PageColumn page={this.state.page} total={this.state.filesNum} url={this.state.url} defaultPageNum={this.state.limit} />;
  }

  renderFiles(file) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "300" : "auto"} align="left">
                <Link to={`/i/${file.id}`}>{file?.fileName}</Link>
              </td>
              <td width="10"></td>
              <td width={pcBrowser ? "auto" : "80"} valign="middle" style={{textAlign: "center"}}>
                <span style={{fontSize: "13px"}}>{Setting.getFormattedSize(file?.size)}</span>
              </td>
              <td width="100" align="left" style={{textAlign: "center"}}>
                {Setting.getPrettyDate(file?.createdTime)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderProblem() {
    const problems = [];

    if (this.state.message !== "") {
      problems.push(i18next.t(`error:${this.state.message}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
        {problems.map((problem, i) => {
          return <li key={i}>{problem}</li>;
        })}
      </div>
    );
  }

  renderFileNotFound() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:File not found")}
        </div>
        <div className="cell">
          <span className="gray bigger">404 File Not Found</span>
        </div>
        <div className="inner">
          ← <Link to="/">{i18next.t("error:Back to Home Page")}</Link>
        </div>
      </div>
    );
  }

  renderFileLoading() {
    if (!Conf.ShowLoadingIndicator) {
      return null;
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:File is loading")}
        </div>
        <div className="cell">
          <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
        </div>
      </div>
    );
  }

  render() {
    const pcBrowser = Setting.PcBrowser;

    if (this.state.event === "upload") {
      if (this.props.account === null) {
        this.props.history.push(Setting.getSigninUrl());
      }
      return this.renderUpload();
    }

    if (this.state.event !== undefined && this.state.event !== "") {
      if (this.state.file !== null && this.state.file.length === 0) {
        return this.renderFileLoading();
      }
      if (this.state.file === null) {
        return this.renderFileNotFound();
      }
      if (this.props.edit) {
        return this.renderEditFile();
      }
      return this.renderFile();
    }

    // url: /i?p=x
    return (
      <div className="box">
        <div className="cell" style={{padding: "0px"}}>
          <table cellPadding="10" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="64">
                  <img src={Setting.getStatic("/img/essentials/images.png")} width="64" />
                </td>
                <td width={pcBrowser ? "200" : "auto"}>
                  <span className="item_title">
                    {this.props.account?.name} {i18next.t("file:'s file library")}
                  </span>
                  <div className="sep5"></div>
                  <span className="fade">
                    {i18next.t("file:There are")} {this.state.filesNum} {i18next.t("file:files")}
                  </span>
                </td>
                <td width="auto" align="center">
                  <li className="fa fa-cloud-upload"></li>
                  <Link to="/i/upload">{i18next.t("file:Upload new file")}</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="cell" style={{padding: "0px", textAlign: "center"}}>
          {Setting.PcBrowser ? this.showPageColumn() : null}
          {this.state.files !== null && this.state.files.length !== 0 ? this.state.files.map((file) => this.renderFiles(file)) : null}
          {this.showPageColumn()}
        </div>
      </div>
    );
  }
}

export default withRouter(FilesBox);

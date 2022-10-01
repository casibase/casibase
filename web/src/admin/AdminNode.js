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
import {Link, withRouter} from "react-router-dom";
import * as PlaneBackend from "../backend/PlaneBackend.js";
import * as TabBackend from "../backend/TabBackend.js";
import * as NodeBackend from "../backend/NodeBackend";
import * as Setting from "../Setting";
import * as Tools from "../main/Tools";
import * as FileBackend from "../backend/FileBackend";
import {Controlled as CodeMirror} from "react-codemirror2";
import {SketchPicker} from "react-color";
import Zmage from "react-zmage";
import "../codemirrorSize.css";
import Select2 from "react-select2-wrapper";
import i18next from "i18next";
import * as Conf from "../Conf";

class AdminNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: null,
      tabs: null,
      planes: null,
      message: "",
      errorMessage: "",
      form: {},
      nodeInfo: [],
      // event: props.match.params.event,
      nodeId: props.match.params.nodeId,
      topicNum: 0,
      favoritesNum: 0,
      width: "",
      event: "basic",
      Management_LIST: [
        {label: "Basic Info", value: "basic"},
        {label: "Background", value: "background"},
      ],
      Repeat_LIST: [
        {label: "Repeat", value: "repeat"},
        {label: "Repeat-x", value: "repeat-x"},
        {label: "Repeat-y", value: "repeat-y"},
      ],
      color: "#386d97",
      displayColorPicker: false,
    };
  }

  componentDidMount() {
    this.getNodes();
    this.getNodeInfo();
    this.getTabs();
    this.getPlanes();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState(
        {
          message: "",
          errorMessage: "",
          nodeId: newProps.match.params.nodeId,
        },
        () => {
          this.getNodeInfo();
        }
      );
    }
  }

  getNodes() {
    NodeBackend.getNodesAdmin().then((res) => {
      this.setState({
        nodes: res,
      });
    });
  }

  getTabs() {
    TabBackend.getAllTabs().then((res) => {
      this.setState({
        tabs: res,
      });
    });
  }

  getPlanes() {
    PlaneBackend.getPlanesAdmin().then((res) => {
      this.setState({
        planes: res,
      });
    });
  }

  getNodeInfo() {
    if (this.props.event === "new") {
      this.initForm();
    }
    if (this.state.nodeId === undefined) {
      return;
    }

    NodeBackend.getNode(this.state.nodeId).then((res) => {
      this.setState(
        {
          nodeInfo: res,
        },
        () => {
          this.initForm();
        }
      );
    });
    NodeBackend.getNodeInfo(this.state.nodeId).then((res) => {
      if (res.status === "ok") {
        this.setState({
          topicNum: res?.data,
          favoritesNum: res?.data2,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  // upload pic
  handleUploadImage(event, target) {
    this.updateFormField(target, i18next.t("file:Uploading..."));

    const file = event.target.files[0];
    let fileName;
    const fileType = Setting.getFileType(file.name);

    if (target === "headerImage") {
      fileName = "header";
    } else if (target === "backgroundImage") {
      fileName = "background";
    } else {
      fileName = "other";
    }
    fileName += "." + fileType.ext;

    const reader = new FileReader();
    reader.onload = (e) => {
      FileBackend.moderatorUpload(e.target.result, fileName, "sitecontent/nodes/" + this.state.nodeInfo.id).then((res) => {
        if (res?.status === "ok") {
          this.updateFormField(target, res.data);
        } else {
          this.setState({
            message: res?.msg,
          });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  initForm() {
    const form = this.state.form;
    if (this.props.event === "new") {
      form["sorter"] = 1;
    } else {
      form["id"] = this.state.nodeInfo?.id;
      form["name"] = this.state.nodeInfo?.name;
      form["createdTime"] = this.state.nodeInfo?.createdTime;
      form["desc"] = this.state.nodeInfo?.desc;
      form["image"] = this.state.nodeInfo?.image;
      form["tab"] = this.state.nodeInfo?.tab;
      form["parentNode"] = this.state.nodeInfo?.parentNode;
      form["planeId"] = this.state.nodeInfo?.planeId;
      form["hot"] = this.state.nodeInfo?.hot;
      form["tab"] = this.state.nodeInfo?.tab;
      form["sorter"] = this.state.nodeInfo?.sorter;
      form["moderators"] = this.state.nodeInfo?.moderators;
      form["backgroundImage"] = this.state.nodeInfo?.backgroundImage;
      form["backgroundColor"] = this.state.nodeInfo?.backgroundColor;
      form["backgroundRepeat"] = this.state.nodeInfo?.backgroundRepeat;
      form["headerImage"] = this.state.nodeInfo?.headerImage;
      form["mailingList"] = this.state.nodeInfo?.mailingList;
      form["googleGroupCookie"] = this.state.nodeInfo?.googleGroupCookie;
      form["gitterApiToken"] = this.state.nodeInfo?.gitterApiToken;
      form["gitterRoomUrl"] = this.state.nodeInfo?.gitterRoomUrl;
      form["isHidden"] = this.state.nodeInfo?.isHidden;
    }

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

  getIndexFromNodeId(nodeId) {
    for (let i = 0; i < this.state.nodes.length; i++) {
      if (this.state.nodes[i].nodeInfo.id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  getIndexFromTabId(tabId) {
    for (let i = 0; i < this.state.tabs.length; i++) {
      if (this.state.tabs[i].id === tabId) {
        return i;
      }
    }

    return -1;
  }

  getIndexFromPlaneId(planeId) {
    for (let i = 0; i < this.state.planes.length; i++) {
      if (this.state.planes[i].id === planeId) {
        return i;
      }
    }

    return -1;
  }

  updateNodeInfo() {
    NodeBackend.updateNode(this.state.nodeId, this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getNodeInfo();
        this.setState({
          message: i18next.t("node:Update node information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  postNewNode() {
    if (this.state.form.id === undefined || this.state.form.id === "") {
      this.setState({
        errorMessage: "Please input node ID",
      });
      return;
    }
    if (this.state.form.name === "" || this.state.form.name === undefined) {
      this.setState({
        errorMessage: "Please input node name",
      });
      return;
    }
    // remove parent node no select error
    if (this.state.form.tab === "" || this.state.form.tab === undefined) {
      this.setState({
        errorMessage: "Please select a tab",
      });
      return;
    }
    if (this.state.form.planeId === "" || this.state.form.planeId === undefined) {
      this.setState({
        errorMessage: "Please select a plane",
      });
      return;
    }

    NodeBackend.addNode(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getNodeInfo();
        this.setState(
          {
            errorMessage: "",
            message: i18next.t("node:Creat node success"),
          },
          () => {
            setTimeout(() => this.props.history.push(`/admin/node/edit/${encodeURIComponent(this.state.form.id)}`), 1600);
          }
        );
      } else {
        this.setState({
          errorMessage: i18next.t(`err:${res?.msg}`),
        });
      }
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  clearErrorMessage() {
    this.setState({
      errorMessage: "",
    });
  }

  handleColorChange = (color) => {
    this.updateFormField("backgroundColor", color.hex);
    // this.setState({ color: color.hex });
  };

  handleColorClick = () => {
    this.setState({
      displayColorPicker: !this.state.displayColorPicker,
    });
  };

  handleColorClose = () => {
    this.setState({
      displayColorPicker: false,
    });
  };

  changeEvent(event) {
    this.setState({
      event: event,
      message: "",
    });
    if (this.props.event !== "new") {
      this.initForm();
    }
  }

  renderProblem() {
    const problems = [];

    if (this.state.errorMessage !== "") {
      problems.push(i18next.t(`error:${this.state.errorMessage}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearErrorMessage()}>
        {i18next.t("error:Please resolve the following issues before submitting")}
        <ul>
          {problems.map((problem, i) => {
            return <li key={i}>{problem}</li>;
          })}
        </ul>
      </div>
    );
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.event === item.value ? "tab_current" : "tab"} onClick={() => this.changeEvent(item.value)}>
        {i18next.t(`node:${item.label}`)}
      </a>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin"}>{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin/node"}>{i18next.t("node:Node management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          {this.props.event === "new" ? <span>{i18next.t("node:New node")}</span> : <Link to={`/go/${encodeURIComponent(this.state.nodeId)}`}>{this.state.nodeInfo?.name}</Link>}
        </div>
        <div className="cell">
          {this.state.Management_LIST.map((item) => {
            return this.renderManagementList(item);
          })}
        </div>
      </div>
    );
  }

  renderNodes(node) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "200" : "auto"} align="left">
                <Link to={`/go/${encodeURIComponent(node?.nodeInfo.id)}`}>{node?.nodeInfo.name}</Link>
              </td>
              <td width={pcBrowser ? "200" : "auto"} align="center">
                <Link to={`/admin/node/edit/${encodeURIComponent(node?.nodeInfo.id)}`}>{i18next.t("node:Manage")}</Link>
              </td>
              <td width="10"></td>
              <td width={pcBrowser ? "auto" : "80"} valign="middle" style={{textAlign: "center"}}>
                <span style={{fontSize: "13px"}}>
                  {node?.nodeInfo.hot} {i18next.t("node:hot")}
                </span>
              </td>
              <td width="100" align="left" style={{textAlign: "center"}}>
                {node?.topicNum} {i18next.t("node:topics")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderRadioButton(item) {
    return (
      <span>
        <input type="radio" onClick={() => this.updateFormField("backgroundRepeat", item.value)} checked={item.value === this.state.form?.backgroundRepeat} name="repeat" />
        {i18next.t(`node:${item.label}`)}{" "}
      </span>
    );
  }

  renderSelect(item) {
    if (this.state.nodes === null) {
      return;
    }
    if (this.state.tabs === null) {
      return;
    }
    if (this.state.planes === null) {
      return;
    }

    let value, data;
    switch (item) {
      case "node":
        value = this.getIndexFromNodeId(this.state.form.parentNode);
        data = this.state.nodes.map((node, i) => {
          return {text: `${node.nodeInfo.name} / ${node.nodeInfo.id}`, id: i};
        });
        break;
      case "tab":
        value = this.getIndexFromTabId(this.state.form.tab);
        data = this.state.tabs.map((tab, i) => {
          return {text: `${tab.name} / ${tab.id}`, id: i};
        });
        break;
      case "plane":
        value = this.getIndexFromPlaneId(this.state.form.planeId);
        data = this.state.planes.map((plane, i) => {
          return {text: `${plane.name} / ${plane.id}`, id: i};
        });
        break;
      default:
        break;
    }

    return (
      <Select2
        value={value}
        style={{
          width: Setting.PcBrowser ? "300px" : "200px",
          fontSize: "14px",
        }}
        data={data}
        onSelect={(event) => {
          const s = event.target.value;
          if (s === null) {
            return;
          }

          const index = parseInt(s);
          switch (item) {
            case "node":
              const nodeId = this.state.nodes[index].nodeInfo.id;
              this.updateFormField("parentNode", nodeId);
              break;
            case "tab":
              const tab = this.state.tabs[index].id;
              this.updateFormField("tab", tab);
              break;
            case "plane":
              const planeId = this.state.planes[index].id;
              this.updateFormField("planeId", planeId);
              break;
            default:
              break;
          }
        }}
        options={{
          placeholder: i18next.t(`node:Please select a ${item}`),
        }}
      />
    );
  }

  renderNodeModerators(moderators) {
    return (
      <span>
        <Link to={`/member/${moderators}`} style={{fontWeight: "bolder"}} target="_blank">
          {moderators}
        </Link>
        &nbsp; &nbsp;
      </span>
    );
  }

  render() {
    const newNode = this.props.event === "new";

    if (this.state.nodeId !== undefined || newNode) {
      if (this.state.nodeId !== undefined) {
        if (this.state.nodeInfo !== null && this.state.nodeInfo.length === 0) {
          if (!Conf.ShowLoadingIndicator) {
            return null;
          }

          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Node is loading")}
              </div>
              <div className="cell">
                <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
              </div>
            </div>
          );
        }

        if (this.state.nodeInfo === null) {
          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Node not found")}
              </div>
              <div className="cell">
                {i18next.t("error:The node you are trying to view does not exist, there are several possibilities")}
                <div className="sep10"></div>
                <ul>
                  <li>{i18next.t("error:You entered a node ID that does not exist.")}</li>
                  <li>{i18next.t("error:The node is currently in invisible state.")}</li>
                </ul>
              </div>
              <div className="inner">
                {this.props.account === null ? (
                  <span className="gray">
                    <span className="chevron">‹</span> &nbsp;
                    {i18next.t("error:Back to")} <Link to="/">{i18next.t("error:Home Page")}</Link>
                  </span>
                ) : (
                  <span className="gray">
                    <span className="chevron">‹</span> &nbsp;
                    {i18next.t("error:Back to")} <Link to="/">{i18next.t("error:Home Page")}</Link>
                    <br />
                    <span className="chevron">‹</span> &nbsp;
                    {i18next.t("error:Back to")} <Link to={`/member/${this.props.account?.name}`}>{i18next.t("error:My profile")}</Link>
                  </span>
                )}
              </div>
            </div>
          );
        }
      }

      const image = document.getElementById("change_image");
      if (image !== null) {
        const contentWidth = image.clientWidth;
        if (this.state.width === "") {
          this.setState({
            width: contentWidth,
          });
        }
      }

      const node = this.state.nodeInfo;

      if (this.state.event === "basic") {
        return (
          <div>
            {this.renderHeader()}
            <div className="box">
              {this.renderProblem()}
              {this.state.message !== "" ? (
                <div className="message" onClick={() => this.clearMessage()}>
                  <li className="fa fa-exclamation-triangle"></li>
                  &nbsp; {this.state.message}
                </div>
              ) : null}
              <div className="inner">
                <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                  <tbody>
                    {newNode ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("node:Node ID")}
                        </td>
                        <td width="auto" align="left">
                          <input type="text" className="sl" name="id" id="node_id" value={this.state.form?.id} onChange={(event) => this.updateFormField("id", event.target.value)} autoComplete="off" />
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Node name")}
                      </td>
                      <td width="auto" align="left">
                        {newNode ? (
                          <input type="text" className="sl" name="name" id="node_name" value={this.state.form?.name === undefined ? "" : this.state.form?.name} onChange={(event) => this.updateFormField("name", event.target.value)} autoComplete="off" />
                        ) : (
                          <Link to={`/go/${encodeURIComponent(this.state.nodeId)}`}>{node?.name}</Link>
                        )}
                      </td>
                    </tr>
                    {!newNode ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("node:Created time")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{node?.createdTime}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Image")}
                      </td>
                      <td width="auto" align="left">
                        {this.state.form?.image === undefined || this.state.form?.image === "" ? (
                          <span className="gray">{i18next.t("node:Not set")}</span>
                        ) : (
                          <Zmage src={this.state.form?.image} alt={this.state.form?.id} style={{maxWidth: "48px", maxHeight: "48px"}} />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {newNode ? i18next.t("node:Set image") : i18next.t("node:Change image")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="image" id="change_image" defaultValue={this.state.form?.image} onChange={(event) => this.updateFormField("image", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    {!newNode ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("node:Total topics")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{this.state.topicNum}</span>
                        </td>
                      </tr>
                    ) : null}
                    {!newNode ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("node:Total favorites")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{this.state.favoritesNum}</span>
                        </td>
                      </tr>
                    ) : null}
                    {!newNode ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("node:Hot")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{node?.hot}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Sorter")}
                      </td>
                      <td width="auto" align="left">
                        <input type="range" min="1" max="1000" step="1" value={this.state.form?.sorter === undefined ? 1 : this.state.form?.sorter} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                        &nbsp; &nbsp; <input type="number" name="sorter" min="1" max="1000" step="1" value={this.state.form?.sorter} style={{width: "50px"}} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Parent node")}
                      </td>
                      <td width="auto" align="left">
                        {this.renderSelect("node")}
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Tab")}
                      </td>
                      <td width="auto" align="left">
                        {this.renderSelect("tab")}
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Plane")}
                      </td>
                      <td width="auto" align="left">
                        {this.renderSelect("plane")}
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Mailing List")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="mailingList" defaultValue={this.state.form?.mailingList} onChange={(event) => this.updateFormField("mailingList", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Google Group Cookie")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="googleGroupCookie" defaultValue={this.state.form?.googleGroupCookie} onChange={(event) => this.updateFormField("googleGroupCookie", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Gitter API Token")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="gitterApiToken" defaultValue={this.state.form?.gitterApiToken} onChange={(event) => this.updateFormField("gitterApiToken", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Gitter Room URL")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="gitterRoomUrl" defaultValue={this.state.form?.gitterRoomUrl} onChange={(event) => this.updateFormField("gitterRoomUrl", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Is hidden")}
                      </td>
                      <td width="auto" align="left">
                        <input type="radio" onClick={() => this.updateFormField("isHidden", false)} checked={!this.state.form?.isHidden} name="visible" />
                        {i18next.t("plane:Visible")} <input type="radio" onClick={() => this.updateFormField("isHidden", true)} checked={this.state.form?.isHidden} name="invisible" />
                        {i18next.t("plane:Invisible")}
                      </td>
                    </tr>
                    {!newNode ? (
                      this.state.nodeInfo?.moderators !== null && this.state.nodeInfo?.moderators.length !== 0 ? (
                        <tr>
                          <td width="120" align="right">
                            {i18next.t("node:Moderators")}
                          </td>
                          <td width="auto" align="left">
                            {this.state.nodeInfo?.moderators.map((moderators) => this.renderNodeModerators(moderators))}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td width="120" align="right">
                            {i18next.t("node:Moderators")}
                          </td>
                          <td width="auto" align="left">
                            <span className="gray">{i18next.t("node:No moderators")}</span>
                          </td>
                        </tr>
                      )
                    ) : null}
                    {!newNode ? (
                      <tr>
                        <td width="120" align="right"></td>
                        <td width="auto" align="left">
                          <span className="gray">
                            <Link to={`/go/${encodeURIComponent(this.state.nodeId)}/moderators`}>{i18next.t("node:Manage moderators")}</Link>
                          </span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("node:Description")}
                      </td>
                      <td>
                        <div
                          style={{
                            overflow: "hidden",
                            overflowWrap: "break-word",
                            resize: "none",
                          }}
                          className="mle"
                          id="node_description"
                        >
                          <div className={"cm-middle-unresizable-content"}>
                            <CodeMirror
                              editorDidMount={(editor) => Tools.attachEditor(editor)}
                              onPaste={() => Tools.uploadMdFile()}
                              value={this.state.form.desc}
                              onDrop={() => Tools.uploadMdFile()}
                              options={{
                                mode: "markdown",
                                lineNumbers: false,
                                lineWrapping: true,
                              }}
                              onBeforeChange={(editor, data, value) => {
                                this.updateFormField("desc", value);
                              }}
                              onChange={(editor, data, value) => {}}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right"></td>
                      <td width="auto" align="left">
                        {!newNode ? <input type="submit" disabled={Setting.isFileUploading(this.state.form.desc)} className="super normal button" value={i18next.t("node:Save")} onClick={() => this.updateNodeInfo()} /> : null}
                      </td>
                    </tr>
                    {newNode ? (
                      <tr>
                        <td width="120" align="right"></td>
                        <td width="auto" align="left">
                          <span className="gray">{i18next.t("node:Please go to the background page to continue to improve the information and submit")}</span>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      // background
      return (
        <div>
          {this.renderHeader()}
          <div className="box">
            {this.renderProblem()}
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
                    <td width="120" align="right">
                      {i18next.t("node:Header image")}
                    </td>
                    <td width="auto" align="left">
                      {this.state.form?.headerImage === undefined || this.state.form?.headerImage === "" ? (
                        <span className="gray">{i18next.t("node:Not set")}</span>
                      ) : (
                        <Zmage src={this.state.form?.headerImage} alt={this.state.form?.id} style={{maxWidth: "48px", maxHeight: "48px"}} />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {newNode ? i18next.t("node:Set header image") : i18next.t("node:Change header image")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        type="text"
                        className="sl"
                        name="image"
                        id="change_header"
                        value={this.state.form?.headerImage === undefined ? "" : this.state.form?.headerImage}
                        onChange={(event) => this.updateFormField("headerImage", event.target.value)}
                        autoComplete="off"
                      />{" "}
                      &nbsp; <input type="file" accept=".jpg,.gif,.png,.JPG,.GIF,.PNG" onChange={(event) => this.handleUploadImage(event, "headerImage")} name="headerImage" style={{width: "200px"}} />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Background image")}
                    </td>
                    <td width="auto" align="left">
                      {this.state.form?.backgroundImage === undefined || this.state.form?.backgroundImage === "" ? (
                        <span className="gray">{i18next.t("node:Not set")}</span>
                      ) : (
                        <Zmage src={this.state.form?.backgroundImage} alt={this.state.form?.id} style={{maxWidth: "48px", maxHeight: "48px"}} />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {newNode ? i18next.t("node:Set background image") : i18next.t("node:Change background image")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        type="text"
                        className="sl"
                        name="image"
                        id="change_image"
                        value={this.state.form?.backgroundImage === undefined ? "" : this.state.form?.backgroundImage}
                        onChange={(event) => this.updateFormField("backgroundImage", event.target.value)}
                        autoComplete="off"
                      />{" "}
                      &nbsp; <input type="file" accept=".jpg,.gif,.png,.JPG,.GIF,.PNG" onChange={(event) => this.handleUploadImage(event, "backgroundImage")} name="backgroundImage" style={{width: "200px"}} />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Background repeat")}
                    </td>
                    <td width="auto" align="left">
                      {this.state.Repeat_LIST.map((item) => {
                        return this.renderRadioButton(item);
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Background color")}
                    </td>
                    <td width="auto" align="left">
                      <div
                        style={{
                          padding: "5px",
                          background: "#fff",
                          borderRadius: "1px",
                          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
                          display: "inline-block",
                          cursor: "pointer",
                        }}
                        onClick={this.handleColorClick}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "14px",
                            borderRadius: "2px",
                            background: `${this.state.form.backgroundColor}`,
                          }}
                        />
                      </div>
                      {this.state.displayColorPicker ? (
                        <div
                          style={{
                            position: "absolute",
                            zIndex: "2",
                          }}
                        >
                          <div
                            style={{
                              position: "fixed",
                              top: "0px",
                              right: "0px",
                              bottom: "0px",
                              left: "0px",
                            }}
                            onClick={this.handleColorClose}
                          />
                          <SketchPicker color={this.state.form.backgroundColor} onChange={this.handleColorChange} />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Preview")}
                    </td>
                    <td width="auto" align="left">
                      <div
                        id="Wrapper"
                        style={{
                          backgroundColor: `${this.state.form?.backgroundColor}`,
                          backgroundImage: `url(${this.state.form?.backgroundImage}), url(${Setting.getStatic("/img/shadow_light.png")})`,
                          backgroundSize: "contain",
                          backgroundRepeat: `${this.state.form?.backgroundRepeat}, repeat-x`,
                          width: Setting.PcBrowser ? "500px" : "200px",
                          height: Setting.PcBrowser ? "400px" : "100px",
                        }}
                        className={this.state.nodeId}
                      ></div>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      {newNode ? (
                        <input type="submit" className="super normal button" value={i18next.t("node:Create")} onClick={() => this.postNewNode()} />
                      ) : (
                        <input type="submit" className="super normal button" value={i18next.t("node:Save")} onClick={() => this.updateNodeInfo()} />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("node:Node management")}
          <div className="fr f12">
            <span className="snow">{i18next.t("node:Total nodes")} &nbsp;</span>
            <strong className="gray">{this.state.nodes === null ? 0 : this.state.nodes.length}</strong>
          </div>
          <div className="fr f12">
            <strong className="gray">
              <Link to="node/new">{i18next.t("node:Add new node")}</Link> &nbsp;
            </strong>
          </div>
        </div>
        <div id="all-nodes">
          {this.state.nodes !== null && this.state.nodes.length !== 0 ? (
            this.state.nodes.map((node) => this.renderNodes(node))
          ) : (
            <div
              className="cell"
              style={{
                textAlign: "center",
                height: "100px",
                lineHeight: "100px",
              }}
            >
              {this.state.nodes === null ? i18next.t("loading:Data is loading...") : i18next.t("node:No node yet")}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(AdminNode);

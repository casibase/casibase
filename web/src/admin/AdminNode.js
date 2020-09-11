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
import {withRouter} from "react-router-dom";
import * as PlaneBackend from "../backend/PlaneBackend.js";
import * as TabBackend from "../backend/TabBackend.js";
import * as NodeBackend from "../backend/NodeBackend";
import * as Setting from "../Setting";
import * as Tools from "../main/Tools";
import {Resizable} from "re-resizable";
import {Controlled as CodeMirror} from "react-codemirror2";
import Zmage from "react-zmage";
import Select2 from "react-select2-wrapper";
import $ from "jquery";
import i18next from "i18next";

class AdminNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: [],
      tabs: [],
      planes: [],
      message: "",
      form: {},
      nodeInfo: [],
      //event: props.match.params.event,
      nodeId: props.match.params.nodeId,
      topicNum: 0,
      favoritesNum: 0,
      width: "",
    };
  }

  componentDidMount() {
    this.getNodes();
    this.getNodeInfo();
    this.getTabs();
    this.getPlanes();
  }

  getNodes() {
    NodeBackend.getNodesAdmin()
      .then((res) => {
        this.setState({
          nodes: res,
        });
      });
  }

  getTabs() {
    if (this.state.nodeId === undefined) {
      return;
    }

    TabBackend.getAllTabs()
      .then((res) => {
        this.setState({
          tabs: res,
        });
      });
  }

  getPlanes() {
    if (this.state.nodeId === undefined) {
      return;
    }

    PlaneBackend.getPlanesAdmin()
      .then((res) => {
        this.setState({
          planes: res,
        });
      });
  }

  getNodeInfo() {
    if (this.state.nodeId === undefined) {
      return;
    }

    NodeBackend.getNode(this.state.nodeId)
      .then((res) => {
        this.setState({
          nodeInfo: res,
        }, () => {
          this.initForm();
        });
      });
    NodeBackend.getNodeInfo(this.state.nodeId)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            topicNum: res?.data,
            favoritesNum: res?.data2,
          });
        }else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  initForm() {
    let form = this.state.form;
    form["id"] = this.state.nodeInfo?.id;
    form["name"] = this.state.nodeInfo?.name;
    form["createdTime"] = this.state.nodeInfo?.createdTime;
    form["desc"] = this.state.nodeInfo?.desc;
    form["image"] = this.state.nodeInfo?.image;
    form["tabId"] = this.state.nodeInfo?.tabId;
    form["parentNode"] = this.state.nodeInfo?.parentNode;
    form["planeId"] = this.state.nodeInfo?.planeId;
    form["hot"] = this.state.nodeInfo?.hot;
    form["tab"] = this.state.nodeInfo?.tab;
    form["moderators"] = this.state.nodeInfo?.moderators;
    this.setState({
      form: form,
    });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  getIndexFromNodeId(nodeId) {
    for (let i = 0; i < this.state.nodes.length; i ++) {
      if (this.state.nodes[i].nodeInfo.id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  getIndexFromTabId(tabId) {
    for (let i = 0; i < this.state.tabs.length; i ++) {
      if (this.state.tabs[i].id === tabId) {
        return i;
      }
    }

    return -1;
  }

  getIndexFromPlaneId(planeId) {
    for (let i = 0; i < this.state.planes.length; i ++) {
      if (this.state.planes[i].id === planeId) {
        return i;
      }
    }

    return -1;
  }

  updateNodeInfo() {
    NodeBackend.updateNode(this.state.nodeId, this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          this.getNodeInfo();
          this.setState({
            message: i18next.t("node:Update node information success"),
          });
        } else {
          this.setState({
            message: i18next.t(`err:${res?.msg}`),
          });
        }
      });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  renderNodes(node) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <a href={`/go/${node?.nodeInfo.id}`}>
                {node?.nodeInfo.name}
              </a>
            </td>
            <td width={pcBrowser ? "200" : "auto"} align="center">
              <a href={`/admin/node/${node?.nodeInfo.id}`}>
                {i18next.t("node:Manage")}
              </a>
            </td>
            <td width="10"></td>
            <td width={pcBrowser ? "auto" : "80"} valign="middle" style={{textAlign: "center"}}>
              <span style={{fontSize: "13px"}}>
                {node?.nodeInfo.hot}{" "}{i18next.t("node:hot")}
              </span>
            </td>
            <td  width="100" align="left" style={{textAlign: "center"}}>
              {node?.topicNum}{" "}{i18next.t("node:topics")}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderSelect(item) {
    let value, data;
    switch (item) {
      case "node":
        value = this.getIndexFromNodeId(this.state.form.parentNode);
        data= this.state.nodes.map((node, i) => {
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
    }

    return (
      <Select2
        value={value}
        style={{width: "300px", fontSize: "14px"}}
        data={data}
        onSelect={event => {
          const s = $(event.target).val();
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
          }
        }}
        options={
          {
            placeholder: i18next.t(`new:Please select a ${item}`),
          }
        }
      />
    );
  }

  renderNodeModerators(moderators) {
    return (
      <span>
        <a href={`/member/${moderators}`} style={{fontWeight: "bolder"}} target="_blank">{moderators}</a>&nbsp;{" "}&nbsp;
      </span>
    );
  }

  render() {
    if (this.state.nodeId !== undefined) {
      if (this.state.nodeInfo !== null && this.state.nodeInfo.length === 0) {
        return (
          <div className="box">
            <div className="header"><a href="/">{Setting.getForumName()}</a><span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("loading:Node is loading")}</div>
            <div className="cell"><span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span></div>
          </div>
        );
      }

      if (this.state.nodeInfo === null) {
        return (
          <div class="box">
            <div class="header">
              <a href="/">{Setting.getForumName()}</a>
              <span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("error:Node not found")}</div>
            <div class="cell">
              {i18next.t("error:The node you are trying to view does not exist, there are several possibilities")}
              <div class="sep10"></div>
              <ul>
                <li>{i18next.t("error:You entered a node ID that does not exist.")}</li>
                <li>{i18next.t("error:The node is currently in invisible state.")}</li>
              </ul>
            </div>
            <div class="inner">
              {
                this.props.account === null ?
                  <span className="gray">
                  <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a href="/">{i18next.t("error:Home Page")}</a>
                </span> :
                  <span className="gray">
                  <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a href="/">{i18next.t("error:Home Page")}</a>
                  <br/>
                  <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a
                    href={`/member/${this.props.account?.id}`}>{i18next.t("error:My profile")}</a>
                </span>
              }
            </div>
          </div>
        );
      }

      const image = document.getElementById('change_image');
      if (image !== null) {
        let contentWidth = image.clientWidth;
        if (this.state.width === "") {
          this.setState({
            width: contentWidth
          });
        }
      }

      const node = this.state.nodeInfo;

      return (
        <div className="box">
          <div className="header"><a href="/">{Setting.getForumName()}</a>
            {" "}<span className="chevron">&nbsp;›&nbsp;</span>
            <a href={`/admin/node`}>{i18next.t("node:Node management")}</a>
            {" "}<span className="chevron">&nbsp;›&nbsp;</span>
            <a href={`/go/${this.state.nodeId}`}>{this.state.nodeInfo?.name}</a>
          </div>
          {
            this.state.message !== "" ?
              <div className="message" onClick={() => this.clearMessage()}>
                <li className="fa fa-exclamation-triangle"></li>
                &nbsp;{" "}
                {this.state.message}
              </div> : null
          }
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
              <tr>
                <td width="120" align="right">{i18next.t("node:Node name")} ID</td>
                <td width="auto" align="left">
                  <a href={`/go/${this.state.nodeId}`}>{node?.name}</a>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Created time")}</td>
                <td width="auto" align="left">
                  <span className="gray">
                    {node?.createdTime}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Image")}</td>
                <td width="auto" align="left">
                  <Zmage
                    src={node?.image} alt={node?.image} style={{maxWidth: "48px", maxHeight: "48px"}}
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Change image")}</td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="image" id="change_image" defaultValue={node?.image} onChange={event => this.updateFormField("image", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Total topics")}</td>
                <td width="auto" align="left">
                  <span className="gray">
                    {this.state.topicNum}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Total favorites")}</td>
                <td width="auto" align="left">
                  <span className="gray">
                    {this.state.favoritesNum}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Hot")}</td>
                <td width="auto" align="left">
                  <span className="gray">
                    {node?.hot}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Parent node")}</td>
                <td width="auto" align="left">
                  {this.renderSelect("node")}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Tab")}</td>
                <td width="auto" align="left">
                  {this.renderSelect("tab")}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Plane")}</td>
                <td width="auto" align="left">
                  {this.renderSelect("plane")}
                </td>
              </tr>
              {
                this.state.nodeInfo?.moderators !== null && this.state.nodeInfo?.moderators.length !== 0 ?
                  <tr>
                    <td width="120" align="right">{i18next.t("node:Moderators")}</td>
                    <td width="auto" align="left">
                      {this.state.nodeInfo?.moderators.map(moderators => this.renderNodeModerators(moderators))}
                    </td>
                  </tr>:
                  <tr>
                    <td width="120" align="right">{i18next.t("node:Moderators")}</td>
                    <td width="auto" align="left">
                        <span class="gray">
                          {i18next.t("node:No moderators")}
                        </span>
                    </td>
                  </tr>
              }
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left">
                  <span className="gray">
                    <a href={`/go/${this.state.nodeId}/moderators`}>
                      {i18next.t("node:Manage moderators")}
                    </a>
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">{i18next.t("node:Description")}</td>
                <td>
                  <div style={{overflow: "hidden", overflowWrap: "break-word", resize: "none", height: "172"}} className="mle" id="node_description" >
                    <Resizable
                      enable={false}
                      defaultSize={{
                        width: this.state.width,
                        height: 180,
                      }}
                    >
                      <CodeMirror
                        editorDidMount={(editor) => Tools.attachEditor(editor)}
                        onPaste={() => Tools.uploadMdFile()}
                        value={this.state.form.desc}
                        onDrop={() => Tools.uploadMdFile()}
                        options={{mode: 'markdown', lineNumbers: false}}
                        onBeforeChange={(editor, data, value) => {
                          this.updateFormField("desc", value)
                        }}
                        onChange={(editor, data, value) => {
                        }}
                      />
                    </Resizable>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left">
                  <input type="submit" className="super normal button" value={i18next.t("node:Save")} onClick={() => this.updateNodeInfo()}/></td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="box">
        <div className="header">
          <a href="/">{Setting.getForumName()}</a>
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("node:Node management")}
          <div className="fr f12">
            <span className="snow">{i18next.t("node:Total nodes")}{" "}&nbsp;</span>
            <strong className="gray">{this.state.nodes.length}</strong></div>
        </div>
        <div id="all-nodes">
          {
            this.state.nodes.length !== 0 ?
              this.state.nodes.map(node => this.renderNodes(node)) : null
          }
        </div>
      </div>
    );
  }
}

export default withRouter(AdminNode);

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
import * as TabBackend from "../backend/TabBackend.js";
import * as Setting from "../Setting";
import Select2 from "react-select2-wrapper";
import i18next from "i18next";
import * as Conf from "../Conf";

class AdminTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: [],
      tabs: null,
      message: "",
      errorMessage: "",
      form: {},
      tab: [],
      // event: props.match.params.event,
      tabId: props.match.params.tabId,
      width: "",
      event: "basic",
      Management_LIST: [{label: "Basic Info", value: "basic"}],
    };
  }

  componentDidMount() {
    this.getTabNodes();
    this.getTab();
    this.getTabs();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState(
        {
          message: "",
          errorMessage: "",
          tabId: newProps.match.params.tabId,
        },
        () => {
          this.getTab();
          this.initForm();
        }
      );
    }
  }

  getTabs() {
    TabBackend.getTabsAdmin().then((res) => {
      this.setState({
        tabs: res,
      });
    });
  }

  getTabNodes() {
    if (this.state.tabId === undefined && this.props.event !== "new") {
      return;
    }

    TabBackend.getTabWithNode(this.state.tabId).then((res) => {
      this.setState({
        nodes: res?.data2,
      });
    });
  }

  getTab() {
    if (this.state.tabId === undefined) {
      return;
    }

    TabBackend.getTabAdmin(this.state.tabId).then((res) => {
      this.setState(
        {
          tab: res,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  initForm() {
    const form = this.state.form;
    if (this.props.event === "new") {
      form["sorter"] = 1;
      form["homePage"] = false;
    } else {
      form["id"] = this.state.tab?.id;
      form["name"] = this.state.tab?.name;
      form["createdTime"] = this.state.tab?.createdTime;
      form["sorter"] = this.state.tab?.sorter;
      form["defaultNode"] = this.state.tab?.defaultNode;
      form["homePage"] = this.state.tab?.homePage;
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
      if (this.state.nodes[i].id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  deleteTab(tab, topicsNum, nodesNum) {
    if (window.confirm(`${i18next.t("tab:Are you sure to delete tab")} ${tab} ?`)) {
      if (topicsNum !== 0 || nodesNum !== 0) {
        alert(`
        ${i18next.t("tab:Please delete all the nodes and posts under the tab before deleting the tab")}
        ${i18next.t("tab:Currently the number of nodes under the tab is")} ${nodesNum} ${i18next.t("tab:, the number of posts is")} ${nodesNum}
        `);
      } else {
        TabBackend.deleteTab(tab).then((res) => {
          if (res.status === "ok") {
            this.setState({
              message: `${i18next.t("tab:Delete tab")} ${tab} ${i18next.t("tab:success")}`,
            });
            this.getTabs();
          } else {
            this.setState({
              errorMessage: res?.msg,
            });
          }
        });
      }
    }
  }

  updateTabInfo() {
    TabBackend.updateTab(this.state.tabId, this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getTab();
        this.getTabNodes();
        this.setState({
          message: i18next.t("tab:Update tab information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  postNewTab() {
    if (this.state.form.id === undefined || this.state.form.id === "") {
      this.setState({
        errorMessage: "Please input tab ID",
      });
      return;
    }
    if (this.state.form.name === "" || this.state.form.name === undefined) {
      this.setState({
        errorMessage: "Please input tab name",
      });
      return;
    }

    TabBackend.addTab(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getTabs();
        this.setState(
          {
            errorMessage: "",
            message: i18next.t("tab:Creat tab success"),
          },
          () => {
            setTimeout(() => this.props.history.push(`/admin/tab/edit/${this.state.form.id}`), 1600);
          }
        );
      } else {
        this.setState({
          errorMessage: res?.msg,
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
        {i18next.t(`tab:${item.label}`)}
      </a>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin"}>{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin/tab"}>{i18next.t("tab:Tab management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <span>{this.props.event === "new" ? i18next.t("tab:New tab") : this.state.tabId}</span>
        </div>
        <div className="cell">
          {this.state.Management_LIST.map((item) => {
            return this.renderManagementList(item);
          })}
        </div>
      </div>
    );
  }

  renderTabs(tab) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "200" : "auto"} align="left">
                <span className="gray">{tab?.name}</span>
              </td>
              <td width={pcBrowser ? "100" : "auto"} align="center">
                <Link to={`/admin/tab/edit/${tab?.id}`}>{i18next.t("tab:Manage")}</Link>
              </td>
              <td width="10"></td>
              <td width={pcBrowser ? "120" : "80"} valign="middle" style={{textAlign: "center"}}>
                <span style={{fontSize: "13px"}}>
                  {tab?.topicsNum} {i18next.t("tab:topics")}
                </span>
              </td>
              <td width={pcBrowser ? "120" : "80"} align="left" style={{textAlign: "center"}}>
                {tab?.nodesNum} {i18next.t("tab:nodes")}
              </td>
              <td width="50" align="left" style={{textAlign: "right"}}>
                <a href="#" onClick={() => this.deleteTab(tab?.id, tab?.topicsNum, tab?.nodesNum)}>
                  {i18next.t("tab:Delete")}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const newTab = this.props.event === "new";

    if (this.state.tabId !== undefined || newTab) {
      if (this.state.tabId !== undefined) {
        if (this.state.tab !== null && this.state.tab.length === 0) {
          if (!Conf.ShowLoadingIndicator) {
            return null;
          }

          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Page is loading")}
              </div>
              <div className="cell">
                <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
              </div>
            </div>
          );
        }

        if (this.state.tab === null) {
          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Tab not found")}
              </div>
              <div className="cell">{i18next.t("error:The tab you are trying to view does not exist")}</div>
            </div>
          );
        }
      }

      const tab = this.state.tab;

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
                  {newTab ? (
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("tab:Tab ID")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="id" id="tab_id" value={this.state.form?.id} onChange={(event) => this.updateFormField("id", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("tab:Tab name")}
                    </td>
                    <td width="auto" align="left">
                      <input type="text" className="sl" name="name" id="tab_name" value={this.state.form?.name === undefined ? "" : this.state.form?.name} onChange={(event) => this.updateFormField("name", event.target.value)} autoComplete="off" />
                    </td>
                  </tr>
                  {!newTab ? (
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("tab:Created time")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{tab?.createdTime}</span>
                      </td>
                    </tr>
                  ) : null}
                  {!newTab ? (
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("tab:Total topics")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{tab?.topicsNum}</span>
                      </td>
                    </tr>
                  ) : null}
                  {!newTab ? (
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("tab:Total nodes")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{tab?.nodesNum}</span>
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("tab:Sorter")}
                    </td>
                    <td width="auto" align="left">
                      <input type="range" min="1" max="1000" step="1" value={this.state.form?.sorter === undefined ? 1 : this.state.form?.sorter} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                      &nbsp; &nbsp; <input type="number" name="sorter" min="1" max="1000" step="1" value={this.state.form?.sorter} style={{width: "50px"}} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      <span className="gray">{i18next.t("tab:Decide the order of node navigation and homepage")}</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("tab:Home page")}
                    </td>
                    <td width="auto" align="left">
                      <input type="radio" onClick={() => this.updateFormField("homePage", true)} checked={this.state.form?.homePage} name="homePage" />
                      {i18next.t("tab:show")} <input type="radio" onClick={() => this.updateFormField("homePage", false)} checked={!this.state.form?.homePage} name="homePage" />
                      {i18next.t("tab:hidden")}
                    </td>
                  </tr>
                  {this.state.form?.homePage ? (
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("tab:Default node")}
                      </td>
                      <td width="auto" align="left">
                        {tab?.nodesNum !== 0 && tab?.nodesNum !== undefined ? (
                          <Select2
                            value={this.getIndexFromNodeId(this.state.form?.defaultNode)}
                            style={{
                              width: Setting.PcBrowser ? "300px" : "200px",
                              fontSize: "14px",
                            }}
                            data={this.state.nodes.map((node, i) => {
                              return {
                                text: `${node.name} / ${node.id}`,
                                id: i,
                              };
                            })}
                            onSelect={(event) => {
                              const s = event.target.value;
                              if (s === null) {
                                return;
                              }

                              const index = parseInt(s);
                              const nodeId = this.state.nodes[index].id;
                              this.updateFormField("defaultNode", nodeId);
                            }}
                            options={{
                              placeholder: i18next.t("tab:Please select a default node"),
                            }}
                          />
                        ) : (
                          <span className="gray">{i18next.t("tab:No node exists in this tab")}</span>
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {this.state.form?.homePage ? (
                    <tr>
                      <td width="120" align="right"></td>
                      <td width="auto" align="left">
                        <span className="gray">{i18next.t("tab:The default node when creating a topic on the homepage")}</span>
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      {!newTab ? (
                        <input type="submit" className="super normal button" value={i18next.t("tab:Save")} onClick={() => this.updateTabInfo()} />
                      ) : (
                        <input type="submit" className="super normal button" value={i18next.t("tab:Create")} onClick={() => this.postNewTab()} />
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
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          {i18next.t("tab:Tab management")}
          <div className="fr f12">
            <span className="snow">{i18next.t("tab:Total tabs")} &nbsp;</span>
            <strong className="gray">{this.state.tabs === null ? 0 : this.state.tabs.length}</strong>
          </div>
          <div className="fr f12">
            <strong className="gray">
              <Link to="tab/new">{i18next.t("tab:Add new tab")}</Link> &nbsp;
            </strong>
          </div>
        </div>
        {this.state.message !== "" ? (
          <div className="message" onClick={() => this.clearMessage()}>
            <li className="fa fa-exclamation-triangle"></li>
            &nbsp; {this.state.message}
          </div>
        ) : null}
        <div id="all-tabs">
          {this.state.tabs !== null && this.state.tabs.length !== 0 ? (
            this.state.tabs.map((tab) => this.renderTabs(tab))
          ) : (
            <div
              className="cell"
              style={{
                textAlign: "center",
                height: "100px",
                lineHeight: "100px",
              }}
            >
              {this.state.tabs === null ? i18next.t("loading:Data is loading...") : i18next.t("tab:No tab yet")}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(AdminTab);

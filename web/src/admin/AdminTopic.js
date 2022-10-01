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
import * as TopicBackend from "../backend/TopicBackend.js";
import * as Setting from "../Setting";
import PageColumn from "../main/PageColumn";
import Collapse, {Panel} from "rc-collapse";
import ReactMarkdown from "react-markdown";
import Zmage from "react-zmage";
import i18next from "i18next";
import * as Conf from "../Conf";

class AdminTopic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      message: "",
      errorMessage: "",
      form: {},
      // event: props.match.params.event,
      width: "",
      p: "",
      topicId: props.match.params.topicId,
      event: "basic",
      page: 1,
      limit: 100,
      minPage: 1,
      maxPage: -1,
      showSearch: false,
      loading: true,
      topicsNum: 0,
      topics: null,
      topic: [],
      // un, ti, cn, cs, lrs, us, rcs, hs, fcs
      un: "", // username search
      ti: "", // title search
      cn: "", // content search
      sdt: 1, // show deleted topics, default: Show
      cs: 1, // created time sort, default: Asc
      lrs: 0, // last reply time sort, default: None
      us: 0, // username sort, default: None
      rcs: 0, // reply count sort, default: None
      hs: 0, // hot sort, default: None
      fcs: 0, // favorite count sort, default: None
      Status_LIST: [
        {label: "Normal", value: 1},
        {label: "Deleted", value: 2},
        {label: "Topping", value: 3},
      ],
      Management_LIST: [
        {label: "Basic Info", value: "basic"},
        {label: "Content", value: "content"},
      ],
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }

    this.state.url = "/admin/topic";
  }

  componentDidMount() {
    this.getTopics();
    this.getTopic();
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
          message: "",
          errorMessage: "",
          topicId: newProps.match.params.topicId,
          page: parseInt(page),
        },
        () => {
          this.getTopics();
          this.getTopic();
        }
      );
    }
  }

  getTopics() {
    if (this.state.topicId !== undefined) {
      return;
    }

    // un, ti, cn, sdt, cs, lrs, us, rcs, hs, fcs
    TopicBackend.getTopicsAdmin(this.state.un, this.state.ti, this.state.cn, this.state.sdt, this.state.cs, this.state.lrs, this.state.us, this.state.rcs, this.state.hs, this.state.fcs, this.state.limit, this.state.page).then((res) => {
      this.setState({
        topics: res?.data,
        topicsNum: res?.data2,
      });
    });
  }

  getTopic() {
    if (this.state.topicId === undefined) {
      return;
    }

    TopicBackend.getTopicAdmin(this.state.topicId).then((res) => {
      this.setState(
        {
          topic: res,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  initForm() {
    const form = this.state.form;
    form["deleted"] = this.state.topic?.deleted;
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

  getSearchResult() {
    TopicBackend.getTopicsAdmin(this.state.un, this.state.ti, this.state.cn, this.state.sdt, this.state.cs, this.state.lrs, this.state.us, this.state.rcs, this.state.hs, this.state.fcs, this.state.limit, 1).then((res) => {
      if (res.status === "ok") {
        window.history.pushState({}, 0, "/admin/topic");
        this.setState({
          message: i18next.t("admin:Get search result success"),
          topics: res?.data,
          topicsNum: res?.data2,
          page: 1,
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  renderImage = ({alt, src}) => {
    return <Zmage src={src} alt={alt} />;
  };

  renderLink = (props) => {
    return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
  };

  showPageColumn() {
    if (this.state.topicsNum < this.state.limit) {
      return;
    }

    return <PageColumn page={this.state.page} total={this.state.topicsNum} url={this.state.url} defaultPageNum={this.state.limit} />;
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

  changeShowSearch() {
    this.setState({
      showSearch: !this.state.showSearch,
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

  renderRadioButton(type) {
    switch (type) {
      case "sdt":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({sdt: 1})} checked={this.state.sdt === 1} name="sdt" />
            {i18next.t("admin:Show")} <input type="radio" onClick={() => this.setState({sdt: 0})} checked={this.state.sdt === 0} name="sdt" />
            {i18next.t("admin:Hidden")}
          </span>
        );
      case "us":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({us: 1})} checked={this.state.us === 1} name="us" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({us: 2})} checked={this.state.us === 2} name="us" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({us: 0})} checked={this.state.us === 0} name="us" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      case "cs":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({cs: 1})} checked={this.state.cs === 1} name="cs" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({cs: 2})} checked={this.state.cs === 2} name="cs" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({cs: 0})} checked={this.state.cs === 0} name="cs" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      case "lrs":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({lrs: 1})} checked={this.state.lrs === 1} name="lrs" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({lrs: 2})} checked={this.state.lrs === 2} name="lrs" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({lrs: 0})} checked={this.state.lrs === 0} name="lrs" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      case "rcs":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({rcs: 1})} checked={this.state.rcs === 1} name="rcs" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({rcs: 2})} checked={this.state.rcs === 2} name="rcs" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({rcs: 0})} checked={this.state.rcs === 0} name="rcs" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      case "hs":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({hs: 1})} checked={this.state.hs === 1} name="hs" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({hs: 2})} checked={this.state.hs === 2} name="hs" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({hs: 0})} checked={this.state.hs === 0} name="hs" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      case "fcs":
        return (
          <span>
            <input type="radio" onClick={() => this.setState({fcs: 1})} checked={this.state.fcs === 1} name="fcs" />
            {i18next.t("admin:Asc")} <input type="radio" onClick={() => this.setState({fcs: 2})} checked={this.state.fcs === 2} name="fcs" />
            {i18next.t("admin:Desc")} <input type="radio" onClick={() => this.setState({fcs: 0})} checked={this.state.fcs === 0} name="fcs" />
            {i18next.t("admin:Ignore")}
          </span>
        );
      default:
        return null;
    }
  }

  renderSearchList() {
    const pcBrowser = Setting.PcBrowser;

    return (
      <table cellPadding="5" cellSpacing="0" border="0" width="100%">
        <tbody>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("topic:Author")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              <input value={this.state.un} onChange={(event) => this.setState({un: event.target.value})} />
            </td>
          </tr>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("topic:Title")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              <input value={this.state.ti} onChange={(event) => this.setState({ti: event.target.value})} />
            </td>
          </tr>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("topic:Content")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              <input value={this.state.cn} onChange={(event) => this.setState({cn: event.target.value})} />
            </td>
          </tr>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("topic:Show deleted topics")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {this.renderRadioButton("sdt")}
            </td>
          </tr>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("admin:Sorter")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("topic:Created time")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("cs")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("topic:Author")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("us")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("topic:Reply count")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("rcs")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("topic:Hot")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("hs")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("topic:Favorite count")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("fcs")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width="auto" align="left">
              <input type="submit" className="super normal button" value={i18next.t("topic:Search")} onClick={() => this.getSearchResult()} />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.event === item.value ? "tab_current" : "tab"} onClick={() => this.changeEvent(item.value)}>
        {i18next.t(`topic:${item.label}`)}
      </a>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin/topic">{i18next.t("topic:Topic management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <span>{this.state.topic?.title}</span>
        </div>
        <div className="cell">
          {this.state.Management_LIST.map((item) => {
            return this.renderManagementList(item);
          })}
        </div>
      </div>
    );
  }

  renderTopicStatus(status, homePageTopTime, tabTopTime, nodeTopTime) {
    console.log(status);
    if (status === false) {
      status = 1;
    } else {
      status = 2;
    }
    if (nodeTopTime !== "") {
      status = 3; // node to[ping
    }
    if (tabTopTime !== "") {
      status = 4; // tab topping
    }
    if (homePageTopTime !== "") {
      status = 5; // home page topping
    }

    switch (status) {
      case 1:
        return <span className="gray">{i18next.t("topic:Normal")}</span>;
      case 2:
        return <span className="negative">{i18next.t("topic:Deleted")}</span>;
      case 3:
        return <span className="positive">{i18next.t("topic:Node Topping")}</span>;
      case 4:
        return <span className="positive">{i18next.t("topic:Tab Topping")}</span>;
      case 5:
        return <span className="positive">{i18next.t("topic:Homepage Topping")}</span>;
      default:
        return <span className="gray">{i18next.t("topic:Unknown status")}</span>;
    }
  }

  renderTopics(topic) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "200" : "auto"} align="left">
                <span className="gray">
                  <Link to={`/t/${topic?.id}?from=${encodeURIComponent(window.location.href)}`} target="_blank">
                    {topic?.title.length > 30 ? topic?.title.slice(0, 30) + "..." : topic?.title}
                  </Link>
                </span>
              </td>
              <td width="100" align="center">
                <Link to={`/member/${topic?.author}`}>{topic?.author}</Link>
              </td>
              <td width="100" align="center">
                <Link to={`/admin/topic/edit/${topic?.id}`}>{i18next.t("admin:Manage")}</Link>
              </td>
              <td width="10"></td>
              <td width="60" align="left" style={{textAlign: "right"}}>
                {this.renderTopicStatus(topic?.deleted, topic?.homePageTopTime, topic?.tabTopTime, topic?.nodeTopTime)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    if (this.state.topicId !== undefined) {
      if (this.state.topic !== null && this.state.topic.length === 0) {
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

      if (this.state.topic === null) {
        return (
          <div className="box">
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Topic does not exist")}
              </div>
              <div className="cell">
                <span className="gray bigger">404 Topic Not Found</span>
              </div>
              <div className="inner">
                ← <Link to="/">{i18next.t("error:Back to Home Page")}</Link>
              </div>
            </div>
          </div>
        );
      }

      const topic = this.state.topic;

      if (this.state.event === "basic") {
        return (
          <div>
            {this.renderHeader()}
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
                      <td width="120" align="right">
                        {i18next.t("topic:Topic ID")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.id}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Author")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">
                          <Link to={`/member/${topic.author}`} target="_blank">
                            {topic?.author}
                          </Link>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Node")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">
                          <Link to={`/go/${encodeURIComponent(topic?.nodeId)}`} target="_blank">
                            {topic?.nodeName}
                          </Link>
                        </span>
                        &nbsp; &nbsp;{" "}
                        <Link to={`/move/topic/${topic?.id}`} style={{fontWeight: "bolder"}} target="_blank">
                          {i18next.t("topic:Move topic")}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Created time")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.createdTime}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Last reply user")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic.lastReplyUser === "" ? i18next.t("reply:No reply yet") : <Link to={`/member/${topic?.lastReplyUser}`}>{topic?.lastReplyUser}</Link>}</span>
                      </td>
                    </tr>
                    {topic.lastReplyUser !== "" ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("topic:Last reply time")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{topic?.lastReplyTime}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Reply count")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.replyCount}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Hit count")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.hitCount}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Favorite count")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.favoriteCount}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Hot")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{topic?.hot}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("topic:Status")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{this.renderTopicStatus(topic?.deleted, topic?.homePageTopTime, topic?.tabTopTime, topic?.nodeTopTime)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right"></td>
                      <td width="auto" align="left">
                        <span className="gray">{i18next.t("topic:Please change the basic information through the topic page")}</span>
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
        <div>
          {this.renderHeader()}
          <div className="box">
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("topic:Title")}
                    </td>
                    <td width="500" align="left">
                      <Link to={`/t/${topic?.id}?from=${encodeURIComponent(window.location.href)}`} target="_blank">
                        {topic?.title}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="120" align="right"></td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("topic:Content")}
                    </td>
                    <td width="500" align="left">
                      <div className="payload">
                        <ReactMarkdown
                          className={"notification"}
                          renderers={{
                            image: this.renderImage,
                            link: this.renderLink,
                          }}
                          source={Setting.getFormattedContent(this.state.topic?.content, true)}
                          escapeHtml={false}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="120" align="right"></td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      <Link to={`/edit/topic/${topic?.id}`} target="_blank">
                        {i18next.t("topic:Edit")}&nbsp; ›&nbsp;
                      </Link>
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
          <Link to={"/admin"}>{i18next.t("admin:Backstage management")}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("topic:Topic management")}
          <div className="fr f12">
            <span className="snow">{i18next.t("topic:Total Topics")} &nbsp;</span>
            <strong className="gray">{this.state.topicsNum}</strong>
          </div>
        </div>
        {this.state.message !== "" ? (
          <div className="message" onClick={() => this.clearMessage()}>
            <li className="fa fa-exclamation-triangle"></li>
            &nbsp; {this.state.message}
          </div>
        ) : null}
        <div className="cell">
          <Collapse
            onChange={() => this.changeShowSearch()}
            style={{
              border: "0",
              fontSize: "14px",
              padding: "0",
              backgroundColor: "#ffffff",
            }}
          >
            <Panel header={<span style={{color: "#666"}}>{i18next.t("admin:Condition search")}</span>}>{this.renderSearchList()}</Panel>
          </Collapse>
        </div>
        {this.showPageColumn()}
        <div id="all-tabs">
          {this.state.topics !== null && this.state.topics.length !== 0 ? (
            this.state.topics.map((topic) => this.renderTopics(topic))
          ) : (
            <div
              className="cell"
              style={{
                textAlign: "center",
                height: "100px",
                lineHeight: "100px",
              }}
            >
              {this.state.topics === null ? i18next.t("loading:Data is loading...") : i18next.t("admin:No matching data")}
            </div>
          )}
        </div>
        {this.showPageColumn()}
      </div>
    );
  }
}

export default withRouter(AdminTopic);

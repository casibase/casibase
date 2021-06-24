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
import { withRouter, Link } from "react-router-dom";
import * as MemberBackend from "../backend/MemberBackend.js";
import * as Setting from "../Setting";
import PageColumn from "../main/PageColumn";
import Avatar from "../Avatar";
import Collapse, { Panel } from "rc-collapse";
import Select2 from "react-select2-wrapper";
import i18next from "i18next";

class AdminMember extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      message: "",
      errorMessage: "",
      form: {},
      //event: props.match.params.event,
      membersNum: 0,
      members: [],
      width: "",
      memberId: props.match.params.memberId,
      member: [],
      event: "basic",
      page: 1,
      limit: 100,
      minPage: 1,
      maxPage: -1,
      showSearch: false,
      loading: true,
      un: "", // username search
      cs: 1, // created time sort, default: Asc
      us: 0, // username sort, default: None
      Status_LIST: [
        { label: "Normal", value: 0 },
        { label: "Mute", value: 1 },
        { label: "Forbidden", value: 2 },
      ],
      Management_LIST: [
        { label: "Basic Info", value: "basic" },
        { label: "Personal Info", value: "personal" },
      ],
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }

    this.state.url = `/admin/member`;
  }

  componentDidMount() {
    this.getMembers();
    this.getMember();
  }

  getMembers() {
    if (this.state.memberId !== undefined) {
      return;
    }

    MemberBackend.getMembersAdmin(
      this.state.cs,
      this.state.us,
      this.state.un,
      this.state.limit,
      this.state.page
    ).then((res) => {
      this.setState({
        members: res?.data,
        membersNum: res?.data2,
        loading: false,
      });
    });
  }

  componentWillReceiveProps(newProps) {
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
          page: parseInt(page),
          memberId: newProps.match.params.memberId,
        },
        () => {
          this.getMembers();
          this.getMember();
        }
      );
    }
  }

  getMember() {
    if (this.state.memberId === undefined) {
      return;
    }

    MemberBackend.getMemberAdmin(this.state.memberId).then((res) => {
      this.setState(
        {
          member: res,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  initForm() {
    let form = this.state.form;
    form["fileQuota"] = this.state.member?.fileQuota;
    form["status"] = this.state.member?.status;
    form["score"] = this.state.member?.score;
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

  updateMemberInfo() {
    MemberBackend.updateMember(this.state.memberId, this.state.form).then(
      (res) => {
        if (res.status === "ok") {
          this.getMember();
          this.setState({
            message: i18next.t("member:Update member information success"),
          });
        } else {
          this.setState({
            message: res?.msg,
          });
        }
      }
    );
  }

  getSearchResult() {
    this.state.loading = true;
    MemberBackend.getMembersAdmin(
      this.state.cs,
      this.state.us,
      this.state.un,
      this.state.limit,
      1
    ).then((res) => {
      if (res.status === "ok") {
        window.history.pushState({}, 0, `/admin/member`);
        this.setState({
          message: i18next.t("member:Get search result success"),
          loading: false,
          members: res?.data,
          membersNum: res?.data2,
          page: 1,
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  getIndexFromStatus(status) {
    for (let i = 0; i < this.state.Status_LIST.length; i++) {
      if (this.state.Status_LIST[i].value === status) {
        return i;
      }
    }

    return -1;
  }

  showPageColumn() {
    if (this.state.membersNum < this.state.limit) {
      return;
    }

    return (
      <PageColumn
        page={this.state.page}
        total={this.state.membersNum}
        url={this.state.url}
        defaultPageNum={this.state.limit}
      />
    );
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
      case "us":
        return (
          <span>
            <input
              type="radio"
              onClick={() => this.setState({ us: 1 })}
              checked={this.state.us === 1}
              name="us"
            />
            {i18next.t("member:Asc")}{" "}
            <input
              type="radio"
              onClick={() => this.setState({ us: 2 })}
              checked={this.state.us === 2}
              name="us"
            />
            {i18next.t("member:Desc")}{" "}
            <input
              type="radio"
              onClick={() => this.setState({ us: 0 })}
              checked={this.state.us === 0}
              name="us"
            />
            {i18next.t("member:Ignore")}
          </span>
        );
      case "cs":
        return (
          <span>
            <input
              type="radio"
              onClick={() => this.setState({ cs: 1 })}
              checked={this.state.cs === 1}
              name="cs"
            />
            {i18next.t("member:Asc")}{" "}
            <input
              type="radio"
              onClick={() => this.setState({ cs: 2 })}
              checked={this.state.cs === 2}
              name="cs"
            />
            {i18next.t("member:Desc")}{" "}
            <input
              type="radio"
              onClick={() => this.setState({ cs: 0 })}
              checked={this.state.cs === 0}
              name="cs"
            />
            {i18next.t("member:Ignore")}
          </span>
        );
    }
  }

  renderSearchList() {
    const pcBrowser = Setting.PcBrowser;
    return (
      <table cellPadding="5" cellSpacing="0" border="0" width="100%">
        <tbody>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("member:Username")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              <input
                value={this.state.un}
                onChange={(event) => this.setState({ un: event.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td width={pcBrowser ? "200" : "auto"} align="left">
              <span className="gray">{i18next.t("member:Sorter")}</span>
            </td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("member:Registration date")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("cs")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width={pcBrowser ? "100" : "auto"} align="left">
              {i18next.t("member:Username")}
            </td>
            <td width={pcBrowser ? "150" : "auto"} align="left">
              {this.renderRadioButton("us")}
            </td>
          </tr>
          <tr>
            <td width="10"></td>
            <td width="auto" align="left">
              <input
                type="submit"
                className="super normal button"
                value={i18next.t("member:Search")}
                onClick={() => this.getSearchResult()}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderProblem() {
    let problems = [];

    if (this.state.errorMessage !== "") {
      problems.push(i18next.t(`error:${this.state.errorMessage}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearErrorMessage()}>
        {i18next.t(
          "error:Please resolve the following issues before submitting"
        )}
        <ul>
          {problems.map((problem, i) => {
            return <li>{problem}</li>;
          })}
        </ul>
      </div>
    );
  }

  renderManagementList(item) {
    return (
      <a
        href="javascript:void(0);"
        className={this.state.event === item.value ? "tab_current" : "tab"}
        onClick={() => this.changeEvent(item.value)}
      >
        {i18next.t(`member:${item.label}`)}
      </a>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/admin`}>
            {i18next.t("admin:Backstage management")}
          </Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/admin/member`}>
            {i18next.t("member:Member management")}
          </Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>
          <span>{this.state.memberId}</span>
        </div>
        <div className="cell">
          {this.state.Management_LIST.map((item) => {
            return this.renderManagementList(item);
          })}
        </div>
      </div>
    );
  }

  renderMemberStatus(status) {
    switch (status) {
      case 0:
        return <span className="positive">{i18next.t("member:Normal")}</span>;
      case 1:
        return <span className="gray">{i18next.t("member:Mute")}</span>;
      case 2:
        return (
          <span className="negative">{i18next.t("member:Forbidden")}</span>
        );
      default:
        return (
          <span className="gray">{i18next.t("member:Unknown status")}</span>
        );
    }
  }

  renderMembers(member) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "200" : "auto"} align="left">
                <span className="gray">{member?.id}</span>
              </td>
              <td width="200" align="center">
                <Link to={`/admin/member/edit/${member?.id}`}>
                  {i18next.t("member:Manage")}
                </Link>
              </td>
              <td width="10"></td>
              <td width="60" align="left" style={{ textAlign: "right" }}>
                {this.renderMemberStatus(member?.status)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    if (this.state.memberId !== undefined) {
      if (this.state.member !== null && this.state.member.length === 0) {
        return (
          <div className="box">
            <div className="header">
              <Link to="/">{Setting.getForumName()}</Link>
              <span className="chevron">&nbsp;›&nbsp;</span>{" "}
              {i18next.t("loading:Page is loading")}
            </div>
            <div className="cell">
              <span className="gray bigger">
                {i18next.t("loading:Please wait patiently...")}
              </span>
            </div>
          </div>
        );
      }

      if (this.state.member === null) {
        return (
          <div class="box">
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>{" "}
                <span className="chevron">&nbsp;›&nbsp;</span>{" "}
                {i18next.t("error:Member does not exist")}
              </div>
              <div className="cell">
                <span className="gray bigger">404 Member Not Found</span>
              </div>
              <div className="inner">
                ← <Link to="/">{i18next.t("error:Back to Home Page")}</Link>
              </div>
            </div>
          </div>
        );
      }

      const member = this.state.member;

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
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Username")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{member?.id}</span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Topic num")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{member?.topicNum}</span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Reply num")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{member?.replyNum}</span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Balance")}
                      </td>
                      <td width="auto" align="left">
                        <input
                          type="number"
                          value={this.state.form["score"]}
                          onChange={(e) =>
                            this.updateFormField(
                              "score",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Latest login")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">{member?.latestLogin}</span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Files num")}
                      </td>
                      <td width="auto" align="left">
                        <span className="gray">
                          {member?.fileUploadNum} / {member?.fileQuota}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:File quota")}
                      </td>
                      <td width="auto" align="left">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="1"
                          value={
                            this.state.form?.fileQuota === undefined
                              ? 0
                              : this.state.form?.fileQuota
                          }
                          onChange={(event) =>
                            this.updateFormField(
                              "fileQuota",
                              parseInt(event.target.value)
                            )
                          }
                        />
                        &nbsp; &nbsp;{" "}
                        <input
                          type="number"
                          name="sorter"
                          min="0"
                          max="1000"
                          step="1"
                          value={this.state.form?.fileQuota}
                          style={{ width: "50px" }}
                          onChange={(event) =>
                            this.updateFormField(
                              "fileQuota",
                              parseInt(event.target.value)
                            )
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      >
                        {i18next.t("member:Status")}
                      </td>
                      <td width="auto" align="left">
                        <Select2
                          value={this.getIndexFromStatus(
                            this.state.form?.status
                          )}
                          style={{
                            width: Setting.PcBrowser ? "300px" : "200px",
                            fontSize: "14px",
                          }}
                          data={this.state.Status_LIST.map((status, i) => {
                            return {
                              text: `${i18next.t(`member:${status.label}`)}`,
                              id: i,
                            };
                          })}
                          onSelect={(event) => {
                            const s = event.target.value;
                            if (s === null) {
                              return;
                            }

                            const index = parseInt(s);
                            this.updateFormField("status", index);
                          }}
                          options={{
                            placeholder: i18next.t(
                              "member:Please choose member's status"
                            ),
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        width={Setting.PcBrowser ? "120" : "90"}
                        align="right"
                      ></td>
                      <td width="auto" align="left">
                        <input
                          type="submit"
                          className="super normal button"
                          value={i18next.t("member:Save")}
                          onClick={() => this.updateMemberInfo()}
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

      return (
        <div>
          {this.renderHeader()}
          <div className="box">
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      <Avatar
                        username={member?.id}
                        size="small"
                        avatar={member?.avatar}
                      />
                    </td>
                    <td width="auto" align="left">
                      {Setting.getForumName()} {i18next.t("member:No.")}{" "}
                      {member?.no} {i18next.t("member:member")}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Username")}
                    </td>
                    <td width="auto" align="left">
                      {member?.id}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Phone")}
                    </td>
                    <td width="200" align="left">
                      {member?.phone.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>
                          {member?.areaCode} {member?.phone}
                        </code>
                      )}
                    </td>
                    <td width="100" align="left">
                      {member?.phoneVerifiedTime.length === 0 ? (
                        <span className="negative">
                          {i18next.t("member:Unverified")}
                        </span>
                      ) : (
                        <span className="positive">
                          {i18next.t("member:Verified")}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Email")}
                    </td>
                    <td width="200" align="left">
                      {member?.email.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>{member?.email}</code>
                      )}
                    </td>
                    <td width="100" align="left">
                      {member?.emailVerifiedTime.length === 0 ? (
                        <span className="negative">
                          {i18next.t("member:Unverified")}
                        </span>
                      ) : (
                        <span className="positive">
                          {i18next.t("member:Verified")}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      Google
                    </td>
                    <td width="200" align="left">
                      {member?.googleAccount.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>{member?.googleAccount}</code>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      Github
                    </td>
                    <td width="200" align="left">
                      {member?.githubAccount.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>{member?.githubAccount}</code>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:WeChat")}
                    </td>
                    <td width="200" align="left">
                      {member?.weChatAccount.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>{member?.weChatAccount}</code>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      QQ
                    </td>
                    <td width="200" align="left">
                      {member?.qqAccount.length === 0 ? (
                        <span className="gray">
                          {i18next.t("member:Not set")}
                        </span>
                      ) : (
                        <code>{member?.qqAccount}</code>
                      )}
                    </td>
                    <td width="100" align="left">
                      {member?.qqVerifiedTime.length === 0 ? (
                        <span className="negative">
                          {i18next.t("member:Unverified")}
                        </span>
                      ) : (
                        <span className="positive">
                          {i18next.t("member:Verified")}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Website")}
                    </td>
                    <td width="200" align="left">
                      {member?.website}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Company")}
                    </td>
                    <td width="200" align="left">
                      {member?.company}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Company title")}
                    </td>
                    <td width="200" align="left">
                      {member?.companyTitle}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Location")}
                    </td>
                    <td width="200" align="left">
                      {member?.location}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Tagline")}
                    </td>
                    <td width="200" align="left">
                      {member?.tagline}
                    </td>
                  </tr>
                  <tr>
                    <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                      {i18next.t("setting:Bio")}
                    </td>
                    <td width="200" align="left">
                      {member?.bio}
                    </td>
                  </tr>
                  <tr>
                    <td
                      width={Setting.PcBrowser ? "120" : "90"}
                      align="right"
                    ></td>
                    <td width="auto" align="left">
                      <Link to={`/member/${member?.id}`} target="_blank">
                        {i18next.t("member:Homepage")}&nbsp; ›&nbsp;
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
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          {i18next.t("member:Member management")}
          <div className="fr f12">
            <Link to={"/admin/member/new"}>
              {i18next.t("member:Add new member")}
            </Link>
            &nbsp;&nbsp;
            <span className="snow">
              {i18next.t("member:Total members")} &nbsp;
            </span>
            <strong className="gray">{this.state.membersNum}</strong>
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
            <Panel
              header={
                <span style={{ color: "#666" }}>
                  {i18next.t("member:Condition search")}
                </span>
              }
            >
              {this.renderSearchList()}
            </Panel>
          </Collapse>
        </div>
        {this.showPageColumn()}
        {this.state.loading ? (
          <div
            className="cell"
            style={{
              textAlign: "center",
              height: "100px",
              lineHeight: "100px",
            }}
          >
            {i18next.t("loading:Data is loading...")}
          </div>
        ) : (
          <div id="all-members">
            {this.state.members === null || this.state.members.length === 0 ? (
              <div
                className="cell"
                style={{
                  textAlign: "center",
                  height: "100px",
                  lineHeight: "100px",
                }}
              >
                {i18next.t("member:No matching data")}
              </div>
            ) : (
              this.state.members.map((member) => this.renderMembers(member))
            )}
          </div>
        )}
        {this.showPageColumn()}
      </div>
    );
  }
}

export default withRouter(AdminMember);

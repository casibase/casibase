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
import * as Setting from "../Setting";
import i18next from "i18next";
import ReactMarkdown from "react-markdown";
import * as NotificationBackend from "../backend/NotificationBackend";
import {withRouter} from "react-router-dom";
import PageColumn from "./PageColumn";
import Avatar from "../Avatar";
import "../Notification.css"
const pangu = require("pangu")

class NotificationBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      notifications: [],
      p: "",
      page: 1,
      limit: 10,
      minPage: 1,
      maxPage: -1,
      notificationNum: 0,
      temp: 0,
      url: ""
    };
    const params = new URLSearchParams(this.props.location.search)
    this.state.p = params.get("p")
    if (this.state.p === null) {
      this.state.page = 1
    }else {
      this.state.page = parseInt(this.state.p)
    }

    this.state.url = `/notifications`
  }

  componentDidMount() {
    this.getNotifications();
    this.updateReadStatus();
  }

  getNotifications() {
    NotificationBackend.getNotifications(this.state.limit, this.state.page)
      .then((res) => {
        this.setState({
          notifications: res?.data,
          notificationNum: res?.data2
        });
      });
  }

  updateReadStatus() {
    NotificationBackend.updateReadStatus()
  }

  deleteFavorite(id) {
    NotificationBackend.deleteNotifications(id)
      .then((res) => {
        if (res.status === 'ok') {
          Setting.refresh();
        }else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  showPageColumn() {
    if (this.state.notificationNum === 0) {
      return null;
    }

    return (
      <PageColumn page={this.state.page} total={this.state.notificationNum} url={this.state.url} defaultPageNum={this.state.limit} />
    )
  }

  renderMember(senderId) {
    return (
      <a href={`/member/${senderId}`}>
        <strong>
          {senderId}
        </strong>
      </a>
    )
  }

  renderDelete(createdTime, objectId) {
    return (
      <span>
        {" "}&nbsp;
        <span className="snow">{Setting.getPrettyDate(createdTime)}</span>
        {" "}&nbsp;
        <a href="#;" onClick={() => this.deleteFavorite(objectId)} className="node">{i18next.t("notification:Delete")}</a>
      </span>
    )
  }

  renderNotificationContent(notification) {
    switch (notification?.notificationType) {
      case 1:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Replied to you in")}{" "}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
              {" "}{i18next.t("notification:里回复了你")}
            </span>
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
            <div className="sep5"></div>
            <div className="payload">
              <ReactMarkdown className={"notification"} source={Setting.getFormattedContent(notification?.content, true)} escapeHtml={false} />
            </div>
          </td>
        )
      case 2:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Mentioned you in")}{" "}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
              {" "}{i18next.t("notification:里提到了你")}
            </span>
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
            <div className="sep5"></div>
            <div className="payload">
              <ReactMarkdown className={"notification"} source={Setting.getFormattedContent(notification?.content, true)} escapeHtml={false} />
            </div>
          </td>
        )
      case 3:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Mentioned you in topic")}{" "}›{" "}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
              {" "}{i18next.t("notification:里提到了你")}
            </span>
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
          </td>
        )
      case 4:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Favorite you topic")}{" "}›{" "}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
            </span>
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
          </td>
        )
      case 5:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Thanks for you topic")}{" "}›{" "}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
            </span>
            {" "}&nbsp;
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
          </td>
        )
      case 6:
        return (
          <td valign="middle">
            <span className="fade">
              {this.renderMember(notification?.senderId)}
              {" "}{i18next.t("notification:Thanks for your reply in topic")}{" "}›{""}
              <a href={`/t/${notification?.objectId}?from=${encodeURIComponent(window.location.href)}`}>
                {pangu.spacing(notification?.title)}
              </a>
              {" "}{i18next.t("notification:里的回复")}
            </span>
            {this.renderDelete(notification?.createdTime, notification?.objectId)}
            <div className="sep5"></div>
            <div className="payload">
              <ReactMarkdown className={"notification"} source={Setting.getFormattedContent(notification?.content, true)} escapeHtml={false} />
            </div>
          </td>
        )
    }
  }

  renderNotification(notification) {
    return (
      <div className="cell" id="n_13397482">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tr>
            <td width="32" align="left" valign="top">
              <a href={`/member/${notification?.senderId}`}>
                <Avatar username={notification?.senderId} avatar={notification?.avatar} size={"small"} />
              </a>
            </td>
            {this.renderNotificationContent(notification)}
          </tr>
        </table>
      </div>
    )
  }

  render() {
    return (
        <div className="box">
          <div className="header">
            <div className="fr f12"><span className="snow">{i18next.t("notification:Total reminders received")}&nbsp;</span>
              {" "}
              <strong className="gray">
                {this.state.notificationNum}
              </strong>
            </div>
            <a href="/">{Setting.getForumName()}</a> <span className="chevron">&nbsp;›&nbsp;</span>
            {" "}{i18next.t("notification:Reminder system")}
          </div>
          {Setting.PcBrowser ? this.showPageColumn() : null}
          <div id="notifications">
            {
              this.state.notifications.map((notification) => {
                return this.renderNotification(notification);
              })
            }
          </div>
          {this.showPageColumn()}
        </div>
    )
  }
}

export default withRouter(NotificationBox);

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
import {Link, withRouter} from "react-router-dom";
import i18next from "i18next";
import * as Conf from "../Conf";

class AdminHomepage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      manageItems: [
        {
          label: i18next.t("admin:Tab management"),
          value: "tab",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Node management"),
          value: "node",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Plane management"),
          value: "plane",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Topic management"),
          value: "topic",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Poster management"),
          value: "poster",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Member management"),
          value: "member",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Sensitive management"),
          value: "sensitive",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Translation management"),
          value: "translation",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:FrontConf management"),
          value: "frontconf",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Faq"),
          value: "faq",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Mission"),
          value: "mission",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Advertise"),
          value: "advertise",
          image: Setting.getStatic("/img/settings.png"),
        },
        {
          label: i18next.t("admin:Thanks"),
          value: "thanks",
          image: Setting.getStatic("/img/settings.png"),
        },
      ],
      message: "",
    };
  }

  componentDidMount() {
    document.title = `${i18next.t("general:Admin")} - ${Setting.getForumName()}`;
  }

  renderManageItemInternal(item) {
    return (
      <div
        style={{
          display: "table",
          padding: "20px 0px 20px 0px",
          width: "100%",
          textAlign: "center",
          fontSize: "14px",
        }}
      >
        <img src={item?.image} border="0" align="default" width="73" alt={item?.value} />
        <div className="sep10" />
        {item?.label}
      </div>
    );
  }

  renderManageItem(item) {
    if (item.value === "member") {
      return (
        <a className="grid_item" href={Setting.getMyProfileUrl(this.props.account)} rel="noreferrer">
          {this.renderManageItemInternal(item)}
        </a>
      );
    }

    return (
      <Link className="grid_item" to={`admin/${item?.value}`}>
        {this.renderManageItemInternal(item)}
      </Link>
    );
  }

  render() {
    if (this.props.account === undefined) {
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
    if (this.props.account === null || !this.props.account?.isAdmin) {
      this.props.history.push("/");
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          {i18next.t("admin:Backstage management")}
        </div>
        <div id="all-items">
          {this.state.manageItems.map((item) => {
            return this.renderManageItem(item);
          })}
        </div>
      </div>
    );
  }
}

export default withRouter(AdminHomepage);

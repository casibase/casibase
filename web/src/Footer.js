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
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import * as BasicBackend from "./backend/BasicBackend";
import { Link, withRouter } from "react-router-dom";
import moment from "moment";
import i18next from "i18next";

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      version: "",
      online: 0,
      highest: 0,
    };
  }

  componentDidMount() {
    this.getForumVersion();
    this.getOnlineNum();
  }

  getForumVersion() {
    BasicBackend.getForumVersion().then((res) => {
      this.setState({
        version: res.data,
      });
    });
  }

  getOnlineNum() {
    BasicBackend.getOnlineNum().then((res) => {
      this.setState({
        online: res?.data,
        highest: res?.data2,
      });
    });
  }

  render() {
    const loadingTime = Math.floor(
      performance.getEntries()[0].responseEnd -
        performance.getEntries()[0].requestStart
    );
    const date = new Date();

    if (!Setting.PcBrowser) {
      return (
        <div id="Bottom">
          <div className="content">
            <div className="inner" style={{ textAlign: "center" }}>
              &copy; {date.getFullYear()} {Setting.getForumName()} ·{" "}
              {loadingTime}ms ·{" "}
              <a
                href={`${Conf.GithubRepo}/commit/${this.state.version}`}
                target="_blank"
              >
                {this.state.version.substring(0, 7)}
              </a>
              <div>
                <strong>
                  <Link to="/about" className="dark">
                    {i18next.t("footer:About")}
                  </Link>
                  &nbsp;·&nbsp;
                  <Link
                    to={{
                      pathname: "/select/language",
                      query: { previous: this.props.location.pathname },
                    }}
                    title="Select Language"
                    className="dark"
                  >
                    Language
                  </Link>
                </strong>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const utcTime = moment().utc(false).format("HH:mm");
    const laxTime = moment().utcOffset(-7).format("HH:mm");
    const pvgTime = moment().format("HH:mm");
    const jfkTime = moment().utcOffset(-4).format("HH:mm");

    return (
      <div id="Bottom">
        <div className="content">
          <div className="inner">
            <div className="sep10" />
            <div className="fr">
              <a href="https://www.digitalocean.com/" target="_blank">
                <div id="logoFooter" />
              </a>
            </div>
            {/*<div className="fr">*/}
            {/*  <a href="https://casbin.org" target="_blank">*/}
            {/*    <div className="footer-logo" />*/}
            {/*  </a>*/}
            {/*</div>*/}
            <strong>
              <Link to="/about" className="dark" target="_self">
                {i18next.t("footer:About")}
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/faq" className="dark" target="_self">
                FAQ
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/api" className="dark" target="_self">
                API
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/mission" className="dark" target="_self">
                {i18next.t("footer:Mission")}
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/advertise" className="dark" target="_self">
                {i18next.t("footer:Advertise")}
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/advertise/2019.html" className="dark" target="_self">
                {i18next.t("footer:Thanks")}
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp;{" "}
              <Link to="/tools" className="dark" target="_self">
                {i18next.t("footer:Tools")}
              </Link>{" "}
              &nbsp; <span className="snow">·</span> &nbsp; {this.state.online}{" "}
              {i18next.t("footer:Online")}
            </strong>{" "}
            &nbsp;{" "}
            <span className="fade">
              {i18next.t("footer:Highest")} {this.state.highest}
            </span>{" "}
            &nbsp; <span className="snow">·</span> &nbsp;{" "}
            <Link
              to={{
                pathname: "/select/language",
                query: { previous: this.props.location.pathname },
              }}
              className="f11"
            >
              <img
                src={Setting.getStatic("/static/img/language.png")}
                width="16"
                align="absmiddle"
                id="ico-select-language"
              />{" "}
              &nbsp; {i18next.t("footer:Select Language")}
            </Link>
            &nbsp; <span className="snow">·</span> &nbsp;{" "}
            <Link to="/select/editorType" className="f11">
              <img
                src={Setting.getStatic("/static/img/editType.png")}
                width="16"
                align="absmiddle"
                id="ico-select-editorType"
              />{" "}
              &nbsp; {i18next.t("footer:Select Editor")}
            </Link>
            <div className="sep20" />
            {i18next.t("footer:Community of Creators")}
            <div className="sep5" />
            World is powered by code
            <div className="sep20" />
            <span className="small fade">
              VERSION:{" "}
              <a
                href={`${Conf.GithubRepo}/commit/${this.state.version}`}
                target="_blank"
              >
                {this.state.version.substring(0, 7)}
              </a>{" "}
              · {loadingTime}ms · UTC {utcTime} · PVG {pvgTime} · LAX {laxTime}{" "}
              · JFK {jfkTime}
              <br />♥ Do have faith in what you're doing.
            </span>
            <div className="sep10" />
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Footer);

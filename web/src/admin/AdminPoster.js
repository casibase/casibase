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
import {Link, withRouter} from "react-router-dom";
import * as PosterBackend from "../backend/PosterBackend";
import * as Setting from "../Setting";
import i18next from "i18next";

class AdminPoster extends React.Component {
  constructor(props) {
    super(props);
    this.adver = React.createRef();
    this.links = React.createRef();
    this.p_link = React.createRef();
    this.state = {
      classes: props,
      message: "",
      form: {
        name: "",
        advertiser: "",
        link: "",
        picture_link: "",
      },
      memberId: props.match.params.memberId,
    };

    this.state.url = "/admin/poster";
  }

  componentDidMount() {
    this.readposter();
  }

  changeinputval() {
    const a_val = this.state.form["advertiser"];
    const l_val = this.state.form["link"];
    const p_val = this.state.form["picture_link"];
    if (a_val !== undefined) {
      this.adver.current.value = a_val;
    }
    if (l_val !== undefined) {
      this.links.current.value = l_val;
    }
    if (p_val !== undefined) {
      this.p_link.current.value = p_val;
    }
  }

  readposter() {
    PosterBackend.readposter("r_box_poster").then((res) => {
      const poster = res;
      if (poster) {
        this.setState(
          {
            form: poster,
          },
          () => {
            this.changeinputval();
          }
        );
      }
    });
  }

  updateposter() {
    this.changeinputval();
    PosterBackend.updateposter_info(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.setState({
          message: i18next.t("poster:Update poster information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  inputChange(id) {
    const a_val = this.adver.current.value;
    const l_val = this.links.current.value;
    const p_val = this.p_link.current.value;
    this.setState({
      form: {
        advertiser: a_val,
        link: l_val,
        picture_link: p_val,
        id: id,
        state: "1",
      },
    });
  }

  render() {
    return (
      <div>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("poster:Poster management")}
          </div>
        </div>
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
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("poster:Advertiser")}
                  </td>
                  <td width="auto" align="left">
                    <input ref={this.adver} onChange={() => this.inputChange("r_box_poster")} />
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("poster:Link")}
                  </td>
                  <td width="auto" align="left">
                    <input ref={this.links} onChange={() => this.inputChange("r_box_poster")} />
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("poster:Picture link")}
                  </td>
                  <td width="auto" align="left">
                    <input ref={this.p_link} onChange={() => this.inputChange("r_box_poster")} />
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right"></td>
                  <td width="auto" align="left">
                    <input type="submit" className="super normal button" value={i18next.t("poster:Save")} onClick={() => this.updateposter("r_box_poster")} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(AdminPoster);

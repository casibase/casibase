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

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  componentDidMount() {
  }

  render() {
    return (
      <div id="Bottom">
        <div className="content">
          <div className="inner">
            <div className="sep10" />
            <div className="fr">
              <a href="https://casbin.org" target="_blank">
                <div className="footer-logo" />
              </a>
            </div>
            <strong>
              <a href="/about" className="dark" target="_self">About</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/faq" className="dark" target="_self">FAQ</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/api" className="dark" target="_self">API</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/mission" className="dark" target="_self">Our Goal</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/advertise" className="dark" target="_self">Advertisement</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/advertise/2019.html" className="dark" target="_self">Thanks</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              <a href="/tools" className="dark" target="_self">Tools</a> &nbsp;
              <span className="snow">·</span> &nbsp;
              1234 Online
            </strong>
            &nbsp;
            <span className="fade">Highest Record 1234</span> &nbsp;
            <span className="snow">·</span> &nbsp;
            <a href="/select/language" className="f11">
              <img src={Setting.getStatic("/static/img/language.png")} width="16" align="absmiddle" id="ico-select-language" />
              &nbsp; Select Language
            </a>
            <div className="sep20" />
            Community of Creators
            <div className="sep5" />
            World is powered by code
            <div className="sep20" />
            <span className="small fade">
              VERSION: x.x.x · xxms
              <br />
              ♥ Do have faith in what you're doing.
            </span>
            <div className="sep10" />
          </div>
        </div>
      </div>
    )
  }

}

export default Footer;

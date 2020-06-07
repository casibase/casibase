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

import Avatar from "../Avatar";
import * as Setting from "../Setting";
import React from "react";
import Header from "./Header";

class TwoFa extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            classes: props,
        };
    }

    componentDidMount() {
    }

    render() {
        let username = "alice";

        return (
            <div className="box">
                <div class="cell">两步验证</div>
                <div class="inner">
                    <a href="/settings/2fa">开启两步验证</a>
                </div>
            </div>
        );
    }

}

export default TwoFa;
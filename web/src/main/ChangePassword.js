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

class ChangePassword extends React.Component {
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
                <div className="cell">
                    <div className="fr"><span className="fade">如果你不打算更改密码，请留空以下区域</span></div>
                    更改密码
                </div>
                <div className="cell">
                    <li className="fa fa-exclamation-triangle fade"></li>
                    通过 Google 注册的账号，可以先通过
                    <a href="/forgot">这里</a>
                    设置密码
                </div>
                <div className="inner">
                    <form>
                        <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                            <tbody>
                            <tr>
                                <td width="120" align="right">当前密码</td>
                                <td width="auto" align="left"><input type="password" className="sl"
                                                                     name="password_current" value=""/>
                                </td>
                            </tr>
                            <tr>
                                <td width="120" align="right">新密码</td>
                                <td width="auto" align="left"><input type="password" className="sl" name="password_new"
                                                                     value=""/>
                                </td>
                            </tr>
                            <tr>
                                <td width="120" align="right">再次输入新密码</td>
                                <td width="auto" align="left"><input type="password" className="sl"
                                                                     name="password_again" value=""/>
                                </td>
                            </tr>
                            <tr>
                                <td width="120" align="right"></td>
                                <td width="auto" align="left"><input type="hidden" value="44811" name="once"/><input
                                    type="submit" className="super normal button" value="更改密码"/>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>
        );
    }

}

export default ChangePassword;
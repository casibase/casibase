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

class Profile extends React.Component {
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
                    <div className="fr"><a href="#;" onClick="if (confirm('确定要取消当前的头像？')) { location.href = '/settings/avatar/unset?once=44811'; }">
                        取消当前头像</a>
                    </div>
                    头像上传
                </div>
                <div className="cell">
                <div>
                    <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                        <tbody>
                        <tr>
                            <td width="120" align="right">当前头像</td>
                            <td width="auto" align="left">
                                <img height={73} width={73} src={Setting.getUserAvatar(username, false)}
                                     className="avatar" border="0" align="default" alt={username}/> &nbsp;
                                <img src={Setting.getUserAvatar(username, false)}
                                     className="avatar" border="0" align="default" alt={username}/> &nbsp;
                                <img height={24} width={24} src={Setting.getUserAvatar(username, false)}
                                className="avatar" border="0" align="default" alt={username}/>
                            </td>
                        </tr>
                        <tr>
                            <td width="120" align="right"/>
                            <td width="auto" align="left"><a href="/settings/avatar">上传新头像</a></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                </div>
                <div className="inner markdown_body">
                    <p>关于头像的规则和建议</p>
                    <ul>
                        <li>Casbin Forum 禁止使用任何低俗或者敏感图片作为头像</li>
                        <li>如果你是男的，请不要用女人的照片作为头像，这样可能会对其他会员产生误导</li>
                        <li>建议请尽量不要使用真人头像，即使是自己的照片，使用别人的照片则是坚决被禁止的行为</li>
                    </ul>
                </div>
            </div>
        );
    }

}

export default Profile;
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
import * as TopicBackend from "../backend/TopicBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";

class AllCreatedTopicsBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            classes: props,
            memberId: props.match.params.memberId,
            topics: []
        };
    }

    componentDidMount() {
        this.getAllCreatedTopics();
    }

    getAllCreatedTopics() {
        TopicBackend.getAllCreatedTopics(this.state.memberId)
            .then((res) => {
                this.setState({
                    topics: res,
                });
            });
    }

    renderTopic(topic) {
        const style = topic.nodeId !== "promotions" ? null : {
            backgroundImage: `url('${Setting.getStatic("/static/img/corner_star.png")}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "20px 20px",
            backgroundPosition: "right top"
        };

        return (
            <div className="cell item" style={style}>
                <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                    <tbody>
                    <tr>
                        <td width="auto" valign="middle">
                            <span className="item_title">
                                <a href={`/t/${topic.id}`} className="topic-link"> {topic.title} </a>
                            </span>
                            <div className="sep5" />
                            <span className="topic_info">
                                <div className="votes" />
                                <a className="node" href={`/go/${topic.nodeId}`}> {topic.nodeName} </a>
                                &nbsp;•&nbsp;
                                <strong><a href={`/member/${topic.author}`}> {topic.author} </a></strong>
                                &nbsp;•&nbsp;
                                {Setting.getPrettyDate(topic.createdTime)}
                                &nbsp;•&nbsp;
                                last reply from
                                <strong>
                                    <a href={`/member/${topic.lastReplyUser}`}> {topic.lastReplyUser} </a>
                                </strong>
                            </span>
                        </td>
                        <td width="70" align="right" valign="middle">
                            <a href={`/t/${topic.id}`} className="count_livid">6</a>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    render() {
        return (
            <div className="box">
                        <div class="cell_tabs">
                            <div class="fl">
                                <Avatar username={this.state.memberId} size={"small"} />
                            </div>
                            <a href={`/member/${this.state.memberId}`} class="cell_tab_current">{`${this.state.memberId}'s all topics`}</a>
                            <a href={`/member/${this.state.memberId}/qna`} class="cell_tab">Q&A</a>
                            <a href={`/member/${this.state.memberId}/tech`} class="cell_tab">Tech</a>
                            <a href={`/member/${this.state.memberId}/play`} class="cell_tab">Play</a>
                            <a href={`/member/${this.state.memberId}/jobs`} class="cell_tab">Jobs</a>
                            <a href={`/member/${this.state.memberId}/deals`} class="cell_tab">Deals</a>
                            <a href={`/member/${this.state.memberId}/city`} class="cell_tab">City</a>
                        </div>
                                {
                                    this.state.topics.map((topic) => {
                                        return this.renderTopic(topic);
                                        }
                                    )
                                }
                        <div class="inner"><span class="chevron">»</span>
                            <a href={`/member/${this.state.memberId}/topics`}> {`${this.state.memberId}'s more topics`} </a>
                        </div>
                </div>
        );
    }
}

export default withRouter(AllCreatedTopicsBox);

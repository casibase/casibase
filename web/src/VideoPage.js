// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import {Card, Col, Row} from "antd";
import * as VideoBackend from "./backend/VideoBackend";
import * as Setting from "./Setting";
import Video from "./Video";

class VideoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      videoName: props.match.params.videoName,
      video: null,
      tasks: null,
      player: null,
      screen: null,
    };

    this.labelTable = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.getVideo();
  }

  getVideo() {
    VideoBackend.getVideo(this.state.owner, this.state.videoName)
      .then((res) => {
        if (res.data === null) {
          this.props.history.push("/404");
          return;
        }

        if (res.status === "ok") {
          this.setState({
            video: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get video: ${res.msg}`);
        }
      });
  }

  renderVideoContent() {
    if (this.state.video.videoId === "") {
      return null;
    }

    const task = {};
    task.video = {
      vid: this.state.video.videoId,
      playAuth: this.state.video.playAuth,
      cover: this.state.video.coverUrl,
      videoWidth: 1920,
      videoHeight: 1080,
      width: "100%",
      autoplay: false,
      isLive: false,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: "hover",
      useH5Prism: true,
    };

    return (
      <div style={{marginTop: "10px"}}>
        <div className="screen" style={{position: "absolute", zIndex: 100, pointerEvents: "none", width: "440px", height: "472px", marginLeft: "200px", marginRight: "200px", backgroundColor: "rgba(255,0,0,0)"}}></div>
        <Video task={task} labels={this.state.video.labels}
          onUpdateTime={(time) => {}}
          onCreatePlayer={(player) => {this.setState({player: player});}}
          onCreateScreen={(screen) => {this.setState({screen: screen});}}
          onCreateVideo={(videoObj) => {}}
          onPause={() => {}}
        />
      </div>
    );
  }

  renderVideo() {
    return (
      <Card size="small" title={
        <div style={{textAlign: "center"}}>
          {this.state.video.name}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "20px"}} >
          <Col span={6} />
          <Col span={12} style={(Setting.isMobile()) ? {maxWidth: "100%"} : {}}>
            {
              this.state.video !== null ? this.renderVideoContent() : null
            }
          </Col>
          <Col span={6} />
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col span={6} />
          <Col span={12} style={(Setting.isMobile()) ? {maxWidth: "100%"} : {}}>
            {
              this.state.video !== null ? this.state.video.description : null
            }
          </Col>
          <Col span={6} />
        </Row>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {
          this.state.video !== null ? this.renderVideo() : null
        }
      </div>
    );
  }
}

export default VideoPage;

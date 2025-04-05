// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import Player from "aliplayer-react";
import * as Setting from "./Setting";
import BulletScreen from "rc-bullets";

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      player: null,
      width: !Setting.isMobile() ? this.props.task.video.width : "100%",
      height: "100%",
      screen: null,
      bulletIdTextMap: {},
      bulletTextMap: {},
    };
  }

  componentDidMount() {
    if (!document.querySelector(".screen")) {
      return null;
    }

    document.addEventListener("keydown", this.handleKeyDown);

    const screen = new BulletScreen(".screen", {duration: 5});
    this.setState({
      screen: screen,
    });

    this.props.onCreateScreen(screen);
    this.props.onCreateVideo(this);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (event.key === " " && this.state.player) {
      if (this.state.player.paused()) {
        this.state.player.play();
      } else {
        this.state.player.pause();
      }
      event.preventDefault();
    }
  };

  updateVideoSize(width, height) {
    if (this.props.onUpdateVideoSize !== undefined) {
      this.props.onUpdateVideoSize(width, height);
    }
  }

  clearMaps() {
    this.setState({
      bulletIdTextMap: {},
      bulletTextMap: {},
    });
  }

  changeTime = (time) => {
    if (this.state.player) {
      this.state.player.seek(time);
    }
  };

  updateTime(time) {
    const labels = this.props.labels;
    labels.forEach((label, i) => {
      if (Math.floor(label.startTime) === Math.floor(time)) {
        if (label.text === "") {
          return;
        }

        if (this.state.bulletTextMap[label.text] === 1) {
          return;
        }

        this.state.screen.push({
          msg: label.text,
          color: "rgb(92,48,125)",
          backgroundColor: "rgb(255,255,255)",
        }, {
          onStart: (bulletId, screen) => {
            const bulletIdTextMap = this.state.bulletIdTextMap;
            const bulletTextMap = this.state.bulletTextMap;

            bulletIdTextMap[bulletId] = label.text;
            bulletTextMap[label.text] = 1;

            this.setState({
              bulletIdTextMap: bulletIdTextMap,
              bulletTextMap: bulletTextMap,
            });

            // console.log(`start: ${bulletId}`);
          },
          onEnd: (bulletId, screen) => {
            const bulletIdTextMap = this.state.bulletIdTextMap;
            const bulletTextMap = this.state.bulletTextMap;

            const text = bulletIdTextMap[bulletId];
            delete bulletIdTextMap[bulletId];
            delete bulletTextMap[text];

            this.setState({
              bulletIdTextMap: bulletIdTextMap,
              bulletTextMap: bulletTextMap,
            });

            // console.log(`end: ${bulletId}`);
          },
        });
      }
    });

    this.props.onUpdateTime(time);
  }

  handleReady(player) {
    let videoWidth = player.tag.videoWidth;
    let videoHeight = player.tag.videoHeight;

    if (this.props.onUpdateVideoSize !== undefined) {
      if (videoWidth !== 0 && videoHeight !== 0) {
        this.updateVideoSize(videoWidth, videoHeight);
      }
    } else {
      videoWidth = this.props.task.video.videoWidth;
      videoHeight = this.props.task.video.videoHeight;
    }

    const myWidth = player.tag.scrollWidth;
    const myHeight = videoHeight * myWidth / videoWidth;

    player.setPlayerSize(myWidth, myHeight);
    this.setState({
      width: myWidth,
      height: myHeight,
    });

    this.props.onCreatePlayer(player);
  }

  onTimeUpdate(player) {
    const timestamp = parseFloat(parseFloat(player.getCurrentTime()).toFixed(3));

    this.updateTime(timestamp);
  }

  onPlay() {
    this.state.screen.resume();
  }

  onPause() {
    this.state.screen.pause();
    this.props.onPause();
  }

  initPlayer(player) {
    this.setState({
      player: player,
    });

    // https://help.aliyun.com/document_detail/125572.html
    // https://github.com/zerosoul/rc-bullets
    player.on("ready", () => {this.handleReady(player);});
    player.on("timeupdate", () => {this.onTimeUpdate(player);});
    player.on("play", () => {this.onPlay();});
    player.on("pause", () => {this.onPause();});
    player.on("completeSeek", () => {this.state.screen.clear();});
  }

  render() {
    const video = this.props.task.video;

    const config = {
      source: video.source,
      cover: video.cover,
      width: !Setting.isMobile() ? video.width : "100%",
      height: "100%",
      autoplay: video.autoplay,
      isLive: video.isLive,
      rePlay: video.rePlay,
      playsinline: video.playsinline,
      preload: video.preload,
      controlBarVisibility: video.controlBarVisibility,
      useH5Prism: video.useH5Prism,
      // components: [
      //   {
      //     name: "RateComponent",
      //     type: Player.components.RateComponent,
      //   }
      // ]
    };

    if (video.source !== undefined) {
      config.source = video.source;
    } else {
      config.vid = video.vid;
      config.playauth = video.playAuth;
    }

    return (
      <div style={{width: this.state.width, height: this.state.height}}>
        <Player
          config={config}
          onGetInstance={player => {
            this.initPlayer(player);
          }}
        />
      </div>
    );
  }
}

export default Video;

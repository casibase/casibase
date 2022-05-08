import React from "react";
import Player from 'aliplayer-react';
import * as Setting from "./Setting";

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      player: null,
      width: !Setting.isMobile() ? this.props.task.video.width : "100%",
      height: "100%",
    };
  }

  updateVideoSize(width, height) {
    if (this.props.onUpdateVideoSize !== undefined) {
      this.props.onUpdateVideoSize(width, height);
    }
  }

  updateTime(time) {
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
  }

  onTimeUpdate(player) {
    const timestamp = parseFloat(parseFloat(player.getCurrentTime()).toFixed(3));

    this.updateTime(timestamp);
  }

  initPlayer(player) {
    player.on('ready', () => {this.handleReady(player)});
    player.on('timeupdate', () => {this.onTimeUpdate(player)});
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
      <div style={{width: this.state.width, height: this.state.height, margin: "auto"}}>
        <Player
          config={config}
          onGetInstance={player => {
            this.initPlayer(player);
          }}
        />
      </div>
    )
  }
}

export default Video;

import React from "react";
import {Affix, Button, Card, Col, Input, Row, Select, Switch} from "antd";
import * as VideoBackend from "./backend/VideoBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {LinkOutlined} from "@ant-design/icons";
import Video from "./Video";
import LabelTable from "./LabelTable";
import * as Papa from "papaparse";
import VideoDataChart from "./VideoDataChart";

const {Option} = Select;

class VideoEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      videoName: props.match.params.videoName,
      video: null,
      player: null,
      screen: null,
      videoObj: null,
      videoData: null,
    };

    this.labelTable = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.getVideo();
  }

  getVideo() {
    VideoBackend.getVideo(this.props.account.name, this.state.videoName)
      .then((video) => {
        this.setState({
          video: video,
          currentTime: 0,
        });

        if (video.dataUrl !== "") {
          this.getDataAndParse(video.dataUrl);
        }
      });
  }

  parseVideoField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateVideoField(key, value) {
    value = this.parseVideoField(key, value);

    const video = this.state.video;
    video[key] = value;
    this.setState({
      video: video,
    });
  }

  onPause() {
    if (this.state.video.tagOnPause) {
      this.labelTable.current.addRow(this.state.video.labels);
    }
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
        <div style={{fontSize: 16, marginTop: "10px"}}>
          {i18next.t("video:Current time (second)")}: {" "}
          {
            this.state.currentTime
          }
        </div>
        <div className="screen" style={{position: "absolute", zIndex: 100, pointerEvents: "none", width: "440px", height: "472px", marginLeft: "200px", marginRight: "200px", backgroundColor: "rgba(255,0,0,0)"}}></div>
        <Video task={task} labels={this.state.video.labels}
          onUpdateTime={(time) => {this.setState({currentTime: time});}}
          onCreatePlayer={(player) => {this.setState({player: player});}}
          onCreateScreen={(screen) => {this.setState({screen: screen});}}
          onCreateVideo={(videoObj) => {this.setState({videoObj: videoObj});}}
          onPause={() => {this.onPause();}}
        />
      </div>
    );
  }

  getDataAndParse(dataUrl) {
    fetch(dataUrl, {
      method: "GET",
    }).then(res => res.text())
      .then(res => {
        const result = Papa.parse(res, {header: true});
        let data = result.data;
        data = data.filter(item => item.time !== "");
        data = data.map(item => {
          const res = {};
          res.time = Number(item.time);
          res.data = Number(item.data);
          return res;
        });
        this.setState({
          videoData: data,
        });
      });
  }

  renderVideo() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("video:Edit Video")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitVideoEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.video.name} onChange={e => {
              this.updateVideoField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.video.displayName} onChange={e => {
              this.updateVideoField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Video ID")}:
          </Col>
          <Col span={22} >
            <Input disabled={true} value={this.state.video.videoId} onChange={e => {
              this.updateVideoField("videoId", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Cover")}:
          </Col>
          <Col span={22} style={(Setting.isMobile()) ? {maxWidth: "100%"} : {}}>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 1}>
                {i18next.t("general:URL")} :
              </Col>
              <Col span={23} >
                <Input disabled={true} prefix={<LinkOutlined />} value={this.state.video.coverUrl} onChange={e => {
                  this.updateVideoField("coverUrl", e.target.value);
                }} />
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 1}>
                {i18next.t("general:Preview")}:
              </Col>
              <Col span={23} >
                <a target="_blank" rel="noreferrer" href={this.state.video.coverUrl}>
                  <img src={this.state.video.coverUrl} alt={this.state.video.coverUrl} height={90} style={{marginBottom: "20px"}} />
                </a>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Tag on pause")}:
          </Col>
          <Col span={22} >
            <Switch checked={this.state.video.tagOnPause} onChange={checked => {
              this.updateVideoField("tagOnPause", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Video")}:
          </Col>
          <Col span={11} style={(Setting.isMobile()) ? {maxWidth: "100%"} : {}}>
            <React.Fragment>
              <Affix offsetTop={-100}>
                {
                  this.state.video !== null ? this.renderVideoContent() : null
                }
                <Row style={{marginTop: "20px"}} >
                  <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                    {i18next.t("general:Data")}:
                  </Col>
                  <Col span={22} >
                    <Select virtual={false} style={{width: "100%", marginBottom: "10px"}} value={this.state.video.dataUrl} onChange={(value => {
                      this.getDataAndParse(value);
                      this.updateVideoField("dataUrl", value);
                    })}>
                      {
                        this.state.video.dataUrls?.map((dataUrl, index) => <Option key={index} value={dataUrl}>{dataUrl.split("/").pop()}</Option>)
                      }
                    </Select>
                  </Col>
                </Row>
                {
                  this.state.videoData === null ? null : (
                    <React.Fragment>
                      <VideoDataChart key={"VideoDataChart1"} data={this.state.videoData} currentTime={this.state.currentTime} height={"100px"} />
                      <VideoDataChart key={"VideoDataChart2"} data={this.state.videoData} currentTime={this.state.currentTime} interval={25} />
                    </React.Fragment>
                  )
                }
              </Affix>
            </React.Fragment>
          </Col>
          <Col span={1}>
          </Col>
          <Col span={10} >
            <LabelTable
              ref={this.labelTable}
              title={i18next.t("video:Labels")}
              table={this.state.video.labels}
              currentTime={this.state.currentTime}
              video={this.state.video}
              player={this.state.player}
              screen={this.state.screen}
              videoObj={this.state.videoObj}
              onUpdateTable={(value) => {this.updateVideoField("labels", value);}}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitVideoEdit() {
    const video = Setting.deepCopy(this.state.video);
    VideoBackend.updateVideo(this.state.video.owner, this.state.videoName, video)
      .then((res) => {
        if (res) {
          Setting.showMessage("success", "Successfully saved");
          this.setState({
            videoName: this.state.video.name,
          });
          this.props.history.push(`/videos/${this.state.video.name}`);
        } else {
          Setting.showMessage("error", "failed to save: server side failure");
          this.updateVideoField("name", this.state.videoName);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `failed to save: ${error}`);
      });
  }

  render() {
    return (
      <div>
        <Row style={{width: "100%"}}>
          <Col span={1}>
          </Col>
          <Col span={22}>
            {
              this.state.video !== null ? this.renderVideo() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitVideoEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default VideoEditPage;

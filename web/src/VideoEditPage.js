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
import {Affix, Avatar, Button, Card, Col, Input, Row, Segmented, Select, Switch, Tag, Timeline, Tooltip} from "antd";
import * as VideoBackend from "./backend/VideoBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {CheckOutlined, EditOutlined, LinkOutlined, SyncOutlined} from "@ant-design/icons";
import Video from "./Video";
import LabelTable from "./LabelTable";
import * as Papa from "papaparse";
import VideoDataChart from "./VideoDataChart";
import WordCloudChart from "./WordCloudChart";
import ChatPage from "./ChatPage";
import TagTable from "./TagTable";
import * as TaskBackend from "./backend/TaskBackend";
import * as VideoConf from "./VideoConf";
import RemarkTable from "./RemarkTable";

const {TextArea} = Input;
const {Option} = Select;

class VideoEditPage extends React.Component {
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
      videoObj: null,
      chatPageObj: null,
      videoData: null,
      segmentEditIndex: -1,
    };

    this.labelTable = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.getVideo();
    this.getTasks();
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
            currentTime: 0,
          });

          if (res.data?.dataUrl) {
            this.getDataAndParse(res.data.dataUrl);
          }
        } else {
          Setting.showMessage("error", `Failed to get video: ${res.msg}`);
        }
      });
  }

  getTasks() {
    TaskBackend.getTasks(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            tasks: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get tasks: ${res.msg}`);
        }
      });
  }

  parseVideoField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateVideoField(key, value) {
    value = this.parseVideoField(key, value);

    const video = this.state.video;
    video[key] = value;

    // if (key === "remarks") {
    //   if (value.filter((row) => (["Excellent", "Good"].includes(row.score))).length >= 2) {
    //     if (this.state.video.state === "In Review 1") {
    //       video.state = "In Review 2";
    //     }
    //   } else {
    //     if (this.state.video.state === "In Review 2") {
    //       video.state = "In Review 1";
    //     }
    //   }
    // }

    this.setState({
      video: video,
    });
  }

  onPause() {
    if (this.state.video.editMode === "Labeling" && this.state.video.tagOnPause && this.labelTable.current) {
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
        <div style={{fontSize: 16, marginTop: "10px", marginBottom: "10px"}}>
          {i18next.t("video:Current time (second)")}: {" "}
          <Tag color={"processing"}>
            {this.state.currentTime}
          </Tag>
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
          res.time = Number(item.time) - 5;
          res.data = Number(item.data);
          return res;
        });
        this.setState({
          videoData: data,
        });
      });
  }

  renderDataContent() {
    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }

  isSegmentActive(segment) {
    return this.state.currentTime >= segment.startTime && this.state.currentTime < segment.endTime;
  }

  isSegmentsDisabled() {
    if (this.state.video.segments === null || this.state.video.segments.length === 0) {
      return true;
    }
    return false;
  }

  renderSegments() {
    if (this.isSegmentsDisabled()) {
      return null;
    }

    return (
      <div style={{marginTop: "20px", marginBottom: "20px"}}>
        <Card size="small" title="Text">
          <Timeline style={{marginTop: "10px", marginLeft: "10px"}}
            items={
              this.state.video.segments.map((segment, index) => {
                return (
                  {
                    color: this.isSegmentActive(segment) ? "blue" : "gray",
                    dot: this.isSegmentActive(segment) ? <SyncOutlined spin /> : null,
                    children: (
                      <div style={{marginTop: "-10px", cursor: "pointer"}} onClick={() => {
                        this.setState({
                          currentTime: segment.startTime,
                        });

                        if (this.state.videoObj) {
                          this.state.videoObj.changeTime(segment.startTime);
                        }
                      }}>
                        <div style={{display: "inline-block", width: "75px", fontWeight: this.isSegmentActive(segment) ? "bold" : "normal"}}>{Setting.getTimeFromSeconds(segment.startTime)}</div>
                        &nbsp;&nbsp;
                        {
                          Setting.getSpeakerTag(segment.speaker)
                        }
                        <Tag style={{fontSize: "medium", fontWeight: this.isSegmentActive(segment) ? "bold" : "normal", marginTop: "10px", lineHeight: "30px", whiteSpace: "normal", overflow: "visible"}} color={this.isSegmentActive(segment) ? "rgb(87,52,211)" : ""}>
                          {
                            (this.state.segmentEditIndex !== index) ? segment.text : (
                              <Input style={{width: "400px"}} value={segment.text} onChange={e => {
                                const segments = this.state.video.segments;
                                segments[index].text = e.target.value;

                                this.updateVideoField("segments", segments);
                              }} />
                            )
                          }
                        </Tag>
                        {
                          (this.state.segmentEditIndex !== index) ? (
                            <Button icon={<EditOutlined />} size="small" onClick={(event) => {
                              event.stopPropagation();
                              this.setState({
                                segmentEditIndex: index,
                              });
                            }} />
                          ) : (
                            <Button icon={<CheckOutlined />} size="small" onClick={(event) => {
                              event.stopPropagation();
                              this.setState({
                                segmentEditIndex: -1,
                              });
                            }} />
                          )
                        }
                      </div>
                    ),
                  }
                );
              })
            }
          />
        </Card>
      </div>
    );
  }

  renderSegmentTags() {
    return (
      <div>
        <TagTable
          ref={this.labelTable}
          title={i18next.t("video:Tags")}
          table={this.state.video.segments}
          tasks={this.state.tasks}
          currentTime={this.state.currentTime}
          video={this.state.video}
          player={this.state.player}
          screen={this.state.screen}
          videoObj={this.state.videoObj}
          onUpdateTable={(value) => {this.updateVideoField("segments", value);}}
          onUpdateVideoField={(key, value) => {this.updateVideoField(key, value);}}
        />
      </div>
    );
  }

  isWordsDisabled() {
    if (this.state.video.wordCountMap === null || this.state.video.wordCountMap.length === 0) {
      return true;
    }
    return false;
  }

  renderWords() {
    if (this.isWordsDisabled()) {
      return null;
    }

    return (
      <WordCloudChart wordCountMap={this.state.video.wordCountMap} />
    );
  }

  generatePlan() {
    let text = this.state.video.template;
    text = text.replaceAll("${stage}", this.state.video.stage);
    text = text.replaceAll("${grade}", this.state.video.grade);
    text = text.replaceAll("${subject}", this.state.video.subject);
    text = text.replaceAll("${topic}", this.state.video.topic);
    text = text.replaceAll("${keywords}", this.state.video.keywords);
    // Setting.showMessage("success", text);
    this.state.chatPageObj.sendMessage(text, "", true);
  }

  renderAiAssistantOptions() {
    return (
      <React.Fragment>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:School")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.school} onChange={e => {
              this.updateVideoField("school", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Stage")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.stage} onChange={e => {
              this.updateVideoField("stage", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Grade")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.grade} onChange={e => {
              this.updateVideoField("grade", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Class")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.class} onChange={e => {
              this.updateVideoField("class", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Keywords")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} mode="tags" style={{width: "100%"}} value={this.state.video.keywords} onChange={(value => {this.updateVideoField("keywords", value);})}>
              {
                this.state.video.keywords?.map((item, index) => <Option key={index} value={item}>{item}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Subject")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.subject} onChange={e => {
              this.updateVideoField("subject", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Topic")}:
          </Col>
          <Col span={3} >
            <Input value={this.state.video.topic} onChange={e => {
              this.updateVideoField("topic", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col span={3} >
            <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.generatePlan()}>{i18next.t("video:Generate Plan")}</Button>
          </Col>
          <Col span={1} />
          <Col span={3} >
            <Tooltip placement="top" trigger={"click"} title={
              <Input value={this.state.video.template} onChange={e => {
                this.updateVideoField("template", e.target.value);
              }} />
            }>
              <Button style={{marginLeft: "20px"}}>{i18next.t("video:Edit Template")}</Button>
            </Tooltip>
          </Col>
        </Row>
      </React.Fragment>
    );
  }

  renderChat() {
    return (
      <div style={{marginTop: "20px"}}>
        {
          this.renderAiAssistantOptions()
        }
        <div style={{marginTop: "20px"}}>
          <ChatPage onCreateChatPage={(chatPageObj) => {this.setState({chatPageObj: chatPageObj});}} account={this.props.account} />
        </div>
      </div>
    );
  }

  renderLabels() {
    return (
      <div style={{marginTop: "20px"}}>
        <LabelTable
          ref={this.labelTable}
          title={i18next.t("video:Labels")}
          account={this.props.account}
          table={this.state.video.labels}
          currentTime={this.state.currentTime}
          video={this.state.video}
          player={this.state.player}
          screen={this.state.screen}
          videoObj={this.state.videoObj}
          onUpdateTable={(value) => {this.updateVideoField("labels", value);}}
          onUpdateTagOnPause={(value) => {this.updateVideoField("tagOnPause", value);}}
        />
      </div>
    );
  }

  requireUserOrAdmin(video) {
    if (this.props.account.type === "video-admin-user") {
      return false;
    } else if (this.props.account.type !== "video-normal-user") {
      return true;
    }

    if (!video) {
      return false;
    } else {
      return video.remarks && video.remarks.length > 0 || video.remarks2 && video.remarks2.length > 0 || video.state !== "Draft";
    }
  }

  requireUserOrReviewerOrAdmin(video) {
    if (this.props.account.type === "video-reviewer1-user" || this.props.account.type === "video-reviewer2-user") {
      return false;
    } else {
      return this.requireUserOrAdmin(video);
    }
  }

  requireReviewerOrAdmin() {
    return !(this.props.account.type === "video-admin-user" || this.props.account.type === "video-reviewer1-user" || this.props.account.type === "video-reviewer2-user");
  }

  requireReviewer1OrAdmin() {
    return !(this.props.account.type === "video-admin-user" || this.props.account.type === "video-reviewer1-user");
  }

  requireReviewer2OrAdmin() {
    return !(this.props.account.type === "video-admin-user" || this.props.account.type === "video-reviewer2-user");
  }

  requireReviewer2OrAdminOrPublic() {
    if (this.props.account.type === "video-normal-user" && this.state.video?.state === "Published") {
      return false;
    }

    return !(this.props.account.type === "video-admin-user" || this.props.account.type === "video-reviewer2-user");
  }

  requireAdmin() {
    return !(this.props.account.type === "video-admin-user");
  }

  renderVideo() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("video:Edit Video")}&nbsp;&nbsp;&nbsp;&nbsp;
          {
            this.requireUserOrReviewerOrAdmin(this.state.video) ? (
              <>
                <Button onClick={() => this.exit()}>{i18next.t("general:Exit")}</Button>
              </>
            ) : (
              <>
                <Button onClick={() => this.submitVideoEdit(false)}>{i18next.t("general:Save")}</Button>
                <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitVideoEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              </>
            )
          }
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={5} >
            <Input disabled={this.requireUserOrAdmin(this.state.video)} value={this.state.video.name} onChange={e => {
              this.updateVideoField("name", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={6} >
            <Input disabled={this.requireUserOrAdmin(this.state.video)} value={this.state.video.displayName} onChange={e => {
              this.updateVideoField("displayName", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Video ID")}:
          </Col>
          <Col span={5} >
            <Input disabled={this.requireUserOrAdmin(this.state.video)} value={this.state.video.videoId} onChange={e => {
              this.updateVideoField("videoId", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Description")}:
          </Col>
          <Col span={22} >
            <TextArea disabled={this.requireUserOrAdmin(this.state.video)} showCount maxLength={250} autoSize={{minRows: 1, maxRows: 15}} value={this.state.video.description} onChange={(e) => {
              this.updateVideoField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Grade")}:
          </Col>
          <Col span={5} >
            <Select disabled={this.requireUserOrAdmin(this.state.video)} virtual={false} style={{width: "100%"}} value={this.state.video.grade} onChange={(value => {
              this.updateVideoField("grade", value);
              this.updateVideoField("grade2", VideoConf.getGrade2(value));
              this.updateVideoField("unit", "");
              this.updateVideoField("lesson", "");
            })}>
              {
                VideoConf.GradeOptions
                // .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Unit")}:
          </Col>
          <Col span={6} >
            <Select disabled={this.requireUserOrAdmin(this.state.video)} virtual={false} style={{width: "100%"}} value={this.state.video.unit} onChange={(value => {
              this.updateVideoField("unit", value);
              this.updateVideoField("lesson", "");
            })}>
              {
                VideoConf.getUnitOptions(this.state.video.grade)
                // .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => <Option key={index} value={item.id}>{item.id}</Option>)
              }
            </Select>
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Lesson")}:
          </Col>
          <Col span={5} >
            <Select disabled={this.requireUserOrAdmin(this.state.video)} virtual={false} style={{width: "100%"}} value={this.state.video.lesson} onChange={(value => {this.updateVideoField("lesson", value);})}>
              {
                VideoConf.getLessonOptions(this.state.video.grade, this.state.video.unit)
                // .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => <Option key={index} value={item.id}>{`${item.id} (${item.name})`}</Option>)
              }
            </Select>
          </Col>
        </Row>
        {
          this.requireReviewerOrAdmin() ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("video:Remarks1")}:
              </Col>
              <Col span={22} >
                <RemarkTable
                  title={i18next.t("video:Remarks1")}
                  account={this.props.account}
                  maxRowCount={-1}
                  disabled={this.requireReviewer1OrAdmin(this.state.video)}
                  table={this.state.video.remarks}
                  onUpdateTable={(value) => {
                    this.updateVideoField("remarks", value);
                    if (value.length > 0 && this.state.video.state === "Draft") {
                      this.updateVideoField("state", "In Review 1");
                    } else if (value.length === 0 && this.state.video.remarks2.length === 0 && this.state.video.state.startsWith("In Review")) {
                      this.updateVideoField("state", "Draft");
                    }
                  }}
                />
              </Col>
            </Row>
          )
        }
        {
          this.requireReviewer2OrAdminOrPublic() ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("video:Remarks2")}:
              </Col>
              <Col span={22} >
                <RemarkTable
                  title={i18next.t("video:Remarks2")}
                  account={this.props.account}
                  maxRowCount={1}
                  disabled={this.requireReviewer2OrAdmin(this.state.video)}
                  table={this.state.video.remarks2}
                  onUpdateTable={(value) => {
                    this.updateVideoField("remarks2", value);
                    if (value.length > 0 && this.state.video.state === "Draft") {
                      this.updateVideoField("state", "In Review 2");
                    } else if (value.length === 0 && this.state.video.remarks.length === 0 && this.state.video.state.startsWith("In Review")) {
                      this.updateVideoField("state", "Draft");
                    }

                    if (this.state.video.remarks2.filter((row) => (row.user === this.props.account.name)).length > 0) {
                      const isPublic = this.state.video.remarks2.filter((row) => (row.user === this.props.account.name))[0].isPublic;
                      this.updateVideoField("isPublic", isPublic);
                    } else {
                      this.updateVideoField("isPublic", false);
                    }
                  }}
                />
              </Col>
            </Row>
          )
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:State")}:
          </Col>
          <Col span={5} >
            <Select disabled={this.requireAdmin(this.state.video)} virtual={false} style={{width: "100%"}} value={this.state.video.state} onChange={(value => {
              this.updateVideoField("state", value);
            })}>
              {
                [
                  {id: "Draft", name: i18next.t("video:Draft")},
                  {id: "In Review 1", name: i18next.t("video:In Review 1")},
                  {id: "In Review 2", name: i18next.t("video:In Review 2")},
                  {id: "Published", name: i18next.t("video:Published")},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("video:Is public")}:
          </Col>
          <Col span={5} >
            <Switch disabled={this.requireAdmin()} checked={this.state.video.isPublic} onChange={checked => {
              this.updateVideoField("isPublic", checked);
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
                {i18next.t("general:URL")}:
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
        {
          this.props.account.type.startsWith("video-") ? null : (
            <Segmented
              options={[
                {
                  label: (
                    <div style={{padding: 4}}>
                      <Avatar src={`${Setting.StaticBaseUrl}/img/email_mailtrap.png`} />
                            &nbsp;
                      <span style={{fontWeight: "bold"}}>Labeling</span>
                    </div>
                  ),
                  value: "Labeling",
                },
                {
                  label: (
                    <div style={{padding: 4}}>
                      <Avatar src={`${Setting.StaticBaseUrl}/img/social_slack.png`} />
                            &nbsp;
                      <span style={{fontWeight: "bold"}}>Text Recognition</span>
                    </div>
                  ),
                  value: "Text Recognition",
                  disabled: this.isSegmentsDisabled(),
                },
                {
                  label: (
                    <div style={{padding: 4}}>
                      <Avatar src={`${Setting.StaticBaseUrl}/img/social_yandex.png`} />
                            &nbsp;
                      <span style={{fontWeight: "bold"}}>Text Tagging</span>
                    </div>
                  ),
                  value: "Text Tagging",
                  disabled: this.isSegmentsDisabled(),
                },
                {
                  label: (
                    <div style={{padding: 4}}>
                      <Avatar src={`${Setting.StaticBaseUrl}/img/social_cloudflare.png`} />
                            &nbsp;
                      <span style={{fontWeight: "bold"}}>Word Cloud</span>
                    </div>
                  ),
                  value: "Word Cloud",
                  disabled: this.isWordsDisabled(),
                },
                {
                  label: (
                    <div style={{padding: 4}}>
                      <Avatar src={`${Setting.StaticBaseUrl}/img/social_openai.svg`} />
                            &nbsp;
                      <span style={{fontWeight: "bold"}}>AI Assistant</span>
                    </div>
                  ),
                  value: "AI Assistant",
                  disabled: this.props.account.type.startsWith("video-"),
                },
              ]}
              block value={this.state.video.editMode} onChange={checked => {
                this.updateVideoField("editMode", checked);
              }}
            />
          )
        }
        <Row style={{marginTop: "20px"}} >
          {
            (this.state.video.editMode === "Text Tagging" || this.state.video.editMode === "AI Assistant") ? null : (
              <React.Fragment>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {i18next.t("video:Video")}:
                </Col>
                <Col span={9} style={(Setting.isMobile()) ? {maxWidth: "100%"} : {}}>
                  <React.Fragment>
                    <Affix offsetTop={50}>
                      {
                        this.state.video !== null ? this.renderVideoContent() : null
                      }
                      {
                        this.state.video.dataUrl !== "" ? this.renderDataContent() : null
                      }
                    </Affix>
                  </React.Fragment>
                </Col>
                <Col span={1}>
                </Col>
              </React.Fragment>
            )
          }
          <Col span={(this.state.video.editMode === "Text Tagging" || this.state.video.editMode === "AI Assistant") ? 24 : 12} >
            {
              this.state.video.editMode === "Labeling" ? this.renderLabels() :
                this.state.video.editMode === "Text Recognition" ? this.renderSegments() :
                  this.state.video.editMode === "Text Tagging" ? this.renderSegmentTags() :
                    this.state.video.editMode === "Word Cloud" ? this.renderWords() :
                      this.renderChat()
            }
          </Col>
        </Row>
      </Card>
    );
  }

  exit() {
    this.props.history.push("/videos");
  }

  submitVideoEdit(exitAfterSave) {
    if ((this.state.video.remarks.filter((row) => (row.user === this.props.account.name && ["Excellent", "Good"].includes(row.score))).length > 0) ||
        (this.state.video.remarks2.filter((row) => (row.user === this.props.account.name && ["Excellent", "Good"].includes(row.score))).length > 0) ||
        this.props.account.type === "video-normal-user") {
      if (this.state.video.labels.filter((row) => (row.user === this.props.account.name)).length === 0) {
        Setting.showMessage("error", i18next.t("video:Please add a new label first before saving!"));
        return;
      }
    }

    const video = Setting.deepCopy(this.state.video);
    VideoBackend.updateVideo(this.state.video.owner, this.state.videoName, video)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              videoName: this.state.video.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/videos");
            } else {
              this.props.history.push(`/videos/${this.state.video.owner}/${this.state.video.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateVideoField("name", this.state.videoName);
          }
        } else {
          Setting.showMessage("error", `failed to save: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `failed to save: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.video !== null ? this.renderVideo() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          {
            this.requireUserOrReviewerOrAdmin(this.state.video) ? (
              <>
                <Button size="large" onClick={() => this.exit()}>{i18next.t("general:Exit")}</Button>
              </>
            ) : (
              <>
                <Button size="large" onClick={() => this.submitVideoEdit(false)}>{i18next.t("general:Save")}</Button>
                <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitVideoEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
              </>
            )
          }
        </div>
      </div>
    );
  }
}

export default VideoEditPage;

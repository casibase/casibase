import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Popconfirm, Row, Table, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import moment from "moment";
import * as Setting from "./Setting";
import * as VideoBackend from "./backend/VideoBackend";
import i18next from "i18next";

class VideoListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      videos: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getVideos();
  }

  getVideos() {
    VideoBackend.getVideos(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            videos: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get videos: ${res.msg}`);
        }
      });
  }

  newVideo() {
    return {
      owner: this.props.account.name,
      name: `video_${this.state.videos.length}`,
      createdTime: moment().format(),
      displayName: `Video ${this.state.videos.length}`,
      videoId: "",
      coverUrl: "",
      labels: [],
      dataUrls: [],
      dataUrl: "",
      playAuth: "",
    };
  }

  addVideo() {
    const newVideo = this.newVideo();
    VideoBackend.addVideo(newVideo)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Video added successfully");
          this.setState({
            videos: Setting.prependRow(this.state.videos, newVideo),
          });
        } else {
          Setting.showMessage("error", `Video failed to add: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Video failed to add: ${error}`);
      });
  }

  deleteVideo(i) {
    VideoBackend.deleteVideo(this.state.videos[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Video deleted successfully");
          this.setState({
            videos: Setting.deleteRow(this.state.videos, i),
          });
        } else {
          Setting.showMessage("error", `Video failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Video failed to delete: ${error}`);
      });
  }

  uploadFile(info) {
    const {status, response: res} = info.file;
    // if (status !== "uploading") {
    //   console.log(info.file, info.fileList);
    // }
    if (status === "done") {
      if (res.status === "ok") {
        Setting.showMessage("success", "上传视频成功");
        const videoName = res.data;
        this.props.history.push(`/videos/${videoName}`);
      } else {
        Setting.showMessage("error", `上传视频失败：${res.msg}`);
      }
    } else if (status === "error") {
      Setting.showMessage("success", "上传视频失败");
    }
  }

  renderUpload() {
    const props = {
      name: "file",
      accept: ".mp4",
      method: "post",
      action: `${Setting.ServerUrl}/api/upload-video`,
      withCredentials: true,
      onChange: (info) => {
        this.uploadFile(info);
      },
    };

    return (
      <Upload {...props}>
        <Button type="primary" size="small">
          <UploadOutlined /> 上传视频（.mp4）
        </Button>
      </Upload>
    );
  }

  renderTable(videos) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "140px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/videos/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("video:Video ID"),
        dataIndex: "videoId",
        key: "videoId",
        width: "250px",
        sorter: (a, b) => a.videoId.localeCompare(b.videoId),
      },
      {
        title: i18next.t("video:Cover"),
        dataIndex: "coverUrl",
        key: "coverUrl",
        width: "200px",
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={text}>
              <img src={text} alt={text} width={150} />
            </a>
          );
        },
      },
      {
        title: i18next.t("video:Labels"),
        dataIndex: "labels",
        key: "labels",
        // width: '120px',
        sorter: (a, b) => a.vectors.localeCompare(b.vectors),
        render: (text, record, index) => {
          return Setting.getLabelTags(text);
        },
      },
      {
        title: i18next.t("video:Label count"),
        dataIndex: "labelCount",
        key: "labelCount",
        width: "110px",
        render: (text, record, index) => {
          return record.labels.length;
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "80px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/videos/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete video: ${record.name} ?`}
                onConfirm={() => this.deleteVideo(index)}
                okText="OK"
                cancelText="Cancel"
              >
                <Button style={{marginBottom: "10px"}} type="danger">{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table columns={columns} dataSource={videos} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Videos")}
              {/* &nbsp;&nbsp;&nbsp;&nbsp;*/}
              {/* <Button type="primary" size="small" onClick={this.addVideo.bind(this)}>{i18next.t("general:Add")}</Button>*/}
                   &nbsp;&nbsp;&nbsp;&nbsp;
              {
                this.renderUpload()
              }
            </div>
          )}
          loading={videos === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <Row style={{width: "100%"}}>
          <Col span={1}>
          </Col>
          <Col span={22}>
            {
              this.renderTable(this.state.videos)
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default VideoListPage;

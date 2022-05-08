import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Popconfirm, Row, Table} from 'antd';
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

  componentWillMount() {
    this.getVideos();
  }

  getVideos() {
    VideoBackend.getVideos(this.props.account.name)
      .then((res) => {
        this.setState({
          videos: res,
        });
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
      playAuth: "",
    }
  }

  addVideo() {
    const newVideo = this.newVideo();
    VideoBackend.addVideo(newVideo)
      .then((res) => {
          Setting.showMessage("success", `Video added successfully`);
          this.setState({
            videos: Setting.prependRow(this.state.videos, newVideo),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Video failed to add: ${error}`);
      });
  }

  deleteVideo(i) {
    VideoBackend.deleteVideo(this.state.videos[i])
      .then((res) => {
          Setting.showMessage("success", `Video deleted successfully`);
          this.setState({
            videos: Setting.deleteRow(this.state.videos, i),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Video failed to delete: ${error}`);
      });
  }

  renderTable(videos) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: 'name',
        key: 'name',
        width: '140px',
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/videos/${text}`}>
              {text}
            </Link>
          )
        }
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: 'displayName',
        key: 'displayName',
        width: '200px',
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("video:Video ID"),
        dataIndex: 'videoId',
        key: 'videoId',
        width: '250px',
        sorter: (a, b) => a.videoId.localeCompare(b.videoId),
      },
      {
        title: i18next.t("video:Cover"),
        dataIndex: 'coverUrl',
        key: 'coverUrl',
        width: '200px',
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={text}>
              <img src={text} alt={text} width={150} />
            </a>
          )
        }
      },
      {
        title: i18next.t("video:Labels"),
        dataIndex: 'labels',
        key: 'labels',
        // width: '120px',
        sorter: (a, b) => a.vectors.localeCompare(b.vectors),
        render: (text, record, index) => {
          return Setting.getLabelTags(text);
        }
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: 'action',
        key: 'action',
        width: '80px',
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: '10px', marginBottom: '10px', marginRight: '10px'}} type="primary" onClick={() => this.props.history.push(`/videos/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete video: ${record.name} ?`}
                onConfirm={() => this.deleteVideo(index)}
                okText="OK"
                cancelText="Cancel"
              >
                <Button style={{marginBottom: '10px'}} type="danger">{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          )
        }
      },
    ];

    return (
      <div>
        <Table columns={columns} dataSource={videos} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
               title={() => (
                 <div>
                   {i18next.t("general:Videos")}&nbsp;&nbsp;&nbsp;&nbsp;
                   <Button type="primary" size="small" onClick={this.addVideo.bind(this)}>{i18next.t("general:Add")}</Button>
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

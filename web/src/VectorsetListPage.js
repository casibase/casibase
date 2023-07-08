import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Popconfirm, Row, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as VectorsetBackend from "./backend/VectorsetBackend";
import i18next from "i18next";

class VectorsetListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      vectorsets: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getVectorsets();
  }

  getVectorsets() {
    VectorsetBackend.getVectorsets(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            vectorsets: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get vectorsets: ${res.msg}`);
        }
      });
  }

  newVectorset() {
    return {
      owner: this.props.account.name,
      name: `vectorset_${this.state.vectorsets.length}`,
      createdTime: moment().format(),
      displayName: `Vectorset ${this.state.vectorsets.length}`,
      url: "https://github.com/Embedding/Chinese-Word-Vectors",
      fileName: "sgns.target.word-word.dynwin5.thr10.neg5.dim300.iter5",
      fileSize: "1.69 GB",
      dimension: 128,
      count: 10000,
      vectors: [],
    };
  }

  addVectorset() {
    const newVectorset = this.newVectorset();
    VectorsetBackend.addVectorset(newVectorset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Vectorset added successfully");
          this.setState({
            vectorsets: Setting.prependRow(this.state.vectorsets, newVectorset),
          });
        } else {
          Setting.showMessage("error", `Failed to add vectorset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Vectorset failed to add: ${error}`);
      });
  }

  deleteVectorset(i) {
    VectorsetBackend.deleteVectorset(this.state.vectorsets[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Vectorset deleted successfully");
          this.setState({
            vectorsets: Setting.deleteRow(this.state.vectorsets, i),
          });
        } else {
          Setting.showMessage("error", `Vectorset failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Vectorset failed to delete: ${error}`);
      });
  }

  renderTable(vectorsets) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "140px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/vectorsets/${text}`}>
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
        title: i18next.t("general:URL"),
        dataIndex: "url",
        key: "url",
        width: "250px",
        sorter: (a, b) => a.url.localeCompare(b.url),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={text}>
              {
                Setting.getShortText(text)
              }
            </a>
          );
        },
      },
      {
        title: i18next.t("vectorset:File name"),
        dataIndex: "fileName",
        key: "fileName",
        width: "200px",
        sorter: (a, b) => a.fileName.localeCompare(b.fileName),
      },
      {
        title: i18next.t("vectorset:File size"),
        dataIndex: "fileSize",
        key: "fileSize",
        width: "120px",
        sorter: (a, b) => a.fileSize.localeCompare(b.fileSize),
      },
      {
        title: i18next.t("vectorset:Dimension"),
        dataIndex: "dimension",
        key: "dimension",
        width: "110px",
        sorter: (a, b) => a.dimension - b.dimension,
      },
      {
        title: i18next.t("vectorset:Example vectors"),
        dataIndex: "vectors",
        key: "vectors",
        // width: '120px',
        sorter: (a, b) => a.vectors.localeCompare(b.vectors),
        render: (text, record, index) => {
          return Setting.getTags(text);
        },
      },
      {
        title: i18next.t("vectorset:Count"),
        dataIndex: "count",
        key: "count",
        width: "110px",
        sorter: (a, b) => a.count - b.count,
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "80px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/vectorsets/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete vectorset: ${record.name} ?`}
                onConfirm={() => this.deleteVectorset(index)}
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
        <Table columns={columns} dataSource={vectorsets} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Vectorsets")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addVectorset.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={vectorsets === null}
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
              this.renderTable(this.state.vectorsets)
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default VectorsetListPage;

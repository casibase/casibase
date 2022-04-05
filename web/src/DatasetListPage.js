import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Popconfirm, Row, Table} from 'antd';
import moment from "moment";
import * as Setting from "./Setting";
import * as DatasetBackend from "./backend/DatasetBackend";
import i18next from "i18next";

class DatasetListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      datasets: null,
    };
  }

  componentWillMount() {
    this.getDatasets();
  }

  getDatasets() {
    DatasetBackend.getDatasets(this.props.account.name)
      .then((res) => {
        this.setState({
          datasets: res,
        });
      });
  }

  newDataset() {
    return {
      owner: this.props.account.name,
      name: `dataset_${this.state.datasets.length}`,
      createdTime: moment().format(),
      displayName: `Dataset ${this.state.datasets.length}`,
      distance: 100,
      vectors: [],
    }
  }

  addDataset() {
    const newDataset = this.newDataset();
    DatasetBackend.addDataset(newDataset)
      .then((res) => {
          Setting.showMessage("success", `Dataset added successfully`);
          this.setState({
            datasets: Setting.prependRow(this.state.datasets, newDataset),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Dataset failed to add: ${error}`);
      });
  }

  deleteDataset(i) {
    DatasetBackend.deleteDataset(this.state.datasets[i])
      .then((res) => {
          Setting.showMessage("success", `Dataset deleted successfully`);
          this.setState({
            datasets: Setting.deleteRow(this.state.datasets, i),
          });
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Dataset failed to delete: ${error}`);
      });
  }

  renderTable(datasets) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: 'name',
        key: 'name',
        width: '120px',
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/datasets/${text}`}>
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
        title: i18next.t("dataset:Distance"),
        dataIndex: 'distance',
        key: 'distance',
        width: '120px',
        sorter: (a, b) => a.distance - b.distance,
      },
      {
        title: i18next.t("dataset:Vectors"),
        dataIndex: 'vectors',
        key: 'vectors',
        // width: '120px',
        sorter: (a, b) => a.vectors.localeCompare(b.vectors),
        render: (text, record, index) => {
          return Setting.getTags(text);
        }
      },
      {
        title: i18next.t("dataset:All vectors"),
        dataIndex: 'allVectors',
        key: 'allVectors',
        width: '140px',
        sorter: (a, b) => a.allVectors - b.allVectors,
        render: (text, record, index) => {
          return record.vectors.length;
        }
      },
      {
        title: i18next.t("dataset:Valid vectors"),
        dataIndex: 'validVectors',
        key: 'validVectors',
        width: '140px',
        sorter: (a, b) => a.validVectors - b.validVectors,
        render: (text, record, index) => {
          return record.vectors.filter(vector => vector.data.length !== 0).length;
        }
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: 'action',
        key: 'action',
        width: '160px',
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: '10px', marginBottom: '10px', marginRight: '10px'}} type="primary" onClick={() => this.props.history.push(`/datasets/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete dataset: ${record.name} ?`}
                onConfirm={() => this.deleteDataset(index)}
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
        <Table columns={columns} dataSource={datasets} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
               title={() => (
                 <div>
                   {i18next.t("general:Datasets")}&nbsp;&nbsp;&nbsp;&nbsp;
                   <Button type="primary" size="small" onClick={this.addDataset.bind(this)}>{i18next.t("general:Add")}</Button>
                 </div>
               )}
               loading={datasets === null}
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
              this.renderTable(this.state.datasets)
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DatasetListPage;

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
      startDate: moment().format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
      fullName: `Dataset ${this.state.datasets.length}`,
      organizer: "Casbin",
      location: "Shanghai, China",
      address: "3663 Zhongshan Road North",
      status: "Public",
      language: "zh",
      carousels: [],
      introText: "Introduction..",
      defaultItem: "Home",
      treeItems: [{key: "Home", title: "首页", titleEn: "Home", content: "内容", contentEn: "Content", children: []}],
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
        title: i18next.t("dataset:Start date"),
        dataIndex: 'startDate',
        key: 'startDate',
        width: '70px',
        sorter: (a, b) => a.startDate.localeCompare(b.startDate),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        }
      },
      {
        title: i18next.t("dataset:End date"),
        dataIndex: 'endDate',
        key: 'endDate',
        width: '70px',
        sorter: (a, b) => a.endDate.localeCompare(b.endDate),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        }
      },
      {
        title: i18next.t("dataset:Full name"),
        dataIndex: 'fullName',
        key: 'fullName',
        width: '200px',
        sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      },
      {
        title: i18next.t("dataset:Organizer"),
        dataIndex: 'organizer',
        key: 'organizer',
        width: '120px',
        sorter: (a, b) => a.organizer.localeCompare(b.organizer),
      },
      {
        title: i18next.t("dataset:Location"),
        dataIndex: 'location',
        key: 'location',
        width: '120px',
        sorter: (a, b) => a.location.localeCompare(b.location),
      },
      {
        title: i18next.t("dataset:Address"),
        dataIndex: 'address',
        key: 'address',
        width: '120px',
        sorter: (a, b) => a.address.localeCompare(b.address),
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: 'status',
        key: 'status',
        width: '80px',
        sorter: (a, b) => a.status.localeCompare(b.status),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: 'action',
        key: 'action',
        width: '120px',
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

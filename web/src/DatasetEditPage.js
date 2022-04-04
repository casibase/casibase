import React from "react";
import {Button, Card, Col, Input, InputNumber, Row} from 'antd';
import * as DatasetBackend from "./backend/DatasetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import VectorTable from "./VectorTable";
import Dataset from "./Dataset";

class DatasetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      datasetName: props.match.params.datasetName,
      dataset: null,
    };
  }

  componentWillMount() {
    this.getDataset();
  }

  getDataset() {
    DatasetBackend.getDataset(this.props.account.name, this.state.datasetName)
      .then((dataset) => {
        this.setState({
          dataset: dataset,
        });
      });
  }

  parseDatasetField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateDatasetField(key, value) {
    value = this.parseDatasetField(key, value);

    let dataset = this.state.dataset;
    dataset[key] = value;
    this.setState({
      dataset: dataset,
    });
  }

  renderDataset() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("dataset:Edit Dataset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitDatasetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: '5px'}} type="inner">
        <Row style={{marginTop: '10px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.name} onChange={e => {
              this.updateDatasetField('name', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.displayName} onChange={e => {
              this.updateDatasetField('displayName', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("dataset:Distance")} :
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.dataset.distance} onChange={value => {
              this.updateDatasetField('distance', value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("dataset:Vectors")}:
          </Col>
          <Col span={22} >
            <VectorTable
              title={i18next.t("dataset:Vectors")}
              table={this.state.dataset.vectors}
              onUpdateTable={(value) => { this.updateDatasetField('vectors', value)}}
            />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Preview")} :
          </Col>
          <Col span={22} >
            <Dataset dataset={this.state.dataset} />
          </Col>
        </Row>
      </Card>
    )
  }

  submitDatasetEdit() {
    let dataset = Setting.deepCopy(this.state.dataset);
    DatasetBackend.updateDataset(this.state.dataset.owner, this.state.datasetName, dataset)
      .then((res) => {
        if (res) {
          Setting.showMessage("success", `Successfully saved`);
          this.setState({
            datasetName: this.state.dataset.name,
          });
          this.props.history.push(`/datasets/${this.state.dataset.name}`);
        } else {
          Setting.showMessage("error", `failed to save: server side failure`);
          this.updateDatasetField('name', this.state.datasetName);
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
              this.state.dataset !== null ? this.renderDataset() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitDatasetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DatasetEditPage;

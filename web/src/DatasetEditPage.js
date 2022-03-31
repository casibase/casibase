import React from "react";
import {Button, Card, Col, DatePicker, Input, Row, Select} from 'antd';
import * as DatasetBackend from "./backend/DatasetBackend";
import * as Setting from "./Setting";
import moment from "moment";
import i18next from "i18next";

const { Option } = Select;

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
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.name} onChange={e => {
              this.updateDatasetField('name', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Start date")}:
          </Col>
          <Col span={5} >
            <DatePicker defaultValue={moment(this.state.dataset.startDate, "YYYY-MM-DD")} onChange={(time, timeString) => {
              this.updateDatasetField('startDate', timeString);
            }} />
          </Col>
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:End date")}:
          </Col>
          <Col span={10} >
            <DatePicker defaultValue={moment(this.state.dataset.endDate, "YYYY-MM-DD")} onChange={(time, timeString) => {
              this.updateDatasetField('endDate', timeString);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Full name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.fullName} onChange={e => {
              this.updateDatasetField('fullName', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Organizer")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.organizer} onChange={e => {
              this.updateDatasetField('organizer', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Location")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.location} onChange={e => {
              this.updateDatasetField('location', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Address")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.address} onChange={e => {
              this.updateDatasetField('address', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("general:Status")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: '100%'}} value={this.state.dataset.status} onChange={(value => {this.updateDatasetField('status', value);})}>
              {
                [
                  {id: 'Public', name: 'Public (Everyone can see it)'},
                  {id: 'Hidden', name: 'Hidden (Only yourself can see it)'},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Carousels")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} mode="tags" style={{width: '100%'}} placeholder="Please input"
                    value={this.state.dataset.carousels}
                    onChange={value => {
                      this.updateDatasetField('carousels', value);
                    }}
            >
              {
                this.state.dataset.carousels.map((carousel, index) => <Option key={carousel}>{carousel}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Introduction text")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.dataset.introText} onChange={e => {
              this.updateDatasetField('introText', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Default item")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: '100%'}} value={this.state.dataset.defaultItem} onChange={value => {this.updateDatasetField('defaultItem', value);}}>
              {
                this.state.dataset.treeItems.filter(treeItem => treeItem.children.length === 0).map((treeItem, index) => <Option key={treeItem.title}>{`${treeItem.title} | ${treeItem.titleEn}`}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={2}>
            {i18next.t("dataset:Language")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: '100%'}} value={this.state.dataset.language} onChange={(value => {this.updateDatasetField('language', value);})}>
              {
                [
                  {id: 'zh', name: 'zh'},
                  {id: 'en', name: 'en'},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
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

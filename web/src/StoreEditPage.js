import React from "react";
import {Button, Card, Col, Input, InputNumber, Row, Select} from 'antd';
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import VectorTable from "./VectorTable";

const { Option } = Select;

class StoreEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      storeName: props.match.params.storeName,
      store: null,
      vectorsets: null,
      matchLoading: false,
    };
  }

  componentWillMount() {
    this.getStore();
    this.getVectorsets();
  }

  getStore() {
    StoreBackend.getStore(this.props.account.name, this.state.storeName)
      .then((store) => {
        this.setState({
          store: store,
        });
      });
  }

  parseStoreField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateStoreField(key, value) {
    value = this.parseStoreField(key, value);

    let store = this.state.store;
    store[key] = value;
    this.setState({
      store: store,
    });
  }

  renderStore() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("store:Edit Store")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitStoreEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: '5px'}} type="inner">
        <Row style={{marginTop: '10px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.name} onChange={e => {
              this.updateStoreField('name', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.displayName} onChange={e => {
              this.updateStoreField('displayName', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Vectorset")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: '100%'}} value={this.state.store.vectorset} onChange={(value => {this.updateStoreField('vectorset', value);})}>
              {
                this.state.vectorsets?.map((vectorset, index) => <Option key={index} value={vectorset.name}>{vectorset.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Distance limit")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.store.distanceLimit} onChange={value => {
              this.updateStoreField('distanceLimit', value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Words")}:
          </Col>
          <Col span={22} >
            <VectorTable
              title={i18next.t("store:Words")}
              table={this.state.store.vectors}
              store={this.state.store}
              onUpdateTable={(value) => { this.updateStoreField('vectors', value)}}
            />
          </Col>
        </Row>
      </Card>
    )
  }

  submitStoreEdit() {
    let store = Setting.deepCopy(this.state.store);
    StoreBackend.updateStore(this.state.store.owner, this.state.storeName, store)
      .then((res) => {
        if (res) {
          Setting.showMessage("success", `Successfully saved`);
          this.setState({
            storeName: this.state.store.name,
          });
          this.props.history.push(`/stores/${this.state.store.name}`);
        } else {
          Setting.showMessage("error", `failed to save: server side failure`);
          this.updateStoreField('name', this.state.storeName);
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
              this.state.store !== null ? this.renderStore() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitStoreEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default StoreEditPage;

import React from "react";
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {LinkOutlined} from "@ant-design/icons";

const {Option} = Select;

class ProviderEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      providerName: props.match.params.providerName,
      provider: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getProvider();
  }

  getProvider() {
    ProviderBackend.getProvider(this.props.account.name, this.state.providerName)
      .then((provider) => {
        if (provider.status === "ok") {
          this.setState({
            provider: provider.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get provider: ${provider.msg}`);
        }
      });
  }

  parseProviderField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateProviderField(key, value) {
    value = this.parseProviderField(key, value);

    const provider = this.state.provider;
    provider[key] = value;
    this.setState({
      provider: provider,
    });
  }

  renderProvider() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("provider:Edit Provider")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitProviderEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.name} onChange={e => {
              this.updateProviderField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.displayName} onChange={e => {
              this.updateProviderField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Category")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.provider.category} onChange={(value => {this.updateProviderField("category", value);})}>
              {
                [
                  {id: "AI", name: "AI"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Type")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.provider.type} onChange={(value => {this.updateProviderField("type", value);})}>
              {
                [
                  {id: "OpenAI API - GPT 3.5", name: "OpenAI API - GPT 3.5"},
                  {id: "OpenAI API - GPT 4", name: "OpenAI API - GPT 4"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Secret key")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.clientSecret} onChange={e => {
              this.updateProviderField("clientSecret", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Provider URL")}:
          </Col>
          <Col span={22} >
            <Input prefix={<LinkOutlined />} value={this.state.provider.providerUrl} onChange={e => {
              this.updateProviderField("providerUrl", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitProviderEdit() {
    const provider = Setting.deepCopy(this.state.provider);
    ProviderBackend.updateProvider(this.state.provider.owner, this.state.providerName, provider)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              providerName: this.state.provider.name,
            });
            this.props.history.push(`/providers/${this.state.provider.name}`);
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateProviderField("name", this.state.providerName);
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
        <Row style={{width: "100%"}}>
          <Col span={1}>
          </Col>
          <Col span={22}>
            {
              this.state.provider !== null ? this.renderProvider() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitProviderEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ProviderEditPage;

import React from "react";
import {Button, Card, Col, Input, InputNumber, Row} from "antd";
import * as VectorsetBackend from "./backend/VectorsetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import VectorTable from "./VectorTable";
import {LinkOutlined} from "@ant-design/icons";

class VectorsetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      vectorsetName: props.match.params.vectorsetName,
      vectorset: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getVectorset();
  }

  getVectorset() {
    VectorsetBackend.getVectorset(this.props.account.name, this.state.vectorsetName)
      .then((vectorset) => {
        this.setState({
          vectorset: vectorset,
        });
      });
  }

  parseVectorsetField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateVectorsetField(key, value) {
    value = this.parseVectorsetField(key, value);

    const vectorset = this.state.vectorset;
    vectorset[key] = value;
    this.setState({
      vectorset: vectorset,
    });
  }

  renderVectorset() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("vectorset:Edit Vectorset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitVectorsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vectorset.name} onChange={e => {
              this.updateVectorsetField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vectorset.displayName} onChange={e => {
              this.updateVectorsetField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:URL")}:
          </Col>
          <Col span={22} >
            <Input prefix={<LinkOutlined />} value={this.state.vectorset.url} onChange={e => {
              this.updateVectorsetField("url", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vectorset:File name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vectorset.fileName} onChange={e => {
              this.updateVectorsetField("fileName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vectorset:File size")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vectorset.fileSize} onChange={e => {
              this.updateVectorsetField("fileSize", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vectorset:Dimension")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.vectorset.dimension} onChange={value => {
              this.updateVectorsetField("dimension", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vectorset:Count")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.vectorset.count} onChange={value => {
              this.updateVectorsetField("count", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vectorset:Example vectors")}:
          </Col>
          <Col span={22} >
            <VectorTable
              title={i18next.t("vectorset:Example vectors")}
              table={this.state.vectorset.vectors}
              onUpdateTable={(value) => {this.updateVectorsetField("vectors", value);}}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitVectorsetEdit() {
    const vectorset = Setting.deepCopy(this.state.vectorset);
    VectorsetBackend.updateVectorset(this.state.vectorset.owner, this.state.vectorsetName, vectorset)
      .then((res) => {
        if (res) {
          Setting.showMessage("success", "Successfully saved");
          this.setState({
            vectorsetName: this.state.vectorset.name,
          });
          this.props.history.push(`/vectorsets/${this.state.vectorset.name}`);
        } else {
          Setting.showMessage("error", "failed to save: server side failure");
          this.updateVectorsetField("name", this.state.vectorsetName);
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
              this.state.vectorset !== null ? this.renderVectorset() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitVectorsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default VectorsetEditPage;

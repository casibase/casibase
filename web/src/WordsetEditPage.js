import React from "react";
import {Button, Card, Col, Input, Row, Select} from 'antd';
import * as WordsetBackend from "./backend/WordsetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import VectorTable from "./VectorTable";
import WordsetGraph from "./WordsetGraph";
import * as VectorsetBackend from "./backend/VectorsetBackend";

const { Option } = Select;

class WordsetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsetName: props.match.params.wordsetName,
      wordset: null,
      vectorsets: null,
    };
  }

  componentWillMount() {
    this.getWordset();
    this.getVectorsets();
  }

  getWordset() {
    WordsetBackend.getWordset(this.props.account.name, this.state.wordsetName)
      .then((wordset) => {
        this.setState({
          wordset: wordset,
        });
      });
  }

  getVectorsets() {
    VectorsetBackend.getVectorsets(this.props.account.name)
      .then((res) => {
        this.setState({
          vectorsets: res,
        });
      });
  }

  parseWordsetField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateWordsetField(key, value) {
    value = this.parseWordsetField(key, value);

    let wordset = this.state.wordset;
    wordset[key] = value;
    this.setState({
      wordset: wordset,
    });
  }

  renderWordset() {
    const allWords = this.state.wordset?.vectors.length;
    const validWords = this.state.wordset?.vectors.filter(vector => vector.data.length !== 0).length;

    return (
      <Card size="small" title={
        <div>
          {i18next.t("wordset:Edit Wordset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitWordsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: '5px'}} type="inner">
        <Row style={{marginTop: '10px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.wordset.name} onChange={e => {
              this.updateWordsetField('name', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.wordset.displayName} onChange={e => {
              this.updateWordsetField('displayName', e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Vectorset")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: '100%'}} value={this.state.wordset.vectorset} onChange={(value => {this.updateWordsetField('vectorset', value);})}>
              {
                this.state.vectorsets?.map((vectorset, index) => <Option key={index} value={vectorset.name}>{vectorset.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Match")}:
          </Col>
          <Col span={22} >
            <Button type="primary" onClick={() => {
              WordsetBackend.getWordsetMatch(this.props.account.name, this.state.wordsetName)
                .then((wordset) => {
                  this.setState({
                    wordset: wordset,
                  });
                });
            }}>{i18next.t("wordset:Match")}</Button>
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Matched")}:
          </Col>
          <Col span={22} >
            <Input value={`${Setting.getPercentage(allWords === 0 ? 0 : validWords / allWords)}% (${validWords} / ${allWords})`} />
          </Col>
        </Row>
        {/*<Row style={{marginTop: '20px'}} >*/}
        {/*  <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>*/}
        {/*    {i18next.t("wordset:Distance")}:*/}
        {/*  </Col>*/}
        {/*  <Col span={22} >*/}
        {/*    <InputNumber value={this.state.wordset.distance} onChange={value => {*/}
        {/*      this.updateWordsetField('distance', value);*/}
        {/*    }} />*/}
        {/*  </Col>*/}
        {/*</Row>*/}
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Words")}:
          </Col>
          <Col span={22} >
            <VectorTable
              title={i18next.t("wordset:Words")}
              table={this.state.wordset.vectors}
              onUpdateTable={(value) => { this.updateWordsetField('vectors', value)}}
            />
          </Col>
        </Row>
        <Row style={{marginTop: '20px'}} >
          <Col style={{marginTop: '5px'}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Preview")}:
          </Col>
          <Col span={22} >
            <WordsetGraph wordset={this.state.wordset} wordsetName={this.state.wordset.name} />
          </Col>
        </Row>
      </Card>
    )
  }

  submitWordsetEdit() {
    let wordset = Setting.deepCopy(this.state.wordset);
    WordsetBackend.updateWordset(this.state.wordset.owner, this.state.wordsetName, wordset)
      .then((res) => {
        if (res) {
          Setting.showMessage("success", `Successfully saved`);
          this.setState({
            wordsetName: this.state.wordset.name,
          });
          this.props.history.push(`/wordsets/${this.state.wordset.name}`);
        } else {
          Setting.showMessage("error", `failed to save: server side failure`);
          this.updateWordsetField('name', this.state.wordsetName);
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
              this.state.wordset !== null ? this.renderWordset() : null
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
        <Row style={{margin: 10}}>
          <Col span={2}>
          </Col>
          <Col span={18}>
            <Button type="primary" size="large" onClick={this.submitWordsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default WordsetEditPage;

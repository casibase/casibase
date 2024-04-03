// Copyright 2024 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as ArticleBackend from "./backend/ArticleBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as ProviderBackend from "./backend/ProviderBackend";
import ArticleTable from "./ArticleTable";

class ArticleEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      articleName: props.match.params.articleName,
      modelProviders: [],
      article: null,
      chatPageObj: null,
      loading: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getArticle();
    this.getModelProviders();
  }

  getArticle() {
    ArticleBackend.getArticle(this.props.account.name, this.state.articleName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            article: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get article: ${res.msg}`);
        }
      });
  }

  getModelProviders() {
    ProviderBackend.getProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            modelProviders: res.data.filter(provider => provider.category === "Model"),
          });
        } else {
          Setting.showMessage("error", `Failed to get providers: ${res.msg}`);
        }
      });
  }

  parseArticleField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateArticleField(key, value) {
    value = this.parseArticleField(key, value);

    const article = this.state.article;
    article[key] = value;
    this.setState({
      article: article,
    });
  }

  renderArticle() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("article:Edit Framework")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitArticleEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitArticleEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.article.name} onChange={e => {
              this.updateArticleField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.article.displayName} onChange={e => {
              this.updateArticleField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        {
          this.props.account.name !== "admin" ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("store:Model provider")}:
              </Col>
              <Col span={22} >
                <Select virtual={false} style={{width: "100%"}} value={this.state.article.provider} onChange={(value => {this.updateArticleField("provider", value);})}
                  options={this.state.modelProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, `${provider.name}`))
                  } />
              </Col>
            </Row>
          )
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("article:Content")}:
          </Col>
          <Col span={22} >
            <ArticleTable table={this.state.article.content} onUpdateTable={(value) => {this.updateArticleField("content", value);}} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitArticleEdit(exitAfterSave) {
    const article = Setting.deepCopy(this.state.article);
    ArticleBackend.updateArticle(this.state.article.owner, this.state.articleName, article)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              articleName: this.state.article.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/articles");
            } else {
              this.props.history.push(`/articles/${this.state.article.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateArticleField("name", this.state.articleName);
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
        {
          this.state.article !== null ? this.renderArticle() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitArticleEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitArticleEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default ArticleEditPage;

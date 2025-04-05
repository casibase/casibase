// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import {Affix, Button, Card, Col, Input, Popover, Row, Select} from "antd";
import * as ArticleBackend from "./backend/ArticleBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as ProviderBackend from "./backend/ProviderBackend";
import ArticleTable from "./ArticleTable";
import ArticleMenu from "./ArticleMenu";

const {Option} = Select;
const {TextArea} = Input;

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

    this.articleTableRef = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.getArticle();
    this.getModelProviders();
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    // Check if Ctrl or Command (for macOS) is pressed along with S
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault(); // Prevent the browser's save action
      this.submitArticleEdit(false); // Call your method here
    }
  };

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

  preprocessText(text) {
    text = text.split("\n").filter(line => !line.trim().startsWith("%")).join("\n");

    const ignoreCommands = [
      "\\documentclass", "\\usepackage", "\\setcounter", "\\urldef", "\\newcommand",
      "\\begin{document}", "\\end{document}", "\\titlerunning", "\\authorrunning",
      "\\toctitle", "\\tocauthor", "\\maketitle", "\\mainmatter", "\\bibliographystyle", "\\bibliography",
      "\\begin{spacing}", "\\end{spacing}", "\\noindent", "\\author", "\\institute", "\\email", "\\keywords", "\\label",
    ];
    text = text.split("\n").filter(line => {
      return !ignoreCommands.some(cmd => line.trim().startsWith(cmd));
    }).join("\n");

    text = text.replace("\\section*{", "\\section{");

    return text;
  }

  refineTextEn(text) {
    text = text.replace(/\n{3,}/g, "\n\n");
    text = text.replace(/^\n+/, "").replace(/\n+$/, "");
    return text;
  }

  splitTextBlocks(blocks) {
    // Maximum length of text in a block before splitting
    const textMaxLength = 1000; // Adjust this value as needed

    let blockIndex = 0;
    blocks.forEach((block, index) => {
      if (block.type === "Text") {
        const paragraphs = block.textEn.split("\n");
        const newBlocks = [];
        let currentText = "";

        paragraphs.forEach((paragraph) => {
          if ((currentText.length + paragraph.length) > textMaxLength) {
            if (currentText.trim() !== "") {
              // Push the current text as a new block and reset currentText
              newBlocks.push({no: blockIndex++, type: "Text", text: "", textEn: currentText.trim(), state: ""});
              currentText = "";
            }
            // If the paragraph itself is longer than textMaxLength, it becomes a new block
            if (paragraph.length > textMaxLength) {
              newBlocks.push({no: blockIndex++, type: "Text", text: "", textEn: paragraph, state: ""});
            } else {
              currentText = paragraph;
            }
          } else {
            // Accumulate paragraph
            currentText += paragraph + "\n";
          }
        });

        // Check if there is remaining text to be pushed as a new block
        if (currentText.trim() !== "") {
          newBlocks.push({no: blockIndex++, type: "Text", text: "", textEn: currentText.trim(), state: ""});
        }

        // Replace the original block with the new blocks
        blocks.splice(index, 1, ...newBlocks);
      }
    });

    return blocks;
  }

  parseText() {
    let text = this.state.article.text;
    text = this.preprocessText(text);
    this.updateArticleField("text", text);

    let blocks = [];
    let blockIndex = 0;

    const patterns = [
      {pattern: new RegExp("\\\\title\\{([^}]+)}", "g"), type: "Title"},
      {pattern: new RegExp("\\\\begin\\{abstract}([\\s\\S]*?)\\\\end\\{abstract}", "g"), type: "Abstract"},
      {pattern: new RegExp("\\\\section\\{([^}]+)}", "g"), type: "Header 1"},
      {pattern: new RegExp("\\\\subsection\\{([^}]+)}", "g"), type: "Header 2"},
      {pattern: new RegExp("\\\\subsubsection\\{([^}]+)}", "g"), type: "Header 3"},
    ];

    const matches = [];

    patterns.forEach(({pattern, type}) => {
      const allMatches = [...text.matchAll(pattern)];

      allMatches.forEach(match => {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: type,
          text: match[1],
        });
      });
    });

    // Sort the matches by their position in the text
    matches.sort((a, b) => a.index - b.index);

    // Process the matches to create blocks
    let lastIndex = 0;
    matches.forEach(match => {
      // Check for any text before the current match that hasn't been matched; consider it as regular text
      if (match.index > lastIndex) {
        const textPart = text.substring(lastIndex, match.index).trim();
        if (textPart) {
          blocks.push({no: blockIndex++, type: "Text", text: "", textEn: textPart, state: ""});
        }
      }
      // Add the current match as a block
      blocks.push({no: blockIndex++, type: match.type, text: "", textEn: match.text, state: ""});
      lastIndex = match.index + match.length;
    });

    // Check for any unmatched text at the end of the document as regular text
    if (lastIndex < text.length) {
      const textPart = text.substring(lastIndex).trim();
      if (textPart) {
        blocks.push({no: blockIndex++, type: "Text", text: "", textEn: textPart, state: ""});
      }
    }

    blocks.forEach(block => {
      block.textEn = this.refineTextEn(block.textEn);
    });

    blocks = this.splitTextBlocks(blocks);

    this.updateArticleField("content", blocks);
  }

  getBlocksWithPrefix(blocks) {
    let header1Counter = 0;
    let header2Counter = 0;
    let header3Counter = 0;
    let lastHeader1Index = 0;
    let lastHeader2Index = 0;

    return blocks.map((block, index) => {
      switch (block.type) {
      case "Title":
        block.prefix = "Tit: ";
        break;
      case "Abstract":
        block.prefix = "Abs: ";
        break;
      case "Text":
        block.prefix = "";
        break;
      case "Header 1":
        header1Counter++;
        header2Counter = 0; // Reset header2Counter when a new Header 1 is encountered
        header3Counter = 0; // Reset header3Counter for new Header 1 section
        lastHeader1Index = header1Counter;
        block.prefix = `${header1Counter}. `;
        break;
      case "Header 2":
        header2Counter++;
        header3Counter = 0; // Reset header3Counter when a new Header 2 is encountered
        lastHeader2Index = header2Counter;
        block.prefix = `${lastHeader1Index}.${header2Counter} `;
        break;
      case "Header 3":
        header3Counter++;
        block.prefix = `${lastHeader1Index}.${lastHeader2Index}.${header3Counter} `;
        break;
      default:
        block.prefix = "";
      }
      return block;
    });
  }

  exportText(isEn) {
    const blocks = this.state.article.content;
    let text = "";

    blocks.forEach(block => {
      let blockText;
      if (isEn) {
        blockText = block.textEn;
        if (blockText === "") {
          blockText = block.text;
        }
      } else {
        blockText = block.text;
        if (blockText === "") {
          blockText = block.textEn;
        }
      }

      let label = `\\label{sec:${block.textEn}}`;
      if (label === "") {
        label = `\\label{sec:${block.text}}`;
      }

      switch (block.type) {
      case "Title":
        text += `\\title{${blockText}}\n\n`;
        break;
      case "Abstract":
        text += `\\begin{abstract}\n${blockText}\n\\end{abstract}\n\n`;
        break;
      case "Header 1":
        text += `\\section{${blockText}}\n${label}\n\n`;
        break;
      case "Header 2":
        text += `\\subsection{${blockText}}\n${label}\n\n`;
        break;
      case "Header 3":
        text += `\\subsubsection{${blockText}}\n${label}\n\n`;
        break;
      case "Text":
        text += `${blockText}\n\n`;
        break;
      default:
        Setting.showMessage("error", `Unknown block type: ${block.type}`);
      }
    });

    this.updateArticleField("text", text);
  }

  renderArticle() {
    const blocks = this.getBlocksWithPrefix(this.state.article.content);

    return (
      <Card size="small" title={
        <div>
          {i18next.t("article:Edit Article")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitArticleEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitArticleEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={2} >
            <Input value={this.state.article.name} onChange={e => {
              this.updateArticleField("name", e.target.value);
            }} />
          </Col>
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={2} >
            <Input value={this.state.article.displayName} onChange={e => {
              this.updateArticleField("displayName", e.target.value);
            }} />
          </Col>
          {
            this.props.account.name !== "admin" ? null : (
              <React.Fragment>
                <Col span={1} />
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {i18next.t("store:Model provider")}:
                </Col>
                <Col span={5} >
                  <Select virtual={false} style={{width: "100%"}} value={this.state.article.provider} onChange={(value => {this.updateArticleField("provider", value);})}
                    options={this.state.modelProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, `${provider.name}`))
                    } />
                </Col>
              </React.Fragment>
            )
          }
          <Col span={1} />
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("general:Text")}:
          </Col>
          <Col span={4}>
            <Popover placement="left" content={
              <div style={{width: "1000px"}}>
                <Select virtual={false} mode="tags" style={{width: "100%"}} value={this.state.article.glossary} onChange={(value => {this.updateArticleField("glossary", value);})}>
                  {
                    this.state.article.glossary?.map((item, index) => <Option key={index} value={item}>{item}</Option>)
                  }
                </Select>
                <Button style={{marginTop: "20px", marginBottom: "20px", marginRight: "20px"}}
                  onClick={() => this.parseText()}>{i18next.t("article:Parse")}</Button>
                <Button style={{marginTop: "20px", marginBottom: "20px", marginRight: "20px"}} type="primary"
                  onClick={() => this.exportText(true)}>{i18next.t("article:Export")}</Button>
                <Button style={{marginTop: "20px", marginBottom: "20px"}}
                  onClick={() => this.exportText(false)}>{i18next.t("article:Export ZH")}</Button>
                <TextArea autoSize={{minRows: 1, maxRows: 30}} showCount value={this.state.article.text} onChange={(e) => {
                  this.updateArticleField("text", e.target.value);
                }} />
              </div>
            } title="" trigger="hover">
              <Input value={this.state.article.text} onChange={e => {
                this.updateArticleField("text", e.target.value);
              }} />
            </Popover>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          {/* <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>*/}
          {/*  {i18next.t("article:Content")}:*/}
          {/* </Col>*/}
          <Col span={5} >
            <Affix offsetTop={0} style={{marginRight: "10px"}}>
              <div style={{backgroundColor: "white", height: "100vh", overflowY: "auto", borderRight: 0}}>
                <ArticleMenu table={blocks} onGoToRow={(table, i) => {
                  if (this.articleTableRef.current) {
                    this.articleTableRef.current.goToRow(table, i);
                  }
                }} />
              </div>
            </Affix>
          </Col>
          {/* <Col span={1} />*/}
          <Col span={19} >
            <ArticleTable ref={this.articleTableRef} article={this.state.article} table={blocks} onUpdateTable={(value) => {this.updateArticleField("content", value);}} onSubmitArticleEdit={() => {this.submitArticleEdit(false);}} />
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

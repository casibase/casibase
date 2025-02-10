// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {Button, Card, Col, Empty, InputNumber, List, Row, Select, Slider, Spin, Switch, Tooltip} from "antd";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import * as d3 from "d3-force";
import * as WordsetBackend from "./backend/WordsetBackend";
import i18next from "i18next";
import FileSaver from "file-saver";
import XLSX from "xlsx";
import * as Setting from "./Setting";

const {Option} = Select;

const fg = React.createRef();

class ForceGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    if (!this.props.enable3D) {
      return (
        <ForceGraph2D ref={fg} {...this.props} />
      );
    } else {
      return (
        <ForceGraph3D ref={fg} {...this.props} />
      );
    }
  }
}

class WordsetGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsetName: props.wordsetName !== undefined ? props.wordsetName : props.match.params.wordsetName,
      graph: null,
      loading: false,
      enableStatic: false,
      // enableCurve: true,
      enableBolderLink: false,
      enable3D: false,
      // particlePercent: 100,
      strength: 20,
      distanceMax: 100,
      clusterNumber: 100,
      distanceLimit: this.props.wordset.distanceLimit,
      selectedType: null,
      selectedId: null,
      selectedIds: [],
    };
  }

  UNSAFE_componentWillMount() {
    this.getWordsetGraph();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    fg.current?.d3Force("collision", d3.forceCollide(15));
  }

  getWordsetGraph() {
    this.setState({
      loading: true,
    });
    WordsetBackend.getWordsetGraph("admin", this.state.wordsetName, this.state.clusterNumber, this.state.distanceLimit)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            graph: res.data,
            loading: false,
            selectedType: null,
            selectedId: null,
            selectedIds: [],
          });
        } else {
          Setting.showMessage("error", `Failed to get wordset graph: ${res.msg}`);
        }
      });
  }

  downloadClusters() {
    let data = [];
    this.state.graph.nodes.forEach((node, i) => {
      const row = {};

      row[0] = node.id;
      row[1] = parseInt(node.tag) + 1;
      data.push(row);
    });

    data = data.sort((a, b) => {return a[1] - b[1];});

    const sheet = XLSX.utils.json_to_sheet(data, {skipHeader: true});
    const blob = Setting.sheet2blob(sheet, "clusters");
    const fileName = `clusters-${this.state.wordsetName}-${this.state.graph.nodes.length}-${this.state.clusterNumber}.xlsx`;
    FileSaver.saveAs(blob, fileName);
  }

  renderSubMenu(node) {
    const links = this.state.graph.links.filter(link => (link.source === node.id || link.target === node.id || link.source.id === node.id || link.target.id === node.id)).sort((a, b) => {return a.tag - b.tag;});

    return (
      <List
        // style={{height: "200px"}}
        size="small"
        header={
          <div>
            边数：{links.length}
          </div>
        }
        dataSource={links}
        renderItem={link => {
          return (
            <List.Item>
              {`${(link.source !== node.id && link.source.id !== node.id) ? link.source.id : link.target.id} | ${link.tag}`}
            </List.Item>
          );
        }}
        pagination={{pageSize: 20, size: "small", showLessItems: true, simple: true}}
      />
    );
  }

  renderNodeMenu(selectedIds) {
    return (
      <List
        // style={{height: "200px"}}
        size="small"
        header={
          <div>
            节点数：{selectedIds.length}
          </div>
        }
        dataSource={selectedIds}
        renderItem={node => {
          return (
            <Tooltip placement="right" color={"rgb(255,255,255)"} title={this.renderSubMenu(node)}>
              <List.Item style={{backgroundColor: (this.state.selectedId === node.id) ? "rgb(249,198,205)" : ""}}>
                {`${node.id} | ${node.weight}`}
              </List.Item>
            </Tooltip>
          );
        }}
        pagination={{pageSize: 20, size: "small", showLessItems: true, simple: true}}
      />
    );
  }

  renderLeftToolbar() {
    if (this.state.graph === null) {
      return;
    }

    let selectedIds = this.state.graph.nodes;
    let categoryName = "全部";
    if (this.state.selectedIds.length !== 0) {
      selectedIds = this.state.selectedIds;
      categoryName = this.state.selectedIds[0].tag;
    }

    selectedIds = selectedIds.sort((a, b) => {return b.weight - a.weight;});

    return (
      <div style={{width: "100%", position: "fixed", zIndex: 2, pointerEvents: "none"}}>
        <div style={{width: "200px", marginLeft: "20px", marginTop: "20px", pointerEvents: "auto"}}>
          <Card style={{marginTop: "20px"}} size="small" title={
            <div>
              分类：{categoryName}
            </div>
          } type="inner">
            {
              this.renderNodeMenu(selectedIds)
            }
          </Card>
        </div>
      </div>
    );
  }

  renderRightToolbar() {
    return (
      <div style={{width: "100%", position: "fixed", zIndex: 2, pointerEvents: "none"}}>
        <div style={{width: "200px", float: "right", marginRight: "20px", marginTop: "20px", pointerEvents: "auto"}}>
          <Card size="small" title={
            <div>
              图形选项
            </div>
          } type="inner">
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  保持静止：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <Switch checked={this.state.enableStatic} onChange={(checked, e) => {
                  this.setState({
                    enableStatic: checked,
                  });
                }} />
              </Col>
            </Row>
            {/* <Row>*/}
            {/*  <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>*/}
            {/*    显示曲线：*/}
            {/*  </Col>*/}
            {/*  <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>*/}
            {/*    <Switch checked={this.state.enableCurve} onChange={(checked, e) => {*/}
            {/*      this.setState({*/}
            {/*        enableCurve: checked,*/}
            {/*      });*/}
            {/*    }} />*/}
            {/*  </Col>*/}
            {/* </Row>*/}
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  启用粗线：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <Switch checked={this.state.enableBolderLink} onChange={(checked, e) => {
                  this.setState({
                    enableBolderLink: checked,
                  });
                }} />
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  启用3D：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <Switch checked={this.state.enable3D} onChange={(checked, e) => {
                  this.setState({
                    enable3D: checked,
                  });
                }} />
              </Col>
            </Row>
            {/* <Row>*/}
            {/*  <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>*/}
            {/*    粒子数量：*/}
            {/*  </Col>*/}
            {/*  <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>*/}
            {/*    <Slider value={this.state.particlePercent} dots={true} min={0} max={100} onChange={(value => {*/}
            {/*      this.setState({*/}
            {/*        particlePercent: value,*/}
            {/*      });*/}
            {/*    })} />*/}
            {/*  </Col>*/}
            {/* </Row>*/}
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  扩散度：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <Slider value={this.state.strength} dots={true} min={0} max={1000} onChange={(value => {
                  this.setState({
                    strength: value,
                  });

                  // https://github.com/vasturiano/react-force-graph/issues/25
                  fg.current.d3Force("charge").strength(-value);
                })} />
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  最大距离：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <Slider value={this.state.distanceMax} dots={true} min={0} max={1000} onChange={(value => {
                  this.setState({
                    distanceMax: value,
                  });

                  // https://github.com/vasturiano/react-force-graph/issues/25
                  fg.current.d3Force("charge").distanceMax(value);
                })} />
              </Col>
            </Row>
          </Card>
          <Card style={{marginTop: "20px"}} size="small" title={
            <div>
              聚类选项
            </div>
          } type="inner">
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={8}>
                <span style={{verticalAlign: "middle"}}>
                  算法：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={16}>
                <Select virtual={false} style={{width: "100%"}} value={"K-Means"} onChange={(value => {
                  this.setState({
                    algorithm: value,
                  });
                })}>
                  {
                    [
                      {id: "K-Means", name: "K-Means"},
                    ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                  }
                </Select>
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  聚类个数：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <InputNumber style={{width: "100%"}} min={2} max={this.state.graph?.nodes.length} step={1} value={this.state.clusterNumber} onChange={value => {
                  this.setState({
                    clusterNumber: value,
                  });
                }} />
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <span style={{verticalAlign: "middle"}}>
                  距离上限：
                </span>
              </Col>
              <Col style={{marginTop: "5px", textAlign: "center"}} span={12}>
                <InputNumber style={{width: "100%"}} min={1} max={100} step={1} value={this.state.distanceLimit} onChange={value => {
                  this.setState({
                    distanceLimit: value,
                  });
                }} />
              </Col>
            </Row>
            <Row style={{textAlign: "center", paddingTop: "10px"}}>
              <Button style={{margin: "auto"}} type="primary" onClick={() => {
                this.setState({
                  graph: null,
                });
                this.getWordsetGraph();
              }}>
                重新聚类
              </Button>
              <Button style={{margin: "auto", marginTop: "10px"}} onClick={() => {
                this.downloadClusters();
              }}>
                下载结果
              </Button>
            </Row>
          </Card>
        </div>
      </div>
    );
  }

  getNodeId(node) {
    return node.id;
  }

  isLinkSelected(link) {
    return false;
  }

  renderGraph() {
    if (this.state.loading) {
      return (
        <div className="App">
          <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
        </div>
      );
    }

    if (this.state.graph === null || this.state.graph.nodes === null || this.state.graph.links === null) {
      return (
        <div className="App">
          <Empty style={{paddingTop: "10%"}} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }

    // highlight example
    // https://github.com/vasturiano/react-force-graph/blob/master/example/highlight/index.html
    return (
      <ForceGraph
        enable3D={this.state.enable3D}
        width={window.innerWidth}
        height={window.innerHeight - 147}
        graphData={this.state.graph}
        // nodeCanvasObjectMode={() => 'after'}
        linkWidth={link => {
          let width = this.state.enableBolderLink ? link.value : Math.sqrt(link.value);
          if (this.isLinkSelected(link)) {
            width = width + 6;
          }
          return width;
        }}
        linkDirectionalParticleWidth={link => {
          let width = 5;
          if (this.isLinkSelected(link)) {
            width = width + 3;
          }
          return width;
        }}
        linkColor={link => this.isLinkSelected(link) ? "red" : link.color}
        // linkCurvature={this.state.enableCurve ? 0.02 : 0}
        // linkDirectionalParticles={link => this.state.particlePercent * link.value / 100}
        linkDirectionalParticleSpeed={link => link.value * 0.001}
        cooldownTicks={this.state.enableStatic ? 0 : Infinity}
        onNodeClick={(node, event) => {
          if (this.state.selectedId !== this.getNodeId(node)) {
            this.setState({
              selectedType: "节点",
              selectedId: this.getNodeId(node),
              selectedIds: this.state.graph.nodes.filter(n => (n.tag === node.tag)),
            });
          } else {
            this.setState({
              selectedType: null,
              selectedId: null,
              selectedIds: [],
            });
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // const fontSize = 12 / globalScale;
          // ctx.font = `${fontSize}px Sans-Serif`;
          // const textWidth = ctx.measureText(label).width;

          // ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          ctx.save();

          if (this.state.selectedId === node.id) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 1.7, 0, 2 * Math.PI, false);
            ctx.fillStyle = "red";
            ctx.fill();
          } else if (this.state.selectedIds.filter(n => n.id === node.id).length > 0) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 1.4, 0, 2 * Math.PI, false);
            ctx.fillStyle = "red";
            ctx.fill();
          } else if (this.state.selectedId !== null) {
            ctx.globalAlpha = 0.3;
          }

          ctx.beginPath();
          ctx.fillStyle = node.color;
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.strokeStyle = "rgb(255,255,255)";
          ctx.stroke();

          ctx.font = "5px Lucida Console";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black"; // node.color;

          ctx.fillText(node.name, node.x, node.y + 10);

          ctx.restore();
        }}
      />
    );
  }

  render() {
    return (
      <div>
        {
          this.renderLeftToolbar()
        }
        {
          this.renderRightToolbar()
        }
        {
          this.renderGraph()
        }
      </div>
    );
  }
}

export default WordsetGraph;

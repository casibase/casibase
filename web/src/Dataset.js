import React from "react";
import {Card, Col, Empty, Row, Slider, Spin, Switch} from "antd";
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as d3 from "d3-force";
import * as DatasetBackend from "./backend/DatasetBackend";
import i18next from "i18next";

let fg = React.createRef();

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
      )
    } else {
      return (
        <ForceGraph3D ref={fg} {...this.props} />
      )
    }
  }
}

class Dataset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      datasetName: props.datasetName !== undefined ? props.datasetName : props.match.params.datasetName,
      graph: null,
      enableStatic: false,
      // enableCurve: true,
      enableBolderLink: false,
      enable3D: false,
      // particlePercent: 100,
      strength: 20,
      distanceMax: 100,
      selectedType: null,
      selectedId: null,
    }
  }

  componentWillMount() {
    this.getDatasetGraph();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    fg.current.d3Force('collision', d3.forceCollide(15));
  }

  getDatasetGraph() {
    DatasetBackend.getDatasetGraph("admin", this.state.datasetName)
      .then((graph) => {
        this.setState({
          graph: graph,
        });
      });
  }

  renderLeftToolbar() {
    return null;
  }

  renderRightToolbar() {
    return (
      <div style={{width: "100%", position: "fixed", zIndex: 2, pointerEvents: "none"}}>
        <div style={{width: "200px", float: "right", marginRight: '20px', marginTop: '20px', pointerEvents: "auto"}}>
          <Card size="small" title={
            <div>
              图形选项
            </div>
          } type="inner">
            <Row>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                保持静止：
              </Col>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                <Switch checked={this.state.enableStatic} onChange={(checked, e) => {
                  this.setState({
                    enableStatic: checked,
                  });
                }} />
              </Col>
            </Row>
            {/*<Row>*/}
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
            {/*</Row>*/}
            <Row>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                启用粗线：
              </Col>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                <Switch checked={this.state.enableBolderLink} onChange={(checked, e) => {
                  this.setState({
                    enableBolderLink: checked,
                  });
                }} />
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                启用3D：
              </Col>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                <Switch checked={this.state.enable3D} onChange={(checked, e) => {
                  this.setState({
                    enable3D: checked,
                  });
                }} />
              </Col>
            </Row>
            {/*<Row>*/}
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
            {/*</Row>*/}
            <Row>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                扩散度：
              </Col>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                <Slider value={this.state.strength} dots={true} min={0} max={1000} onChange={(value => {
                  this.setState({
                    strength: value,
                  });

                  // https://github.com/vasturiano/react-force-graph/issues/25
                  fg.current.d3Force('charge').strength(-value);
                })} />
              </Col>
            </Row>
            <Row>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                最大距离：
              </Col>
              <Col style={{marginTop: '5px', textAlign: 'center'}} span={12}>
                <Slider value={this.state.distanceMax} dots={true} min={0} max={1000} onChange={(value => {
                  this.setState({
                    distanceMax: value,
                  });

                  // https://github.com/vasturiano/react-force-graph/issues/25
                  fg.current.d3Force('charge').distanceMax(value);
                })} />
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    )
  }

  isLinkSelected(link) {
    return false;
  }

  renderGraph() {
    if (this.state.graph === null) {
      return (
        // https://codesandbox.io/s/antd-reproduction-template-q2dwk
        <div className="App">
          <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
        </div>
      )
    }

    if (this.state.graph.nodes === null || this.state.graph.links === null) {
      return (
        <div className="App">
          <Empty style={{paddingTop: "10%"}} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
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
        nodeCanvasObject={(node, ctx, globalScale) => {
          let label = node.id;
          // const fontSize = 12 / globalScale;
          // ctx.font = `${fontSize}px Sans-Serif`;
          // const textWidth = ctx.measureText(label).width;

          // ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          // if (this.isNodeSelected(node)) {
          //   ctx.beginPath();
          //   ctx.arc(node.x, node.y, node.val * 1.4, 0, 2 * Math.PI, false);
          //   ctx.fillStyle = 'red';
          //   ctx.fill();
          // }

          ctx.beginPath();
          ctx.fillStyle = node.color;
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.strokeStyle = 'rgb(255,255,255)';
          ctx.stroke();

          ctx.font = '5px Lucida Console';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'black'; //node.color;

          ctx.fillText(node.name, node.x, node.y + 10);
        }}
      />
    )
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

export default Dataset;

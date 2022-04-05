import React from "react";
import {Col, Row} from "antd";
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import * as DatasetBackend from "./backend/DatasetBackend";
import Dataset from "./Dataset";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      dataset: null,
    };
  }

  componentWillMount() {
    this.getDataset();
  }

  getDataset() {
    DatasetBackend.getDataset(Conf.DefaultOwner, Conf.DefaultDatasetName)
      .then((dataset) => {
        this.setState({
          dataset: dataset,
        });
      });
  }

  render() {
    return (
      <div>
        <Row style={{width: "100%"}}>
          <Col span={!Setting.isMobile() ? 3 : 0}>
          </Col>
          <Col span={!Setting.isMobile() ? 18 : 24}>
            {
              (this.state.dataset === undefined || this.state.dataset === null) ? null : (
                <Dataset dataset={this.state.dataset} datasetName={this.state.dataset.name} />
              )
            }
          </Col>
          <Col span={!Setting.isMobile() ? 3 : 0}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default HomePage;

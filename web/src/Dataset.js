import React from "react";
import * as DatasetBackend from "./backend/DatasetBackend";

class Dataset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      datasetName: props.datasetName !== undefined ? props.datasetName : props.match.params.datasetName,
      graph: null,
    }
  }

  componentWillMount() {
    this.getDatasetGraph();
  }

  getDatasetGraph() {
    DatasetBackend.getDatasetGraph("admin", this.state.datasetName)
      .then((graph) => {
        this.setState({
          graph: graph,
        });
      });
  }

  render()
  {
    return JSON.stringify(this.state.graph);
  }
}

export default Dataset;

import React from "react";
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
    return (this.state.dataset === undefined || this.state.dataset === null) ? null : (
      <Dataset dataset={this.state.dataset} datasetName={this.state.dataset.name}/>
    )
  }
}

export default HomePage;

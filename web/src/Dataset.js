import React from "react";

class Dataset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    }
  }

  render()
  {
    const dataset = this.props.dataset;

    return 111;
  }
}

export default Dataset;

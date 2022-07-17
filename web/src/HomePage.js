import React from "react";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordset: null,
    };
  }

  render() {
    return "Home";
  }
}

export default HomePage;

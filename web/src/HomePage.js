import React from "react";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    return (
      <div>
        hello
      </div>
    )
  }
}

export default HomePage;

import React from "react";
import FileTreePage from "./FileTreePage";
import {Redirect} from "react-router-dom";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    if (this.props.account.tag === "Video") {
      return <Redirect to="/videos" />;
    } else {
      return <FileTreePage account={this.props.account} />;
    }
  }
}

export default HomePage;

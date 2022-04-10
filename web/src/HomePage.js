import React from "react";
import * as Conf from "./Conf";
import * as WordsetBackend from "./backend/WordsetBackend";
import Wordset from "./Wordset";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordset: null,
    };
  }

  componentWillMount() {
    this.getWordset();
  }

  getWordset() {
    WordsetBackend.getWordset(Conf.DefaultOwner, Conf.DefaultWordsetName)
      .then((wordset) => {
        this.setState({
          wordset: wordset,
        });
      });
  }

  render() {
    return (this.state.wordset === undefined || this.state.wordset === null) ? null : (
      <Wordset wordset={this.state.wordset} wordsetName={this.state.wordset.name}/>
    )
  }
}

export default HomePage;

import React from "react";
import * as WordsetBackend from "./backend/WordsetBackend";
import Wordset from "./Wordset";

class WordsetGraphPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsetName: props.match.params.wordsetName,
      wordset: null,
    };
  }

  componentWillMount() {
    this.getWordset();
  }

  getWordset() {
    WordsetBackend.getWordset(this.props.account.name, this.state.wordsetName)
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

export default WordsetGraphPage;

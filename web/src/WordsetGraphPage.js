import React from "react";
import * as WordsetBackend from "./backend/WordsetBackend";
import WordsetGraph from "./WordsetGraph";
import * as Setting from "./Setting";

class WordsetGraphPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsetName: props.match.params.wordsetName,
      wordset: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getWordset();
  }

  getWordset() {
    WordsetBackend.getWordset(this.props.account.name, this.state.wordsetName)
      .then((wordset) => {
        if (wordset.status === "ok") {
          this.setState({
            wordset: wordset.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get wordset: ${wordset.msg}`);
        }
      });
  }

  render() {
    return (this.state.wordset === undefined || this.state.wordset === null) ? null : (
      <WordsetGraph wordset={this.state.wordset} wordsetName={this.state.wordset.name} />
    );
  }
}

export default WordsetGraphPage;

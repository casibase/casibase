import React from "react";
import {Spin} from "antd";
import * as StoreBackend from "./backend/StoreBackend";
import FileTree from "./FileTree";
import i18next from "i18next";

class FileTreePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      storeName: props.match.params.storeName,
      store: null,
    };
  }

  componentWillMount() {
    this.getStore();
  }

  getStore() {
    StoreBackend.getStore(this.props.account.name, this.state.storeName)
      .then((store) => {
        this.setState({
          store: store,
        });
      });
  }

  render() {
    if (this.state.store === null) {
      return (
        <div className="App">
          <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
        </div>
      );
    }

    return (
      <FileTree account={this.props.account} store={this.state.store} />
    );
  }
}

export default FileTreePage;

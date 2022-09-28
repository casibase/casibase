import React from "react";
import {Spin} from "antd";
import i18next from "i18next";
import FileTree from "./FileTree";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      store: null,
    };
  }

  componentWillMount() {
    this.getStore();
  }

  getStore() {
    StoreBackend.getStore("admin", "default")
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
      <FileTree account={this.props.account} store={this.state.store} onUpdateStore={(store) => {
        this.setState({
          store: store,
        });
        Setting.submitStoreEdit(store);
      }} onRefresh={() => this.getStore()} />
    );
  }
}

export default HomePage;

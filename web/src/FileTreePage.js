import React from "react";
import {Spin} from "antd";
import * as StoreBackend from "./backend/StoreBackend";
import FileTree from "./FileTree";
import i18next from "i18next";
import * as Setting from "./Setting";

class FileTreePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match?.params?.owner !== undefined ? props.match.params.owner : "admin",
      storeName: props.match?.params?.storeName !== undefined ? props.match.params.storeName : "default",
      store: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getStore();
  }

  getStore() {
    StoreBackend.getStore(this.state.owner, this.state.storeName)
      .then((res) => {
        if (res?.status !== "error") {
          this.setState({
            store: res.data,
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
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

export default FileTreePage;

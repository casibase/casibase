import React from "react";
import FileTreePage from "./FileTreePage";
import {Redirect} from "react-router-dom";
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

  UNSAFE_componentWillMount() {
    this.getStores();
  }

  getStores() {
    StoreBackend.getGlobalStores()
      .then((res) => {
        if (res.status === "ok") {
          const stores = res.data;
          const store = stores.filter(store => store.domain !== "https://cdn.example.com")[0];
          if (store !== undefined) {
            this.setState({
              store: store,
            });
          }
        } else {
          Setting.showMessage("error", `Failed to get stores: ${res.msg}`);
        }
      });
  }

  render() {
    if (this.props.account.tag === "Video") {
      return <Redirect to="/videos" />;
    } else {
      if (this.state.store === null) {
        return null;
      } else {
        return <FileTreePage account={this.props.account} storeName={this.state.store.name} />;
      }
    }
  }
}

export default HomePage;

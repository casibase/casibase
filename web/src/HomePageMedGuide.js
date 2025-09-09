
import React from "react";
import FileTreePage from "./FileTreePage";
import { Redirect } from "react-router-dom";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import ChatPage from "./ChatPage";
import UsagePage from "./UsagePage";
import MedGuideCardGrid from "./MedGuideCardGrid";
import i18next from "i18next";
import { calc } from "antd/es/theme/internal";

class HomePageMedGuide extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      store: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getStore();
  }

  getStore() {
    StoreBackend.getStore("admin", "_casibase_default_store_")
      .then((res) => {
        if (res.status === "ok") {
          if (res.data && typeof res.data2 === "string" && res.data2 !== "") {
            res.data.error = res.data2;
          }

          this.setState({
            store: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  render() {
    // 动态问候语
    const hour = new Date().getHours();
    let greeting = "";
    if (hour >= 5 && hour < 12) {
      greeting = "早上好";
    } else if (hour >= 12 && hour < 18) {
      greeting = "下午好";
    } else {
      greeting = "晚上好";
    }


    if (Setting.isAnonymousUser(this.props.account) || Setting.isChatUser(this.props.account) || Setting.getUrlParam("isRaw") !== null) {
      if (!this.props.account) {
        return null;
      }

      return (
        <ChatPage account={this.props.account} />
      );
    }

    if (this.props.account?.tag === "Video") {
      return <Redirect to="/videos" />;
    } else {
      if (this.state.store === null) {
        return null;
      } else {
        // if (this.props.account.name === "admin" || this.props.account.type === "chat-admin") {
        //   return <UsagePage account={this.props.account} />;
        // }

        return (
          // 背景：https://awp-assets.meituan.net/xm/dx-static-page/src/images/downloadPage/download-bg-new.png
          <div style={{ backgroundImage: "url(https://awp-assets.meituan.net/xm/dx-static-page/src/images/downloadPage/download-bg-new.png)", backgroundSize: "cover", padding: 20, minHeight: "calc(100vh - 64px)", borderRadius: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>

              <div style={{ fontSize: 48, fontWeight: 700, marginTop: 20 }}>卫生健康数据可信共享链平台</div>
              <div style={{ fontSize: 24, fontWeight: 400, marginTop: 15, color: "#8c8c8c" }}> 请点击卡片进入各子功能  </div>
            </div>
            {/* 卡片区域 */}
            <MedGuideCardGrid account={this.props.account} />
          </div>
        );
      }
    }
  }
}

export default HomePageMedGuide;

import React from "react";
import {App, Button, Card, Divider, Input, message} from "antd";
import {Typography} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as VectorBackend from "./backend/VectorBackend";

const {TextArea} = Input;
const {Text} = Typography;

class ProviderEmbeddingTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "Hello, Casibase!",
      vector: null,
      loading: false,
      debug: "",
    };
  }

  calculateVector() {
    const account = Setting.getItem("account");
    if (!account) {
      message.error("Failed to get current user, please login again.");
      return;
    }

    this.setState({
      loading: true,
      vector: null,
      debug: "Calculating vector using the provider...",
    });

    const vectorName = `test-vector-${Setting.getRandomName()}`;
    const owner = this.props.provider.owner;

    const placeholderVector = {
      owner: owner,
      name: vectorName,
      createdTime: Setting.getFormattedDate(),
      displayName: `Test Placeholder: ${this.state.text.slice(0, 50)}`,
      store: "",
      provider: this.props.provider.name,
      file: "",
      text: "",
      data: [],
      dimension: 0,
      tokenCount: 0,
    };

    const finalVector = {
      ...placeholderVector,
      displayName: `Test: ${this.state.text.slice(0, 50)}`,
      text: this.state.text,
    };

    VectorBackend.addVector(placeholderVector)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({debug: "Placeholder vector created, now triggering vectorization..."});
          return VectorBackend.updateVector(owner, vectorName, finalVector);
        } else {
          throw new Error(res.msg || "Failed to add placeholder vector");
        }
      })
      .then((updateRes) => {
        if (updateRes.status === "ok") {
          this.setState({debug: "Vectorization request sent, fetching results..."});
          return new Promise(resolve => setTimeout(resolve, 1500))
            .then(() => VectorBackend.getVector(owner, vectorName));
        } else {
          throw new Error(updateRes.msg || "Failed to update vector to trigger calculation");
        }
      })
      .then((getRes) => {
        if (getRes.status === "ok" && getRes.data) {
          const vectorData = getRes.data;
          if (Array.isArray(vectorData.data) && vectorData.data.length > 0) {
            message.success(i18next.t("general:Successfully calculated vector"));
            if (vectorData.dimension === 0 && vectorData.data.length > 0) {
              vectorData.dimension = vectorData.data.length;
            }
            this.setState({
              vector: vectorData,
              debug: "Vector calculation successful!",
            });
          } else {
            throw new Error("Vectorization failed: The returned vector data is empty. Please check your Provider configuration.");
          }
        } else {
          throw new Error(getRes.msg || "Failed to get vectorization result");
        }
      })
      .catch((error) => {
        this.setState({
          vector: null,
          debug: `Error: ${error.message}\n\nPossible reasons:\n1. Incorrect Provider configuration (API key, endpoint, etc.)\n2. Network connectivity issues`,
        });
        message.error(`${i18next.t("general:Failed to calculate vector")}: ${error.message}`);
      })
      .finally(() => {
        this.setState({loading: false});
        setTimeout(() => {
          VectorBackend.deleteVector({owner: owner, name: vectorName})
            .catch(() => {});
        }, 30000);
      });
  }

  renderResult() {
    const {vector, debug, loading} = this.state;
    if (!vector && !debug && !loading) {
      return null;
    }
    return (
      <div style={{marginTop: "20px"}}>
        <Divider orientation="left">{i18next.t("vector:Test Result")}</Divider>
        {vector && (
          <>
            <div style={{
              padding: "10px",
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "4px",
              marginBottom: "10px",
            }}>
              <Text strong>✓ Vectorization Successful</Text><br />
              <Text strong>Dimension:</Text> {vector.dimension} &nbsp;&nbsp;
              <Text strong>Provider:</Text> {vector.provider} &nbsp;&nbsp;
              {vector.tokenCount > 0 && <><br /><Text strong>Token Count:</Text> {vector.tokenCount}</>}
            </div>
            <div style={{marginBottom: "10px"}}>
              <Text strong>Vector Data Preview (first 10 values):</Text>
            </div>
            <pre style={{
              maxHeight: "150px", overflow: "auto", padding: "10px", backgroundColor: "#f5f5f5",
              border: "1px solid #d9d9d9", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace",
            }}>
              [{vector.data.slice(0, 10).map(v => v.toFixed(6)).join(",\n ")}
              {vector.data.length > 10 ? `,\n ... (total ${vector.data.length} values)` : ""}]
            </pre>
          </>
        )}
        {debug && (
          <pre style={{
            marginTop: "15px", padding: "10px", backgroundColor: vector ? "#f6ffed" : "#fff1f0",
            border: `1px solid ${vector ? "#b7eb8f" : "#ffa39e"}`, borderRadius: "4px", fontSize: "12px",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {debug}
          </pre>
        )}
      </div>
    );
  }

  render() {
    if (!this.props.provider || this.props.provider.category !== "Embedding") {
      return null;
    }

    return (
      <App>
        <Card
          size="small"
          title={
            <span>
              <i className="fas fa-vial" style={{marginRight: "8px"}} />
              {i18next.t("provider:Test Embedding")}
            </span>
          }
          style={{marginTop: "20px"}}
          type="inner"
        >
          <Typography.Title level={5}>Test Text</Typography.Title>
          <TextArea
            value={this.state.text}
            onChange={e => this.setState({text: e.target.value})}
            placeholder={i18next.t("provider:Enter text to test embedding") || "Please enter the text to test..."}
            autoSize={{minRows: 3, maxRows: 6}}
            style={{marginBottom: "10px"}}
            showCount
            maxLength={2000}
          />
          <Button
            type="primary"
            loading={this.state.loading}
            onClick={() => this.calculateVector()}
            disabled={!this.state.text.trim() || this.state.text.length < 5 || this.state.loading}
            icon={<i className="fas fa-calculator" style={{marginRight: "5px"}} />}
          >
            {this.state.loading ? "Calculating..." : i18next.t("provider:Calculate Vector")}
          </Button>
          {this.state.text.trim() && this.state.text.length < 5 && (
            <Text type="secondary" style={{marginLeft: "10px", fontSize: "12px"}}>
              Text is too short, please enter at least 5 characters.
            </Text>
          )}
          {this.renderResult()}
        </Card>
      </App>
    );
  }
}

export default ProviderEmbeddingTest;

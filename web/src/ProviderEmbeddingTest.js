import React from "react";
import {App, Button, Card, Divider, Input, message} from "antd";
import {Typography} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as VectorBackend from "./backend/VectorBackend";

const {TextArea} = Input;
const {Text, Paragraph} = Typography;

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
      debug: "正在使用Provider计算向量...",
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
          this.setState({debug: "占位向量创建成功，正在触发向量化..."});
          return VectorBackend.updateVector(owner, vectorName, finalVector);
        } else {
          throw new Error(res.msg || "添加占位向量失败");
        }
      })
      .then((updateRes) => {
        if (updateRes.status === "ok") {
          this.setState({debug: "向量化请求已发送，正在获取计算结果..."});
          return new Promise(resolve => setTimeout(resolve, 1500))
            .then(() => VectorBackend.getVector(owner, vectorName));
        } else {
          throw new Error(updateRes.msg || "更新向量以触发计算时失败");
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
              debug: "向量计算成功！",
            });
          } else {
            throw new Error("向量化失败：返回的向量数据为空。请检查Provider配置。");
          }
        } else {
          throw new Error(getRes.msg || "获取向量化结果失败");
        }
      })
      .catch((error) => {
        this.setState({
          vector: null,
          debug: `错误: ${error.message}\n\n可能的原因：\n1. Provider配置不正确\n2. 网络连接问题`,
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

  renderProviderInfo() {
    const {provider} = this.props;
    const supportedTypes = [
      "OpenAI", "Azure", "Cohere", "Ernie", "HuggingFace", "Gemini",
      "Baidu Cloud", "Ollama", "Local", "MiniMax", "Alibaba Cloud", "Tencent Cloud", "Jina",
    ];
    const isSupported = supportedTypes.includes(provider.type);

    return (
      <div style={{marginBottom: "15px"}}>
        <Typography.Title level={5}>Provider配置信息</Typography.Title>
        <div style={{
          padding: "10px",
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
          border: isSupported ? "1px solid #d9d9d9" : "1px solid #ffccc7",
        }}>
          <Paragraph>
            <Text strong>名称:</Text> {provider.name}<br />
            <Text strong>类型:</Text> <Text type={isSupported ? "success" : "danger"}>
              {provider.type} {isSupported ? "✓" : "✗"}
            </Text><br />
            <Text strong>子类型/模型:</Text> {provider.subType || "未设置"}<br />
            {provider.type === "Ernie" ? (
              <>
                <Text strong>Client ID:</Text> {provider.clientId ? "已设置 ✓" : "未设置 ✗"}<br />
                <Text strong>Client Secret:</Text> {provider.clientSecret ? "已设置 ✓" : "未设置 ✗"}<br />
              </>
            ) : (
              <>
                <Text strong>API密钥:</Text> {provider.apiKey ? "已设置 ✓" : "未设置 ✗"}<br />
              </>
            )}
            {["Azure", "HuggingFace", "Ollama", "Local"].includes(provider.type) && (
              <><Text strong>端点:</Text> {provider.endpoint || (provider.type === "HuggingFace" ? "未设置 ✗" : "默认")}<br /></>
            )}
          </Paragraph>
          {!isSupported && (
            <Paragraph type="danger">
              ❌ 错误: Provider类型 &quot;{provider.type}&quot; 不支持Embedding功能
            </Paragraph>
          )}
        </div>
      </div>
    );
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
              <Text strong>✓ 向量化成功</Text><br />
              <Text strong>维度:</Text> {vector.dimension} &nbsp;&nbsp;
              <Text strong>Provider:</Text> {vector.provider} &nbsp;&nbsp;
              {vector.tokenCount > 0 && <><br /><Text strong>Token数:</Text> {vector.tokenCount}</>}
            </div>
            <div style={{marginBottom: "10px"}}>
              <Text strong>向量数据预览（前10个值）:</Text>
            </div>
            <pre style={{
              maxHeight: "150px", overflow: "auto", padding: "10px", backgroundColor: "#f5f5f5",
              border: "1px solid #d9d9d9", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace",
            }}>
              [{vector.data.slice(0, 10).map(v => v.toFixed(6)).join(",\n ")}
              {vector.data.length > 10 ? `,\n ... (共 ${vector.data.length} 个值)` : ""}]
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
    if (this.props.provider.category !== "Embedding") {
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
          {this.renderProviderInfo()}
          <Divider />
          <Typography.Title level={5}>测试文本</Typography.Title>
          <TextArea
            value={this.state.text}
            onChange={e => this.setState({text: e.target.value})}
            placeholder={i18next.t("provider:Enter text to test embedding") || "请输入要测试的文本..."}
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
            {this.state.loading ? "正在计算..." : i18next.t("provider:Calculate Vector")}
          </Button>
          {this.state.text.trim() && this.state.text.length < 5 && (
            <Text type="secondary" style={{marginLeft: "10px", fontSize: "12px"}}>
              文本太短，请至少输入5个字符
            </Text>
          )}
          {this.renderResult()}
        </Card>
      </App>
    );
  }
}

export default ProviderEmbeddingTest;

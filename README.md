<h1 align="center" style="border-bottom: none;">📦⚡️ Casibase</h1>
<h3 align="center">Open-source AI LangChain-like RAG (Retrieval-Augmented Generation) knowledge database with web UI and Enterprise SSO, supports OpenAI, Azure, LLaMA, Google Gemini, HuggingFace, Claude, Grok, etc.,</h3>
<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://hub.docker.com/r/casbin/casibase">
    <img alt="docker pull casbin/casibase" src="https://img.shields.io/docker/pulls/casbin/casibase.svg">
  </a>
  <a href="https://github.com/casibase/casibase/actions/workflows/build.yml">
    <img alt="GitHub Workflow Status (branch)" src="https://github.com/casibase/casibase/workflows/Build/badge.svg?style=flat-square">
  </a>
  <a href="https://github.com/casibase/casibase/releases/latest">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/casibase/casibase.svg">
  </a>
  <a href="https://hub.docker.com/r/casbin/casibase">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/badge/Docker%20Hub-latest-brightgreen">
  </a>
</p>

<p align="center">
  <a href="https://goreportcard.com/report/github.com/casibase/casibase">
    <img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/casibase/casibase?style=flat-square">
  </a>
  <a href="https://github.com/casibase/casibase/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/casibase/casibase?style=flat-square" alt="license">
  </a>
  <a href="https://github.com/casibase/casibase/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/casibase/casibase?style=flat-square">
  </a>
  <a href="#">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/casibase/casibase?style=flat-square">
  </a>
  <a href="https://github.com/casibase/casibase/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/casibase/casibase?style=flat-square">
  </a>
  <a href="https://crowdin.com/project/casibase">
    <img alt="Crowdin" src="https://badges.crowdin.net/casibase/localized.svg">
  </a>
  <a href="https://discord.gg/devUNrWXrh">
    <img alt="Discord" src="https://img.shields.io/discord/1022748306096537660?logo=discord&label=discord&color=5865F2">
  </a>
</p>

## Online Demo

### Read-only site (any modification operation will fail)

- Chat bot: https://ai.casibase.com
- Admin UI: https://ai-admin.casibase.com

### Writable site (original data will be restored for every 5 minutes)

- Chat bot: https://demo.casibase.com
- Admin UI: https://demo-admin.casibase.com

## Documentation

https://casibase.org

## Architecture

Casibase contains 2 parts:

| **Name**       | **Description**                                   | **Language**                            |
|----------------|---------------------------------------------------|-----------------------------------------|
| Frontend       | User interface for Casibase                       | JavaScript + React                      |
| Backend        | Server-side logic and API for Casibase            | Golang + Beego + Python + Flask + MySQL |

![0-Architecture-casibase](assets/0-Architecture-casibase.png)

## Supported Models

**Language Model**

| Model          | Sub Type                                                     | Link                                                         |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| OpenAI         | dall-e-3，gpt-3.5-turbo-0125， gpt-3.5-turbo， gpt-3.5-turbo-1106， gpt-3.5-turbo-instruct，gpt-3.5-turbo-16k-0613，gpt-3.5-turbo-16k，gpt-4-0125-preview，gpt-4-1106-preview，gpt-4-turbo-preview，gpt-4-vision-preview，gpt-4-1106-vision-preview，gpt-4， gpt-4-0613，gpt-4-32k，gpt-4-32k-0613， gpt-4o，gpt-4o-2024-05-13，gpt-4o-mini，gpt-4o-mini-2024-07-18 | [OpenAI](https://chat.openai.com/)                           |
| Gemini         | gemini-pro，gemini-pro-vision                                | [Gemini](https://gemini.google.com/)                         |
| Hugging Face   | meta-llama/Llama-2-7b，tiiuae/falcon-180B，bigscience/bloom，gpt2，baichuan-inc/Baichuan2-13B-Chat，THUDM/chatglm2-6b | [Hugging Face](https://huggingface.co/)                      |
| Claude         | claude-2.0，claude-2.1，claude-instant-1.2，claude-3-sonnet-20240229，claude-3-opus-20240229，claude-3-haiku-20240307 | [Claude](https://claude.ai/chats)                            |
| OpenRouter     | google/palm-2-codechat-bison, google/palm-2-chat-bison, openai/gpt-3.5-turbo, openai/gpt-3.5-turbo-16k, openai/gpt-4, openai/gpt-4-32k, anthropic/claude-2, anthropic/claude-instant-v1, meta-llama/llama-2-13b-chat, meta-llama/llama-2-70b-chat, palm-2-codechat-bison, palm-2-chat-bison, gpt-3.5-turbo, gpt-3.5-turbo-16k, gpt-4, gpt-4-32k, claude-2, claude-instant-v1, llama-2-13b-chat, llama-2-70b-chat | [OpenRouter](https://openrouter.ai/)                         |
| Ernie          | ERNIE-Bot, ERNIE-Bot-turbo, BLOOMZ-7B, Llama-2               | [Ernie](https://yiyan.baidu.com/)                            |
| Cohere         | command-light，command                                       | [Cohere](https://cohere.com/)                                |
| iFlytek        | spark-v1.5, spark-v2.0                                       | [iFlytek](https://xinghuo.xfyun.cn/)                         |
| ChatGLM        | glm-3-turbo，glm-4，glm-4V                                   | [ChatGLM](https://chatglm.cn/)                               |
| MiniMax        | abab5-chat                                                   | [MiniMax](https://api.minimax.chat/)                         |
| Local          | custom-model                                                 | [Local Computer](#)                                          |
| Azure          | dall-e-3，gpt-3.5-turbo-0125， gpt-3.5-turbo， gpt-3.5-turbo-1106， gpt-3.5-turbo-instruct，gpt-3.5-turbo-16k-0613，gpt-3.5-turbo-16k，gpt-4-0125-preview，gpt-4-1106-preview，gpt-4-turbo-preview，gpt-4-vision-preview，gpt-4-1106-vision-preview，gpt-4， gpt-4-0613，gpt-4-32k，gpt-4-32k-0613， gpt-4o，gpt-4o-2024-05-13，gpt-4o-mini，gpt-4o-mini-2024-07-18 | [Azure](https://azure.microsoft.com/zh-cn/products/ai-model-catalog) |
| Moonshot       | moonshot-v1-8k，moonshot-v1-32k，moonshot-v1-128k            | [Moonshot](https://www.moonshot.cn/)                         |
| Amazon Bedrock | claude，claude-instant，command，command-light，embed-english，embed-multilingual，jurassic-2-mid，jurassic-2-ultra，llama-2-chat-13b，llama-2-chat-70b，titan-text-lite，titan-text-express，titan-embeddings，titan-multimodal-embeddings | [Amazon Bedrock](https://aws.amazon.com/cn/bedrock/)         |
| Qwen           | qwen-long，qwen-turbo，qwen-plus，qwen-max，qwen-max-longcontext | [Qwen](https://www.aliyun.com/product/tongyi)                |
| Baichuan       | Baichuan2-Turbo，Baichuan3-Turbo，Baichuan4                  | [Baichuan](https://www.baichuan-ai.com/home)                 |
| Doubao         | Doubao-lite-4k，Doubao-lite-32k，Doubao-lite-128k，Doubao-pro-4k，Doubao-pro-32k，Doubao-pro-128k | [Doubao](https://team.doubao.com/zh/?view_from=homepage_tab) |
| DeepSeek       | deepseek-chat                                                | [DeepSeek](https://www.deepseek.com/)                        |
| StepFun        | step-1-8k，step-1-32k，step-1-128k，sstep-1-256k，step-1-flash，step-2-16k | [StepFun](https://www.stepfun.com/)                          |
| Hunyuan        | hunyuan-lite，hunyuan-standard，hunyuan-standard-256K，hunyuan-pro，hunyuan-code， hunyuan-role，hunyuan-turbo | [Hunyuan](https://hunyuan.tencent.com/)                      |
| Mistral        | mistral-large-latest，pixtral-large-latest，mistral-small-latest，codestral-latest，ministral-8b-latest，ministral-3b-latest，pixtral-12b，mistral-nemo，open-mistral-7b，open-mixtral-8x7b，open-mixtral-8x22b | [Mistral](https://mistral.ai/)                               |

**Embedding Model**

| Model        | Sub Type                                                     | Link                                                         |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| OpenAI       | text-embedding-ada-002，text-embedding-3-small，text-embedding-3-large | [OpenAI](https://chat.openai.com/)                           |
| Hugging Face | sentence-transformers/all-MiniLM-L6-v2                       | [Hugging Face](https://huggingface.co/)                      |
| Cohere       | embed-english-v2.0，embed-english-light-v2.0，embed-multilingual-v2.0，embed-english-v3.0 | [Cohere](https://cohere.com/)                                |
| Ernie        | default                                                      | [Ernie](https://yiyan.baidu.com/)                            |
| MiniMax      | embo-01                                                      | [MiniMax](https://api.minimax.chat/)                         |
| Local        | custom-embedding                                             | [Local Computer](#)                                          |
| Azure        | text-embedding-ada-002，text-embedding-3-small，text-embedding-3-large | [Azure](https://azure.microsoft.com/zh-cn/products/ai-model-catalog) |
| Qwen         | text-embedding-v1，text-embedding-v2，text-embedding-v3      | [Qwen](https://www.aliyun.com/product/tongyi)                |
| Hunyuan      | hunyuan-embedding                                            | [Hunyuan](https://hunyuan.tencent.com/)                      |
| Jina         | jina-embeddings-v2-base-zh，jina-embeddings-v2-base-en，jina-embeddings-v2-base-de，jina-embeddings-v2-base-code | [Jina](https://jina.ai/)                                     |

## Documentation

<https://casibase.org>

## Install

<https://casibase.org/docs/basic/server-installation>

## How to contact?

Discord: <https://discord.gg/5rPsrAzK7S>

## Contribute

For Casibase, if you have any questions, you can give issues, or you can also directly start Pull Requests(but we recommend giving issues first to communicate with the community).

## License

[Apache-2.0](https://github.com/casibase/casibase/blob/master/LICENSE)

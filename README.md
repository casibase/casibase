<h1 align="center" style="border-bottom: none;">📦⚡️ Casibase</h1>
<h3 align="center">Open-source AIGC vector & knowledge database with beautiful web UI, similar to LangChain</h3>
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
  <a href="https://hub.docker.com/repository/docker/casbin/casibase">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/badge/Docker%20Hub-latest-brightgreen">
  </a>
<!-- waiting for changing -->
<!-- <a href="https://hub.docker.com/r/casbin/casibase"> -->
<!-- <a href="https://github.com/casibase/casibase/actions/workflows/build.yml"> -->
<!-- <a href="https://github.com/casibase/casibase/releases/latest"> -->
<!-- <a href="https://hub.docker.com/repository/docker/casbin/casibase"> -->
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

- Read-only site: https://ai.v2tl.com (any modification operation will fail)
- Writable site: https://demo-ai.v2tl.com (original data will be restored for every 5 minutes)

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

| Model        | Sub Type                                                                                                                                                                                                                                                                                                                                                                                                         | Link                                    |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| OpenAI       | gpt-4-32k-0613，gpt-4-32k-0314，gpt-4-32k，gpt-4-0613，gpt-4-0314，gpt-4，gpt-3.5-turbo-0613，gpt-3.5-turbo-0301，gpt-3.5-turbo-16k，gpt-3.5-turbo-16k-0613，gpt-3.5-turbo，text-davinci-003，text-davinci-002，text-curie-001，text-babbage-001，text-ada-001，text-davinci-001，davinci-instruct-beta，davinci，curie-instruct-beta，curie，ada，babbage                                                                             | [OpenAI](https://chat.openai.com/)      |
| Hugging Face | meta-llama/Llama-2-7b, tiiuae/falcon-180B, bigscience/bloom, gpt2, baichuan-inc/Baichuan2-13B-Chat, THUDM/chatglm2-6b                                                                                                                                                                                                                                                                                            | [Hugging Face](https://huggingface.co/) |
| Claude       | claude-2, claude-v1, claude-v1-100k, claude-instant-v1, claude-instant-v1-100k, claude-v1.3, claude-v1.3-100k, claude-v1.2, claude-v1.0, claude-instant-v1.1, claude-instant-v1.1-100k, claude-instant-v1.0                                                                                                                                                                                                      | [Claude](https://claude.ai/chats)       |
| OpenRouter   | google/palm-2-codechat-bison, google/palm-2-chat-bison, openai/gpt-3.5-turbo, openai/gpt-3.5-turbo-16k, openai/gpt-4, openai/gpt-4-32k, anthropic/claude-2, anthropic/claude-instant-v1, meta-llama/llama-2-13b-chat, meta-llama/llama-2-70b-chat, palm-2-codechat-bison, palm-2-chat-bison, gpt-3.5-turbo, gpt-3.5-turbo-16k, gpt-4, gpt-4-32k, claude-2, claude-instant-v1, llama-2-13b-chat, llama-2-70b-chat | [OpenRouter](https://openrouter.ai/)    |
| Ernie        | ERNIE-Bot, ERNIE-Bot-turbo, BLOOMZ-7B, Llama-2                                                                                                                                                                                                                                                                                                                                                                   | [Ernie](https://yiyan.baidu.com/)       |
| iFlytek      | spark-v1.5, spark-v2.0                                                                                                                                                                                                                                                                                                                                                                                           | [iFlytek](https://xinghuo.xfyun.cn/)    |
| ChatGLM      | chatglm2-6b                                                                                                                                                                                                                                                                                                                                                                                                      | [ChatGLM](https://chatglm.cn/)          |
| MiniMax      | abab5-chat                                                                                                                                                                                                                                                                                                                                                                                                       | [MiniMax](https://api.minimax.chat/)    |
| Local        | custom-model                                                                                                                                                                                                                                                                                                                                                                                                     | [Local Computer](#)                     |

**Embedding Model**

| Model        | Sub Type                                                                                                                                                                                                                                                                                                                                 | Link                                    |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| OpenAI       | AdaSimilarity, BabbageSimilarity, CurieSimilarity, DavinciSimilarity, AdaSearchDocument, AdaSearchQuery, BabbageSearchDocument, BabbageSearchQuery, CurieSearchDocument, CurieSearchQuery, DavinciSearchDocument, DavinciSearchQuery, AdaCodeSearchCode, AdaCodeSearchText, BabbageCodeSearchCode, BabbageCodeSearchText, AdaEmbeddingV2 | [OpenAI](https://chat.openai.com/)      |
| Hugging Face | sentence-transformers/all-MiniLM-L6-v2                                                                                                                                                                                                                                                                                                   | [Hugging Face](https://huggingface.co/) |
| Cohere       | embed-english-v2.0, embed-english-light-v2.0, embed-multilingual-v2.0                                                                                                                                                                                                                                                                    | [Cohere](https://cohere.com/)           |
| Ernie        | default                                                                                                                                                                                                                                                                                                                                  | [Ernie](https://yiyan.baidu.com/)       |
| Local        | custom-embedding                                                                                                                                                                                                                                                                                                                         | [Local Computer](#)                     |

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

// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {StaticBaseUrl} from "./Conf";

export const TourObj = {
  home: [
    {
      title: "Welcome to Casibase",
      description: "You can learn more about the use of Casibase at https://casibase.org/.",
      cover: (
        <img
          alt="casibase.png"
          src={`${StaticBaseUrl}/img/casibase-logo_1185x256.png`}
        />
      ),
    },
  ],
  stores: [
    {
      title: "Store List",
      description: "Stores are knowledge bases in Casibase. Each store contains documents, vectors, and chat conversations. You can configure different AI providers for each store.",
    },
  ],
  providers: [
    {
      title: "Provider List",
      description: "Providers are external services that Casibase uses for storage, AI models, embeddings, text-to-speech, speech-to-text, and more. Configure providers to enable different features in your stores.",
    },
  ],
  vectors: [
    {
      title: "Vector List",
      description: "Vectors are embeddings generated from your documents. They enable semantic search and AI-powered question answering in your knowledge base.",
    },
  ],
  chats: [
    {
      title: "Chat List",
      description: "Chats are conversations with the AI assistant. Each chat is associated with a store and uses the knowledge base to answer questions.",
    },
  ],
  messages: [
    {
      title: "Message List",
      description: "Messages are individual entries in chat conversations. You can view, edit, and analyze all messages across your chats.",
    },
  ],
  videos: [
    {
      title: "Video List",
      description: "Videos can be uploaded and managed in Casibase. Videos can be transcribed and indexed for knowledge retrieval.",
    },
  ],
  files: [
    {
      title: "File List",
      description: "Files are documents uploaded to your stores. Supported formats include PDF, DOCX, TXT, and more. Files are processed and vectorized for AI retrieval.",
    },
  ],
  articles: [
    {
      title: "Article List",
      description: "Articles are text-based content that can be indexed and searched. They provide structured knowledge for your AI assistant.",
    },
  ],
  graphs: [
    {
      title: "Graph List",
      description: "Graphs represent knowledge relationships and connections. Visualize how different pieces of information relate to each other.",
    },
  ],
  nodes: [
    {
      title: "Node List",
      description: "Nodes are individual elements in knowledge graphs. They can represent concepts, entities, or documents.",
    },
  ],
  tasks: [
    {
      title: "Task List",
      description: "Tasks are automated jobs in Casibase, such as document processing, vector generation, or scheduled operations.",
    },
  ],
  workflows: [
    {
      title: "Workflow List",
      description: "Workflows are sequences of automated tasks. Create workflows to process documents, generate embeddings, or perform other operations.",
    },
  ],
  forms: [
    {
      title: "Form List",
      description: "Forms are customizable data collection interfaces. They can be used to gather structured information from users.",
    },
  ],
  templates: [
    {
      title: "Template List",
      description: "Templates are reusable configurations for stores, chats, or other resources. Use templates to quickly create new instances with predefined settings.",
    },
  ],
  applications: [
    {
      title: "Application List",
      description: "Applications are front-end interfaces that use your Casibase stores. Each application can be customized with its own branding and configuration.",
    },
  ],
  machines: [
    {
      title: "Machine List",
      description: "Machines are compute resources that can be managed and monitored in Casibase.",
    },
  ],
  containers: [
    {
      title: "Container List",
      description: "Containers are isolated environments for running applications and services.",
    },
  ],
  pods: [
    {
      title: "Pod List",
      description: "Pods are groups of containers that work together as a single unit.",
    },
  ],
  images: [
    {
      title: "Image List",
      description: "Images are container images used to create and run containers.",
    },
  ],
  assets: [
    {
      title: "Asset List",
      description: "Assets are media files and resources used in your applications.",
    },
  ],
  sessions: [
    {
      title: "Session List",
      description: "Sessions track user interactions and connections with your applications.",
    },
  ],
  connections: [
    {
      title: "Connection List",
      description: "Connections are active network connections to your services.",
    },
  ],
  records: [
    {
      title: "Record List",
      description: "Records are audit logs and activity records in Casibase. They help you track changes and user actions.",
    },
  ],
  sysinfo: [
    {
      title: "CPU Usage",
      description: "You can see the CPU usage in real time.",
      id: "cpu-card",
    },
    {
      title: "Memory Usage",
      description: "You can see the Memory usage in real time.",
      id: "memory-card",
    },
    {
      title: "API Latency",
      description: "You can see the usage statistics of each API latency in real time.",
      id: "latency-card",
    },
    {
      title: "API Throughput",
      description: "You can see the usage statistics of each API throughput in real time.",
      id: "throughput-card",
    },
    {
      title: "About Casibase",
      description: "You can get more Casibase information in this card.",
      id: "about-card",
    },
  ],
};

export const TourUrlList = [
  "home",
  "stores",
  "providers",
  "vectors",
  "chats",
  "messages",
  "videos",
  "files",
  "articles",
  "graphs",
  "nodes",
  "tasks",
  "workflows",
  "forms",
  "templates",
  "applications",
  "machines",
  "containers",
  "pods",
  "images",
  "assets",
  "sessions",
  "connections",
  "records",
  "sysinfo",
];

export function getNextUrl(pathName = window.location.pathname) {
  return TourUrlList[TourUrlList.indexOf(pathName.replace("/", "")) + 1] || "";
}

export function setIsTourVisible(visible) {
  localStorage.setItem("isTourVisible", visible);
  window.dispatchEvent(new Event("storageTourChanged"));
}

export function setTourLogo(tourLogoSrc) {
  if (tourLogoSrc !== "") {
    TourObj["home"][0]["cover"] = (<img alt="casibase.png" src={tourLogoSrc} />);
  }
}

export function getTourVisible() {
  return localStorage.getItem("isTourVisible") !== "false";
}

export function getNextButtonChild(nextPathName) {
  return nextPathName !== "" ?
    `Go to "${nextPathName.charAt(0).toUpperCase()}${nextPathName.slice(1)} List"`
    : "Finish";
}

export function getSteps() {
  const path = window.location.pathname.replace("/", "");
  const res = TourObj[path];
  if (res === undefined) {
    return [];
  } else {
    return res;
  }
}

import * as Setting from "../Setting";

export function getKnowledgeGraphs(owner, storeName) {
  return fetch(`${Setting.ServerUrl}/api/get-knowledge-graphs?owner=${owner}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getKnowledgeGraph(id) {
  return fetch(`${Setting.ServerUrl}/api/get-knowledge-graph?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateKnowledgeGraph(id, knowledgeGraph) {
  return fetch(`${Setting.ServerUrl}/api/update-knowledge-graph?id=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(knowledgeGraph),
  }).then(res => res.json());
}

export function addKnowledgeGraph(knowledgeGraph) {
  return fetch(`${Setting.ServerUrl}/api/add-knowledge-graph`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(knowledgeGraph),
  }).then(res => res.json());
}

export function deleteKnowledgeGraph(knowledgeGraph) {
  return fetch(`${Setting.ServerUrl}/api/delete-knowledge-graph`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(knowledgeGraph),
  }).then(res => res.json());
}

export function generateKnowledgeGraph(id) {
  return fetch(`${Setting.ServerUrl}/api/generate-knowledge-graph?id=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

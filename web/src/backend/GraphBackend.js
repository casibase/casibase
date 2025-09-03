import * as Setting from "../Setting";

export function getGraphs(owner, storeName) {
  return fetch(`${Setting.ServerUrl}/api/get-graphs?owner=${owner}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getGraph(id) {
  return fetch(`${Setting.ServerUrl}/api/get-graph?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateGraph(id, graph) {
  return fetch(`${Setting.ServerUrl}/api/update-graph?id=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(graph),
  }).then(res => res.json());
}

export function addGraph(graph) {
  return fetch(`${Setting.ServerUrl}/api/add-graph`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(graph),
  }).then(res => res.json());
}

export function deleteGraph(graph) {
  return fetch(`${Setting.ServerUrl}/api/delete-graph`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(graph),
  }).then(res => res.json());
}

export function generateGraph(id) {
  return fetch(`${Setting.ServerUrl}/api/generate-graph?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

import * as Setting from "../Setting";

export function getGlobalWordsets() {
  return fetch(`${Setting.ServerUrl}/api/get-global-wordsets`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getWordsets(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-wordsets?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getWordset(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-wordset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getWordsetGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-wordset-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getWordsetMatch(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-wordset-match?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateWordset(owner, name, wordset) {
  const newWordset = Setting.deepCopy(wordset);
  return fetch(`${Setting.ServerUrl}/api/update-wordset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newWordset),
  }).then(res => res.json());
}

export function addWordset(wordset) {
  const newWordset = Setting.deepCopy(wordset);
  return fetch(`${Setting.ServerUrl}/api/add-wordset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newWordset),
  }).then(res => res.json());
}

export function deleteWordset(wordset) {
  const newWordset = Setting.deepCopy(wordset);
  return fetch(`${Setting.ServerUrl}/api/delete-wordset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newWordset),
  }).then(res => res.json());
}

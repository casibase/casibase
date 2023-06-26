import * as Setting from "../Setting";

export function getGlobalVectorsets() {
  return fetch(`${Setting.ServerUrl}/api/get-global-vectorsets`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorsets(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorsets?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorset(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorsetGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorset-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateVectorset(owner, name, vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/update-vectorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}

export function addVectorset(vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/add-vectorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}

export function deleteVectorset(vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/delete-vectorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}

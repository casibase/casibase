import * as Setting from "../Setting";

export function getGlobalProviders() {
  return fetch(`${Setting.ServerUrl}/api/get-global-providers`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getProviders(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-providers?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getProvider(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-provider?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getProviderGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-provider-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateProvider(owner, name, provider) {
  const newProvider = Setting.deepCopy(provider);
  return fetch(`${Setting.ServerUrl}/api/update-provider?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newProvider),
  }).then(res => res.json());
}

export function addProvider(provider) {
  const newProvider = Setting.deepCopy(provider);
  return fetch(`${Setting.ServerUrl}/api/add-provider`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newProvider),
  }).then(res => res.json());
}

export function deleteProvider(provider) {
  const newProvider = Setting.deepCopy(provider);
  return fetch(`${Setting.ServerUrl}/api/delete-provider`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newProvider),
  }).then(res => res.json());
}

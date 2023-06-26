import * as Setting from "../Setting";

export function getGlobalStores() {
  return fetch(`${Setting.ServerUrl}/api/get-global-stores`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getStores(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-stores?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getStore(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-store?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateStore(owner, name, store) {
  const newStore = Setting.deepCopy(store);
  return fetch(`${Setting.ServerUrl}/api/update-store?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newStore),
  }).then(res => res.json());
}

export function addStore(store) {
  const newStore = Setting.deepCopy(store);
  return fetch(`${Setting.ServerUrl}/api/add-store`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newStore),
  }).then(res => res.json());
}

export function deleteStore(store) {
  const newStore = Setting.deepCopy(store);
  return fetch(`${Setting.ServerUrl}/api/delete-store`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newStore),
  }).then(res => res.json());
}

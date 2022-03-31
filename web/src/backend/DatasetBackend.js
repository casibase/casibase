import * as Setting from "../Setting";

export function getGlobalDatasets() {
  return fetch(`${Setting.ServerUrl}/api/get-global-datasets`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function getDatasets(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-datasets?owner=${owner}`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function getDataset(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-dataset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function updateDataset(owner, name, dataset) {
  let newDataset = Setting.deepCopy(dataset);
  return fetch(`${Setting.ServerUrl}/api/update-dataset?id=${owner}/${encodeURIComponent(name)}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newDataset),
  }).then(res => res.json());
}

export function addDataset(dataset) {
  let newDataset = Setting.deepCopy(dataset);
  return fetch(`${Setting.ServerUrl}/api/add-dataset`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newDataset),
  }).then(res => res.json());
}

export function deleteDataset(dataset) {
  let newDataset = Setting.deepCopy(dataset);
  return fetch(`${Setting.ServerUrl}/api/delete-dataset`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newDataset),
  }).then(res => res.json());
}

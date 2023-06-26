import * as Setting from "../Setting";

export function updateFile(storeId, name, file) {
  const newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/update-file?store=${storeId}&name=${name}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

export function addFile(storeId, key, isLeaf, filename, file) {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${Setting.ServerUrl}/api/add-file?store=${storeId}&key=${key}&isLeaf=${isLeaf ? 1 : 0}&filename=${filename}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(res => res.json());
}

export function deleteFile(storeId, key, isLeaf) {
  return fetch(`${Setting.ServerUrl}/api/delete-file?store=${storeId}&key=${key}&isLeaf=${isLeaf ? 1 : 0}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

export function activateFile(key, filename) {
  return fetch(`${Setting.ServerUrl}/api/activate-file?key=${key}&filename=${filename}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

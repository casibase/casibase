import * as Setting from "../Setting";

export function updateFile(storeName, name, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/update-file?store=${storeName}&name=${name}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

export function addFile(storeName, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/add-file?store=${storeName}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

export function deleteFile(storeName, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/delete-file?store=${storeName}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

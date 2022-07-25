import * as Setting from "../Setting";

export function updateFile(storeId, name, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/update-file?store=${storeId}&name=${name}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

export function addFile(storeId, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/add-file?store=${storeId}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

export function deleteFile(storeId, file) {
  let newFile = Setting.deepCopy(file);
  return fetch(`${Setting.ServerUrl}/api/delete-file?store=${storeId}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(newFile),
  }).then(res => res.json());
}

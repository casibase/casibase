import * as Setting from "../Setting";

export function getGlobalPermissions() {
  return fetch(`${Setting.ServerUrl}/api/get-global-permissions`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getPermissions(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-permissions?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getPermission(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-permission?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updatePermission(owner, name, permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/update-permission?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}

export function addPermission(permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/add-permission`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}

export function deletePermission(permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/delete-permission`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}

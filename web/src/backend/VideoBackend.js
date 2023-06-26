import * as Setting from "../Setting";

export function getGlobalVideos() {
  return fetch(`${Setting.ServerUrl}/api/get-global-videos`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVideos(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-videos?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVideo(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-video?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVideoGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-video-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateVideo(owner, name, video) {
  const newVideo = Setting.deepCopy(video);
  return fetch(`${Setting.ServerUrl}/api/update-video?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVideo),
  }).then(res => res.json());
}

export function addVideo(video) {
  const newVideo = Setting.deepCopy(video);
  return fetch(`${Setting.ServerUrl}/api/add-video`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVideo),
  }).then(res => res.json());
}

export function deleteVideo(video) {
  const newVideo = Setting.deepCopy(video);
  return fetch(`${Setting.ServerUrl}/api/delete-video`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVideo),
  }).then(res => res.json());
}

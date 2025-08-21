// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Setting from "../Setting";

/**
 * @typedef {Object} ApplicationChart
 * @property {string} owner - The owner of the application chart
 * @property {string} name - The name of the application chart
 * @property {string} createdTime - The creation time
 * @property {string} updatedTime - The last update time
 * @property {string} repositoryUrl - The repository URL
 * @property {string} displayName - The display name of the application chart
 * @property {string} description - The description of the application chart
 * @property {string} status - The status of the application chart
 * @property {string} namespace - The namespace for the chart
 * @property {string} apiVersion - The API version
 * @property {string} version - The chart version
 * @property {string} appVersion - The application version
 * @property {string} type - The chart type
 * @property {string} chartUrl - The chart URL
 * @property {string} iconUrl - The icon URL
 * @property {string} keywords - The keywords (comma-separated or raw string)
 * @property {string} home - The home page URL
 * @property {string} sources - The sources information
 * @property {string} maintainers - The maintainers information
 */

/**
 * @typedef {Object} ApiResponse
 * @property {string} status - The response status
 * @property {string} msg - The response message
 * @property {*} data - The response data
 * @property {*} data2 - Additional response data
 */

/**
 * Get application charts with pagination and filtering
 * @param {string} owner - The owner of application charts
 * @param {string} [page=""] - The page number
 * @param {string} [pageSize=""] - The page size
 * @param {string} [field=""] - The field to filter by
 * @param {string} [value=""] - The value to filter by
 * @param {string} [sortField=""] - The field to sort by
 * @param {string} [sortOrder=""] - The sort order (asc/desc)
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with application charts data
 */
export function getApplicationCharts(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-application-charts?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

/**
 * Get a specific application chart by owner and name
 * @param {string} owner - The owner of the application chart
 * @param {string} name - The name of the application chart
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with application chart data
 */
export function getApplicationChart(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-application-chart?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

/**
 * Update an existing application chart
 * @param {string} owner - The owner of the application chart
 * @param {string} name - The name of the application chart
 * @param {ApplicationChart} applicationChart - The application chart object to update
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with update result
 */
export function updateApplicationChart(owner, name, applicationChart) {
  const newApplicationChart = Setting.deepCopy(applicationChart);
  return fetch(`${Setting.ServerUrl}/api/update-application-chart?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newApplicationChart),
  }).then(res => res.json());
}

/**
 * Add a new application chart
 * @param {ApplicationChart} applicationChart - The application chart object to add
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with add result
 */
export function addApplicationChart(applicationChart) {
  const newApplicationChart = Setting.deepCopy(applicationChart);
  return fetch(`${Setting.ServerUrl}/api/add-application-chart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newApplicationChart),
  }).then(res => res.json());
}

/**
 * Delete an application chart
 * @param {ApplicationChart} applicationChart - The application chart object to delete
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with delete result
 */
export function deleteApplicationChart(applicationChart) {
  const newApplicationChart = Setting.deepCopy(applicationChart);
  return fetch(`${Setting.ServerUrl}/api/delete-application-chart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newApplicationChart),
  }).then(res => res.json());
}

/**
 * Load application charts from a repository
 * @param {string} owner - The owner of application charts
 * @param {string} repoUrl - The repository URL to load charts from
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with load result
 */
export function addApplicationCharts(owner, repoUrl) {
  return fetch(`${Setting.ServerUrl}/api/add-application-charts?owner=${owner}&repoUrl=${encodeURIComponent(repoUrl)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

/**
 * Get application chart content including Chart.yaml and values.yaml
 * @param {string} owner - The owner of the application chart
 * @param {string} name - The name of the application chart
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with chart content data
 */
export function getApplicationChartContent(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-application-chart-content?owner=${owner}&name=${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

/**
 * Render application chart with custom values
 * @param {string} owner - The owner of the application chart
 * @param {string} name - The name of the application chart
 * @param {Object} valuesJson - The custom values JSON object
 * @returns {Promise<ApiResponse>} Promise that resolves to API response with rendered chart data
 */
export function updateApplicationChartContent(owner, name, valuesJson) {
  // Backend expects ChartReleaseOptions JSON with `chart` and `values` fields
  const payload = {values: valuesJson};
  return fetch(`${Setting.ServerUrl}/api/update-application-chart-content?owner=${owner}&name=${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(res => res.json());
}

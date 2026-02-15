// Copyright 2025 The casbin Authors. All Rights Reserved.
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

import React from "react";
import i18next from "i18next";
import styles from "./CommitResultWidget.module.css";

class CommitResultWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comparisonResult: null,
    };
  }

  componentDidMount() {
    if (this.props.queryResult) {
      const comparisonResult = this.buildComparisonResultFromQuery(this.props.queryResult);
      this.setState({comparisonResult});
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.queryResult !== prevProps.queryResult) {
      const comparisonResult = this.buildComparisonResultFromQuery(this.props.queryResult);
      this.setState({comparisonResult});
    }
  }

  buildComparisonResultFromQuery = (queryResult) => {
    if (!queryResult) {
      return null;
    }
    const comparisonResult = this.parseQueryResult(queryResult);
    if (
      comparisonResult &&
      comparisonResult.status === "mismatched" &&
      comparisonResult.parsedChainData &&
      comparisonResult.parsedLocalData
    ) {
      comparisonResult.differences = this.detectDifferences(
        comparisonResult.parsedChainData,
        comparisonResult.parsedLocalData
      );
    }
    return comparisonResult;
  };

  parseQueryResult = (queryResult) => {
    try {
      const lines = queryResult.split("\n");
      const blockMatch = lines[0].match(/block \[(\d+)\]/);
      const blockId = blockMatch ? blockMatch[1] : "Unknown";

      const isMatched = lines[0].includes("Matched");

      if (isMatched) {
        const dataStartIndex = lines.findIndex(line => line.includes("Data:"));
        if (dataStartIndex !== -1) {
          const data = lines.slice(dataStartIndex + 2).join("\n").trim();
          return {
            status: "matched",
            blockId,
            data: data,
            parsedData: this.tryParseJSON(data),
          };
        }
      } else {
        const chainDataStart = lines.findIndex(line => line.includes("Chain data:"));
        const localDataStart = lines.findIndex(line => line.includes("Local data:"));

        if (chainDataStart !== -1 && localDataStart !== -1) {
          const chainData = lines.slice(chainDataStart + 2, localDataStart - 1).join("\n").trim();
          const localData = lines.slice(localDataStart + 2).join("\n").trim();

          return {
            status: "mismatched",
            blockId,
            chainData: chainData,
            localData: localData,
            parsedChainData: this.tryParseJSON(chainData),
            parsedLocalData: this.tryParseJSON(localData),
          };
        }
      }

      return {
        status: "unknown",
        blockId: "Unknown",
        rawData: queryResult,
      };
    } catch (error) {
      return {
        status: "error",
        blockId: "Error",
        error: error.message,
        rawData: queryResult,
      };
    }
  };

  tryParseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  };

  formatFieldPath = (path) => {
    if (path.startsWith("value.")) {
      return path.substring(6);
    }
    return path;
  };

  formatFieldValue = (value) => {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "string") {
      if (value.length > 50) {
        return value.substring(0, 50) + "...";
      }
      return value;
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  detectDifferences = (chainData, localData) => {
    const differences = [];

    if (!chainData || !localData) {
      return differences;
    }

    const compareObjects = (chainObj, localObj, path = "") => {
      for (const key in chainObj) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in localObj)) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: i18next.t("general:Error"),
            type: "missing",
          });
        } else if (typeof chainObj[key] !== typeof localObj[key]) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: localObj[key],
            type: "type_mismatch",
          });
        } else if (typeof chainObj[key] === "object" && chainObj[key] !== null && !Array.isArray(chainObj[key])) {
          compareObjects(chainObj[key], localObj[key], currentPath);
        } else if (chainObj[key] !== localObj[key]) {
          differences.push({
            path: currentPath,
            chainValue: chainObj[key],
            localValue: localObj[key],
            type: "value_mismatch",
          });
        }
      }
    };

    try {
      let chainValueObj = chainData;
      let localValueObj = localData;

      if (chainData.value && typeof chainData.value === "string") {
        try {
          chainValueObj = JSON.parse(chainData.value);
        } catch (e) {
          // console.warn("Failed to parse chain data value:", e);
        }
      }

      if (localData.value && typeof localData.value === "string") {
        try {
          localValueObj = JSON.parse(localData.value);
        } catch (e) {
          // console.warn("Failed to parse local data value:", e);
        }
      }

      compareObjects(chainValueObj, localValueObj);
    } catch (error) {
      // console.error("Error comparing objects:", error);
      compareObjects(chainData, localData);
    }

    return differences;
  };

  render() {
    const comparisonResult = this.state.comparisonResult;
    if (!comparisonResult) {
      return null;
    }

    const {status, blockId, differences} = comparisonResult;

    if (status === "matched") {
      return (
        <div className={`${styles["comparison-result"]} ${styles.matched}`}>
          <div className={`${styles["result-header"]} ${styles.success}`}>
            <div className={styles["status-icon"]}>🟢</div>
            <div className={styles["status-info"]}>
              <h3>{i18next.t("record:Data Verification")}</h3>
              <p>{i18next.t("general:Success")}</p>
            </div>
          </div>

          <div className={styles["result-details"]}>
            <div className={styles["detail-item"]}>
              <span className={styles.label}>📍 {i18next.t("general:Block")}:</span>
              <span className={styles.value}>{blockId}</span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles.label}>✅ {i18next.t("general:Status")}:</span>
              <span className={`${styles.value} ${styles.success}`}>{i18next.t("general:Success")}</span>
            </div>
          </div>

          <div className={styles["data-section"]}>
            <h4>📋 {i18next.t("general:Data")}</h4>
            <div className={styles["json-display"]}>
              <pre>{comparisonResult.data}</pre>
            </div>
          </div>
        </div>
      );
    }

    if (status === "mismatched") {
      return (
        <div className={`${styles["comparison-result"]} ${styles.mismatched}`}>
          <div className={`${styles["result-header"]} ${styles.error}`}>
            <div className={styles["status-icon"]}>🔴</div>
            <div className={styles["status-info"]}>
              <h3>{i18next.t("record:Data Verification")}</h3>
              <p>{i18next.t("general:Error")}</p>
            </div>
          </div>

          <div className={styles["result-details"]}>
            <div className={styles["detail-item"]}>
              <span className={styles.label}>📍 {i18next.t("general:Block")}:</span>
              <span className={styles.value}>{blockId}</span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles.label}>❌ {i18next.t("general:Status")}:</span>
              <span className={`${styles.value} ${styles.error}`}>{i18next.t("general:Error")}</span>
            </div>
          </div>

          <div className={styles["data-comparison"]}>
            <div className={styles["comparison-section"]}>
              <h4>🔗 {i18next.t("provider:Chain")}</h4>
              <div className={styles["json-display"]}>
                <pre>{comparisonResult.chainData}</pre>
              </div>
            </div>

            <div className={styles["comparison-section"]}>
              <h4>💾 {i18next.t("general:Local")}</h4>
              <div className={styles["json-display"]}>
                <pre>{comparisonResult.localData}</pre>
              </div>
            </div>
          </div>

          {differences && differences.length > 0 && (
            <div className={styles["differences-section"]}>
              <h4>🔍 {i18next.t("general:Result")}</h4>
              <div className={styles["differences-list"]}>
                {differences.map((diff, index) => (
                  <div key={index} className={styles["difference-item"]}>
                    <div className={styles["difference-path"]}>
                      <strong>{i18next.t("general:Data")} &quot;{this.formatFieldPath(diff.path)}&quot;:</strong>
                    </div>
                    <div className={styles["difference-values"]}>
                      <span className={styles["chain-value"]}>
                        {i18next.t("provider:Chain")}: <code>{this.formatFieldValue(diff.chainValue)}</code>
                      </span>
                      <span className={styles.separator}>→</span>
                      <span className={styles["local-value"]}>
                        {i18next.t("general:Local")}: <code>{this.formatFieldValue(diff.localValue)}</code>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`${styles["comparison-result"]} ${styles.unknown}`}>
        <div className={`${styles["result-header"]} ${styles.warning}`}>
          <div className={styles["status-icon"]}>🟡</div>
          <div className={styles["status-info"]}>
            <h3>{i18next.t("general:Error")}</h3>
            <p>{i18next.t("general:Error")}</p>
          </div>
        </div>

        <div className={styles["raw-data"]}>
          <h4>{i18next.t("general:Data")}</h4>
          <pre>{comparisonResult.rawData || i18next.t("general:Data")}</pre>
        </div>
      </div>
    );
  }
}

export default CommitResultWidget;

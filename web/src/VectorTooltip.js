import React from "react";
import {Tooltip} from "antd";
import * as Setting from "./Setting";
import * as VectorBackend from "./backend/VectorBackend";
import i18next from "i18next";

const VectorTooltip = ({vectorScore, children}) => {
  const [vectorData, setVectorData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchVectorInfo = async() => {
    if (!loading) {
      setLoading(true);
      try {
        const res = await VectorBackend.getVector("admin", vectorScore.vector);
        if (res.status === "ok") {
          setVectorData(res.data);
        }
      } catch (error) {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const tooltipContent = () => {
    if (!vectorData) {
      return (
        <div>
          <div><strong>{i18next.t("general:Name")}:</strong> {vectorScore.vector}</div>
          <div><strong>{i18next.t("video:Score")}:</strong> {vectorScore.score}</div>
        </div>
      );
    }

    return (
      <div style={{maxWidth: 800, fontSize: "14px", padding: "5px", boxSizing: "border-box"}}>
        <div style={{display: "flex", gap: "15px", flexWrap: "wrap"}}>
          <span><strong>{i18next.t("general:Name")}:</strong> {vectorScore.vector}</span>
          <span><strong>{i18next.t("video:Score")}:</strong> {vectorScore.score}</span>
          <span><strong>{i18next.t("store:File")}:</strong> {vectorData.file || "N/A"}</span>
        </div>
        <div style={{marginTop: 8, paddingTop: 8, borderTop: "1px solid #d9d9d9"}}>
          <div style={{maxHeight: "200px", overflow: "auto", fontSize: "13px", backgroundColor: "#f5f5f5", color: "#000000", padding: "8px", borderRadius: "4px", marginTop: "4px", whiteSpace: "pre-wrap", border: "3px solid #d9d9d9"}}>
            {vectorData.text || "N/A"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Tooltip title={tooltipContent()} placement="right" mouseEnterDelay={0.5} onOpenChange={(open) => open && fetchVectorInfo()} overlayInnerStyle={{width: 600, backgroundColor: "#ffffff", color: "#000000"}}>
      {children}
    </Tooltip>
  );
};

export default VectorTooltip;

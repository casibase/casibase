import React from "react";

const cardList = [
    { title: "上链", icon: "🔗", router: "/chain" },
    { title: "数据使用控制", icon: "🛡️", router: "/data-control" },
    { title: "临床路径", icon: "🩺", router: "/clinical-path" },
    { title: "联邦学习", icon: "🤝", router: "/federated-learning" },
    { title: "复杂查询与审计", icon: "🔍", router: "/audit" },
    { title: "数据质量控制", icon: "📊", router: "/data-quality" },
    { title: "密文计算", icon: "🔒", router: "/crypto" },
    { title: "工作流", icon: "🛠️", router: "/workflow" },
    { title: "其他", icon: "✨", router: "/other" }
];


import { useHistory } from "react-router-dom";

const MedGuideCardGrid = () => {
    const history = useHistory();
    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "32px",
            marginTop: "40px"
        }}>
            {cardList.map((item, idx) => (
                <div
                    key={idx}
                    style={{
                        width: 220,
                        height: 130,
                        borderRadius: 18,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        position: "relative",
                        boxShadow: "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)"
                    }}
                    onClick={() => item.router && history.push(item.router)}
                    onMouseOver={e => {
                        e.currentTarget.style.transform = "scale(1.06)";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.16)";
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)";
                    }}
                >
                    <span style={{ fontSize: 36, marginBottom: 8 }}>{item.icon}</span>
                    <span>{item.title}</span>
                    {item.desc && <span style={{ fontSize: 14, color: "#888", marginTop: 6 }}>{item.desc}</span>}
                </div>
            ))}
        </div>
    );
};

export default MedGuideCardGrid;

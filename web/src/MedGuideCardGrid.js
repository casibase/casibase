import React from "react";


const cardGroups = [
    {
        groupTitle: "数据与链",
        color: "#0984e3",
        cards: [
            { title: "上链", icon: "🔗", router: "/chain" },
            { title: "数据使用控制", icon: "🛡️", router: "/data-control" },
        ]
    },
    {
        groupTitle: "医疗智能",
        color: "#6242d5",
        cards: [
            { title: "临床路径", icon: "🩺", router: "/clinical-path" },
            { title: "联邦学习", icon: "🤝", router: "/federated-learning" },
        ]
    },
    {
        groupTitle: "数据治理",
        color: "#40739e",
        cards: [
            { title: "复杂查询与审计", icon: "🔍", router: "/audit" },
            { title: "数据质量控制", icon: "📊", router: "/data-quality" },
        ]
    },
    {
        groupTitle: "安全与扩展",
        color: "#00b894",
        cards: [
            { title: "密文计算", icon: "🔒", router: "/crypto" },
            { title: "工作流", icon: "🛠️", router: "/workflow" },
            { title: "其他", icon: "✨", router: "/other" }
        ]
    }
];



import { useHistory } from "react-router-dom";

const MedGuideCardGrid = () => {
    const history = useHistory();
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "30px 48px",
            justifyContent: "center",
            margin: "40px auto",
            padding: "0 150px"
        }}>
            {cardGroups.map((group, groupIdx) => (
                <div key={groupIdx} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    borderRadius: 18,
                    // padding: "28px 24px 18px 24px",
                    // minWidth: 320,
                    minHeight: 160
                }}>
                    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 18, color: group.color }}>
                        <span style={{ fontWeight: 400, color: "#a4b0be" }}>#{groupIdx + 1} </span>
                        {group.groupTitle}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", justifyContent: "center" }}>
                        {group.cards.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: 180,
                                    height: 120,
                                    borderRadius: 14,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: "none",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    position: "relative",
                                    boxShadow: "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)"

                                }}
                                onClick={() => item.router && history.push(item.router)}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = "scale(1.08)";
                                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.16)";
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)";
                                }}
                            >
                                <span style={{ fontSize: 30, marginBottom: 6 }}>{item.icon}</span>
                                <span>{item.title}</span>
                                {item.desc && <span style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{item.desc}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MedGuideCardGrid;

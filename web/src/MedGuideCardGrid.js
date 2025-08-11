import React, { useEffect } from "react";


const cardGroups = [
    {
        groupTitle: "数据与链",
        color: "#0984e3",
        cards: [
            { title: "数据看板", icon: "🔢", router: "/dashboard", desc: "纵览全局数据" },
            { title: "上链日志", icon: "🔗", router: "/records", desc: "区块链存证" },
            // { title: "数据使用控制", icon: "🛡️", router: "/data-control", desc: "权限与追踪" },
        ]
    },
    {
        groupTitle: "医疗智能",
        color: "#6242d5",
        cards: [
            { title: "临床路径", icon: "🩺", router: "/workflows", desc: "智能诊疗" },
            // { title: "联邦学习", icon: "🤝", router: "/federated-learning", desc: "多方协作" },
            { title: "医学影像分析", icon: "🖼️", router: "/yolov8mi", desc: "智能分析" },
            { title: "图像超分", icon: "📷", router: "/sr", desc: "提升图像质量" },


        ]
    },
    {
        groupTitle: "数据治理",
        color: "#40739e",
        cards: [
            { title: "复杂查询审计", icon: "🔍", router: "/audit", desc: "灵活分析" },
            // { title: "数据质量控制", icon: "📊", router: "/data-quality", desc: "数据治理" },
        ]
    },
    {
        groupTitle: "平台管理",
        color: "#00b894",
        cards: [
            // { title: "密文计算", icon: "🔒", router: "/crypto", desc: "隐私保护" },
            { title: "提供商", icon: "🌐", router: "/providers", desc: "" }
        ]
    }
];



import { useHistory } from "react-router-dom";


const cardClassName = "med-guide-card-grid-card";


const MedGuideCardGrid = () => {
    const history = useHistory();

    // 动态插入CSS
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .${cardClassName} {
                position: relative;
                overflow: visible;
            }
            .${cardClassName}:hover {
                font-weight: 700 !important;
            }
            .${cardClassName}:hover::before {
                content: "";
                inset: 0;
                position: absolute;
                background: linear-gradient(180deg, #998dff 0, #576dff 50%, #3370ff 100%);
                padding: 1px;
                border-radius: 16px;
                -webkit-mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
                -webkit-mask-clip: content-box, border-box;
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
                z-index: 1;
            }
            .desc-span {
                font-weight: 400 !important;
            }
        `;
        document.head.appendChild(style);
    }, []);

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
                <div
                    key={groupIdx}

                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        borderRadius: 18,
                        background: "#fff",
                        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                        padding: "18px 24px 12px 24px",
                        minHeight: 160,
                        transition: "all 0.2s",
                        border: "2px solid rgba(0,0,0,0.05)"
                    }}
                // onMouseOver={e => {
                //     e.currentTarget.style.boxShadow = "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)";
                //     e.currentTarget.style.border = "2px solid #747d8c"
                // }}
                // onMouseOut={e => {
                //     e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.08)";
                //     e.currentTarget.style.border = "2px solid rgba(0,0,0,0.05)"
                // }}
                >
                    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 14, color: group.color, marginTop: 8 }}>
                        <span style={{ fontWeight: 400, color: "#a4b0be" }}>#{groupIdx + 1} </span>
                        {group.groupTitle}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
                        {group.cards.map((item, idx) => (
                            <div
                                key={idx}
                                className={cardClassName}
                                style={{
                                    width: 130,
                                    height: 140,
                                    borderRadius: 12,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    border: "none",
                                    background: "none",
                                    transition: "all 0.2s"
                                }}
                                onClick={() => item.router && history.push(item.router)}
                                onMouseOver={e => {
                                    e.currentTarget.style.fontWeight = "700";
                                    e.currentTarget.style.boxShadow = "0 3px 20px 0 rgba(66, 89, 153, .18)";
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.fontWeight = "500";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div style={{ fontSize: 38, marginBottom: 20 }}>{item.icon}</div>
                                <div>{item.title}</div>
                                {item.desc && <span style={{ fontSize: 13, color: "#888", marginTop: 4 }} className="desc-span">{item.desc}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MedGuideCardGrid;

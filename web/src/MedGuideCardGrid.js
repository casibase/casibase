// import React, { useEffect } from "react";
//
//
// const cardGroups = [
//     {
//         groupTitle: "数据与链",
//         color: "#0984e3",
//         cards: [
//             { title: "可信共享数据总览", icon: "🔢", router: "/dashboard", desc: "纵览全局数据" },
//             { title: "上链日志", icon: "🔗", router: "/records", desc: "区块链存证" },
//             // { title: "数据使用控制", icon: "🛡️", router: "/data-control", desc: "权限与追踪" },
//         ]
//     },
//     {
//         groupTitle: "医疗智能",
//         color: "#6242d5",
//         cards: [
//             { title: "临床路径", icon: "🩺", router: "/workflows", desc: "智能诊疗" },
//             // { title: "联邦学习", icon: "🤝", router: "/federated-learning", desc: "多方协作" },
//             { title: "医学影像分析", icon: "🖼️", router: "/yolov8mi", desc: "智能分析" },
//             { title: "图像超分", icon: "📷", router: "/sr", desc: "提升图像质量" },
//
//
//         ]
//     },
//     {
//         groupTitle: "数据治理",
//         color: "#40739e",
//         cards: [
//             { title: "复杂查询审计", icon: "🔍", router: "/audit", desc: "灵活分析" },
//             // { title: "数据质量控制", icon: "📊", router: "/data-quality", desc: "数据治理" },
//         ]
//     },
//     {
//         groupTitle: "平台管理",
//         color: "#00b894",
//         cards: [
//             // { title: "密文计算", icon: "🔒", router: "/crypto", desc: "隐私保护" },
//             { title: "提供商", icon: "🌐", router: "/providers", desc: "" }
//         ]
//     }
// ];
//
//
//
// import { useHistory } from "react-router-dom";
//
//
// const cardClassName = "med-guide-card-grid-card";
//
//
// const MedGuideCardGrid = () => {
//     const history = useHistory();
//
//     // 动态插入CSS
//     useEffect(() => {
//         const style = document.createElement("style");
//         style.innerHTML = `
//             .${cardClassName} {
//                 position: relative;
//                 overflow: visible;
//             }
//             .${cardClassName}:hover {
//                 font-weight: 700 !important;
//             }
//             .${cardClassName}:hover::before {
//                 content: "";
//                 inset: 0;
//                 position: absolute;
//                 background: linear-gradient(180deg, #998dff 0, #576dff 50%, #3370ff 100%);
//                 padding: 1px;
//                 border-radius: 16px;
//                 -webkit-mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
//                 -webkit-mask-clip: content-box, border-box;
//                 -webkit-mask-composite: xor;
//                 mask-composite: exclude;
//                 pointer-events: none;
//                 z-index: 1;
//             }
//             .desc-span {
//                 font-weight: 400 !important;
//             }
//         `;
//         document.head.appendChild(style);
//     }, []);
//
//     return (
//         <div style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gridTemplateRows: "1fr 1fr",
//             gap: "30px 48px",
//             justifyContent: "center",
//             margin: "40px auto",
//             padding: "0 150px"
//         }}>
//             {cardGroups.map((group, groupIdx) => (
//                 <div
//                     key={groupIdx}
//
//                     style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         alignItems: "flex-start",
//                         borderRadius: 18,
//                         background: "#fff",
//                         boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
//                         padding: "18px 24px 12px 24px",
//                         minHeight: 160,
//                         transition: "all 0.2s",
//                         border: "2px solid rgba(0,0,0,0.05)"
//                     }}
//                 // onMouseOver={e => {
//                 //     e.currentTarget.style.boxShadow = "0 6px 24px 0 rgb(0 53 255 / 2%), 0 7px 35px 0 rgb(0 92 255 / 4%)";
//                 //     e.currentTarget.style.border = "2px solid #747d8c"
//                 // }}
//                 // onMouseOut={e => {
//                 //     e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.08)";
//                 //     e.currentTarget.style.border = "2px solid rgba(0,0,0,0.05)"
//                 // }}
//                 >
//                     <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 14, color: group.color, marginTop: 8 }}>
//                         <span style={{ fontWeight: 400, color: "#a4b0be" }}>#{groupIdx + 1} </span>
//                         {group.groupTitle}
//                     </div>
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
//                         {group.cards.map((item, idx) => (
//                             <div
//                                 key={idx}
//                                 className={cardClassName}
//                                 style={{
//                                     width: 130,
//                                     height: 140,
//                                     borderRadius: 12,
//                                     display: "flex",
//                                     flexDirection: "column",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     fontSize: 18,
//                                     fontWeight: 500,
//                                     cursor: "pointer",
//                                     border: "none",
//                                     background: "none",
//                                     transition: "all 0.2s"
//                                 }}
//                                 onClick={() => item.router && history.push(item.router)}
//                                 onMouseOver={e => {
//                                     e.currentTarget.style.fontWeight = "700";
//                                     e.currentTarget.style.boxShadow = "0 3px 20px 0 rgba(66, 89, 153, .18)";
//                                 }}
//                                 onMouseOut={e => {
//                                     e.currentTarget.style.fontWeight = "500";
//                                     e.currentTarget.style.boxShadow = "none";
//                                 }}
//                             >
//                                 <div style={{ fontSize: 38, marginBottom: 20 }}>{item.icon}</div>
//                                 <div>{item.title}</div>
//                                 {item.desc && <span style={{ fontSize: 13, color: "#888", marginTop: 4 }} className="desc-span">{item.desc}</span>}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// };
//
// export default MedGuideCardGrid;

import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";

/**
 * 结构版：
 * - 顶部：医疗健康数据总览（单独大卡，居中）。
 * - 第二块：横排三栏场景（多方协同诊疗/转诊 + 商保赔付 + 临床路径标准化评估），加左边色条。
 * - 第三块：课题二、课题三、课题四分别独立外框，横排三栏，每个外框左侧加不同颜色的条带区分。
 */

const GRID_WRAP_CLS = "mg-wrap";
const HIGHLIGHT_BLOCK_CLS = "mg-highlight";
const HIGHLIGHT_CARD_CLS = "mg-highlight-card";

const GROUP_WRAP_CLS = "mg-group";
const GROUP_ROW_CLS = "mg-group-row";
const SCENE_WRAP_CLS = "mg-scene";
const SCENE_TITLE_CLS = "mg-scene-title";
const CARD_CLS = "mg-card";

// 功能定义
const feature_dashboard = { title: "医疗健康数据总览", icon: "📊", url: "/dashboard", desc: "全局数据纵览" };

const scene_collab = {
    title: "多方协同诊疗 / 转诊",
    features: [
        { title: "图像超分", icon: "🖼️", url: "/sr", desc: "影像质量提升" },
        { title: "医疗影像分析", icon: "🔎", url: "/yolov8mi", desc: "智能检测/分割" },
        { title: "复杂查询与审计", icon: "📁", url: "/audit", desc: "灵活检索与留痕" },
    ],
};

const scene_insurance = {
    title: "商保赔付",
    features: [
        { title: "密文计算", icon: "🔒", url: null, desc: "TODO：隐私保护计算" },
        { title: "SM9-IPFE 演示面板", icon: "🧮", url: null, desc: "TODO：国密加密演示" },
    ],
};

const scene_pathway_eval = {
    title: "临床路径标准化评估",
    features: [
        { title: "数据受控使用", icon: "🛡️", url: null, desc: "TODO：权限与追踪" },
    ],
};

const scene_kg = {
    title: "院内多科室的专病辅助诊断",
    features: [
        {
            title: "专病库知识图谱",
            icon: "🧠",
            url: "https://192.168.0.228:13001/forms/专病库知识图谱/data",
            desc: "iframe 直链（内网）",
            external: true,
        },
    ],
};

const scene_rx_audit = {
    title: "处方审核",
    features: [
        { title: "联邦学习", icon: "🤝", url: null, desc: "TODO：多方协作训练" },
    ],
};

const scene_supervision = {
    title: "医疗过程监管",
    features: [
        { title: "临床路径", icon: "🩺", url: "/workflows", desc: "路径对比与评估" },
        { title: "医疗纠纷系统", icon: "⚖️", url: null, desc: "TODO：责任追溯" },
    ],
};

// 分组逻辑
const group1 = { color: "#8C1D40", title: "课题一：可信共享与审计监管", scenes: [scene_collab, scene_insurance, scene_pathway_eval] };
const group2 = { color: "#3b82f6", title: "课题二：知识图谱与推理", scenes: [scene_kg] };
const group3 = { color: "#10b981", title: "课题三：数据安全与可信联邦", scenes: [scene_rx_audit] };
const group4 = { color: "#f59e0b", title: "课题四：区块链平台及示范应用", scenes: [scene_supervision] };

const MedSceneGrid = () => {
    const history = useHistory();

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
      .${GRID_WRAP_CLS} { margin: 32px auto 48px; padding: 0 120px; max-width: 1400px; display: grid; gap: 36px; }

      /* 突出展示卡片 */
      .${HIGHLIGHT_BLOCK_CLS} { display:flex; justify-content:center; }
      .${HIGHLIGHT_CARD_CLS} { width:100%; max-width:520px; height:160px; background:linear-gradient(135deg,#3b82f6,#60a5fa); border-radius:18px; box-shadow:0 10px 24px rgba(59,130,246,.3); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; cursor:pointer; transition:transform .2s ease, box-shadow .2s ease; }
      .${HIGHLIGHT_CARD_CLS}:hover { transform:translateY(-4px); box-shadow:0 14px 32px rgba(59,130,246,.4); }
      .${HIGHLIGHT_CARD_CLS} .icon { font-size:42px; margin-bottom:12px; }
      .${HIGHLIGHT_CARD_CLS} .title { font-size:20px; font-weight:800; margin-bottom:6px; }
      .${HIGHLIGHT_CARD_CLS} .desc { font-size:14px; opacity:.9; }

      /* 分组容器 */
      .${GROUP_WRAP_CLS} { background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:16px; padding:16px 20px; box-shadow:0 4px 14px rgba(0,0,0,.06); position: relative; }
      .${GROUP_WRAP_CLS}::before { content:""; position:absolute; left:0; top:0; bottom:0; width:6px; border-radius:16px 0 0 16px; }

      .${GROUP_ROW_CLS} { display:grid; gap:24px; }

      .${SCENE_WRAP_CLS} { background:#ffffff; border:1px solid rgba(0,0,0,.05); border-radius:12px; padding:14px 16px; box-shadow:0 4px 12px rgba(0,0,0,.04); display:flex; flex-direction:column; }
      .${SCENE_TITLE_CLS} { font-size:16px; font-weight:700; color:#374151; margin-bottom:10px; }
      .${SCENE_WRAP_CLS} .cards { display:flex; flex-wrap:wrap; gap:12px; flex:1; align-items:center; justify-content:center; }

      .${CARD_CLS} { width: 150px; height: 120px; border-radius: 12px; background:#fafafa; border:1px solid rgba(0,0,0,.05); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition: box-shadow .18s ease, transform .18s ease; }
      .${CARD_CLS}:hover { box-shadow:0 6px 16px rgba(0,0,0,.12); transform: translateY(-2px); background:#fff; }
      .${CARD_CLS} .icon { font-size: 30px; }
      .${CARD_CLS} .title { font-size: 15px; font-weight: 600; text-align:center; }
      .${CARD_CLS} .desc { font-size: 12px; color:#6b7280; text-align:center; padding:0 6px; }

      .${GROUP_ROW_CLS}.row-2 { grid-template-columns: repeat(2, 1fr); }
      .${GROUP_ROW_CLS}.row-3 { grid-template-columns: repeat(3, 1fr); }

      @media (max-width: 1200px) { .${GRID_WRAP_CLS} { padding: 0 60px; } .${GROUP_ROW_CLS}.row-2, .${GROUP_ROW_CLS}.row-3 { grid-template-columns: 1fr; } }
      @media (max-width: 640px) { .${GRID_WRAP_CLS} { padding: 0 16px; } .${CARD_CLS} { width: calc(50% - 6px); } }
    `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const handleClick = (f) => {
        if (!f || !f.url) return;
        if (f.external) { window.open(f.url, "_blank", "noopener,noreferrer"); return; }
        history.push(f.url);
    };

    const renderScene = (scene) => (
        <section key={scene.title} className={SCENE_WRAP_CLS} aria-label={scene.title}>
            <div className={SCENE_TITLE_CLS}>{scene.title}</div>
            <div className="cards">
                {scene.features.map((f, idx) => (
                    <div
                        key={`${f.title}-${idx}`}
                        className={CARD_CLS}
                        onClick={() => handleClick(f)}
                        title={f.url ? f.title : (f.desc || f.title)}
                        role={f.url ? "button" : "note"}
                        aria-disabled={!f.url}
                    >
                        <div className="icon">{f.icon}</div>
                        <div className="title">{f.title}</div>
                        {f.desc && <div className="desc">{f.desc}</div>}
                    </div>
                ))}
            </div>
        </section>
    );

    const renderGroup = (group, rowClass = "") => (
        <div className={`${GROUP_WRAP_CLS} ${rowClass}`} style={{ borderLeft: `6px solid ${group.color}` }}>
            <div className={SCENE_TITLE_CLS} style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
                {group.title}
            </div>
            <div className={`${GROUP_ROW_CLS} ${rowClass}`}>{group.scenes.map(renderScene)}</div>
        </div>
    );

    return (
        <div className={GRID_WRAP_CLS}>
            {/* 医疗健康数据总览 */}
            <div className={HIGHLIGHT_BLOCK_CLS}>
                <div className={HIGHLIGHT_CARD_CLS} onClick={() => handleClick(feature_dashboard)}>
                    <div className="icon">{feature_dashboard.icon}</div>
                    <div className="title">{feature_dashboard.title}</div>
                    <div className="desc">{feature_dashboard.desc}</div>
                </div>
            </div>

            {/* 课题一：横排三栏 */}
            {renderGroup(group1, "row-3")}

            {/* 课题二、三、四：横排三栏 */}
            <div className={`${GROUP_ROW_CLS} row-3`}>
                {renderGroup(group2)}
                {renderGroup(group3)}
                {renderGroup(group4)}
            </div>
        </div>
    );
};

export default MedSceneGrid;

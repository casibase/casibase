
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import * as Setting from "./Setting";

// 分组与按钮数据
const GROUPS = [
    {
        name: "系统管理",
        subtitle: "平台基础配置与权限管理",
        color: "#2d5af1",
        bg: "#fcfdff",
        buttons: [

            { title: "资源状态", icon: "📊", desc: "实时监控服务器、存储、网络等各类资源的运行状态，保障平台稳定。", route: "/sysinfo" },
            { title: "系统设置", icon: "⚙️", desc: "配置平台基础参数（如提供商等），定制系统行为，支持多种业务场景。", route: "/stores" },
            { title: "用户管理", icon: "👤", desc: "集中管理所有用户账号、分配角色权限，支持批量导入与导出。" },
            { title: "权限管理", icon: "🔑", desc: "灵活配置访问控制策略，细粒度分配各类操作与数据权限。" },
        ],
    },
    {
        name: "数据管理",
        subtitle: "数据全生命周期管理与分析",
        color: "#10b981",
        bg: "#fcfefd",
        buttons: [
            { title: "数据总揽", icon: "📊", desc: "全局展示平台内各类数据分布、增长趋势与共享情况。", route: "/dashboard" },
            { title: "患者上链数据", icon: "📝", desc: "查看每位患者的上链数据明细，支持多维度检索与追溯。", route: "/ipfs-search", introRoute: "/introduce/patient-chain-data" },
            { title: "专病知识图谱", icon: "🧠", desc: "构建专病领域知识结构，助力智能诊疗与科研分析。", route: "https://192.168.0.228:13001/forms/专病库知识图谱/data" },
        ],
    },
    {
        name: "上链服务",
        subtitle: "医疗数据可信上链与审计",
        color: "#f59e42",
        bg: "#fffcfa",
        buttons: [
            { title: "医疗记录上联", icon: "📄", desc: "将医疗文档高效上链，保障数据不可篡改与可追溯。", route: "/ipfs-archive" },
            { title: "数据操作上联", icon: "🔗", desc: "各类数据操作全流程上链，提升数据可信度。", route: "/records" },
            { title: "区块链浏览器", icon: "🌐", desc: "可视化浏览链上数据，支持多条件筛选与溯源。", route: "/forms/区块链浏览器/data" },
            { title: "查询与审计", icon: "🔍", desc: "对链上数据进行灵活查询与合规性审计分析。", route: "/audit" },
        ],
    },
    {
        name: "共享服务",
        subtitle: "数据共享与隐私保护",
        color: "#8b5cf6",
        bg: "#fdfbff",
        buttons: [
            { title: "图像超分", icon: "🖼️", desc: "提升医学影像分辨率，助力精准诊断与科研。", route: "/sr" },
            { title: "医疗影像分析", icon: "🔎", desc: "AI驱动医学影像检测、分割与辅助诊断。", route: "/yolov8mi" },
            { title: "受控使用", icon: "🛡️", desc: "实现数据分级授权与受控访问，保障数据安全。", route: "/share/usage" },
            { title: "密文计算", icon: "🔒", desc: "支持隐私保护计算，数据加密流转与分析。", route: "/share/crypto" },
            { title: "可信解密", icon: "🔓", desc: "安全可信的数据解密服务，合规可控。", route: "/share/decrypt" },
        ],
    },
    {
        name: "应用场景",
        subtitle: "多元医疗业务创新应用",
        color: "#ef4444",
        bg: "#fffdfd",
        buttons: [
            { title: "质量控制", icon: "📈", desc: "全流程医疗质量监控，支持多维度统计与预警。", route: "/scene/quality" },
            { title: "临床路径监管", icon: "🩺", desc: "监管临床路径执行，提升诊疗规范与效率。", route: "/workflows" },
            { title: "主动理赔", icon: "💰", desc: "自动化理赔流程，提升理赔效率与合规性。", route: "/scene/claim" },
            { title: "多中心诊疗", icon: "🏥", desc: "多机构协作诊疗，促进医疗资源共享与互通。", route: "/scene/multicenter" },
        ],
    },
];
// 路由已合并到GROUPS配置中


const MedGuideCardGrid = (props) => {
    const history = useHistory();
    const [activeIdx, setActiveIdx] = useState(0); // 默认分组1
    const account = props.account;

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
                .mg-main-wrap { display: flex; width: 80%; height: 520px; background: #f7f8fa; border-radius: 18px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); margin: 0 auto; }
                .mg-group-list { width: 180px; background: #fff; border-radius: 18px 0 0 18px; box-shadow: 2px 0 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; }
                .mg-group-item { padding: 28px 0 28px 0; text-align: center; font-size: 18px; font-weight: 500; color: #888; cursor: pointer; border-left: 4px solid transparent; transition: all 0.2s; }
                .mg-group-item.active { font-weight: 700; }
                .mg-btn-list { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 40px 0 40px 60px; border-radius: 0 18px 18px 0; min-height: 480px; }
                .mg-btn-title { font-size: 22px; font-weight: bold; margin-bottom: 24px; }
                .mg-btns { display: flex; flex-wrap: wrap; gap: 18px 32px; }
                .mg-btn { min-width: 120px; height: 48px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(45,90,241,0.06); border: 1px solid #e3e7f1; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.18s; padding: 0 18px; }
                .mg-btn:hover { color: #fff; box-shadow: 0 4px 16px rgba(45,90,241,0.13); }
                @media (max-width: 900px) { .mg-main-wrap { flex-direction: column; } .mg-group-list { flex-direction: row; width: 100%; border-radius: 18px 18px 0 0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); } .mg-group-item { border-left: none; border-top: 4px solid transparent; } .mg-group-item.active { border-left: none; border-top: 4px solid #2d5af1; } .mg-btn-list { padding: 24px 0 24px 0; align-items: center; } }
            `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);


    // 动态处理系统管理分组的部分按钮route
    const groups = GROUPS.map((g, idx) => {
        if (g.name === "系统管理" && account) {
            return {
                ...g,
                buttons: g.buttons.map(btn => {
                    if (btn.title === "用户管理") {
                        return { ...btn, route: Setting.getMyProfileUrl(account).replace("/account", "/users") };
                    }
                    if (btn.title === "权限管理") {
                        return { ...btn, route: Setting.getMyProfileUrl(account).replace("/account", "/permissions") };
                    }
                    return btn;
                })
            };
        }
        return g;
    });

    const handleGroupClick = idx => setActiveIdx(idx);
    const handleBtnClick = btnObj => {
        if (btnObj.route) {
            // 外链用window.open，内链用history
            if (/^https?:\/\//.test(btnObj.route)) {
                window.open(btnObj.route, '_blank');
            } else if (btnObj.route.startsWith("/")) {
                history.push(btnObj.route);
            } else {
                window.open(btnObj.route, '_blank');
            }
        }
    };

    // 当前分组色彩
    const activeGroup = groups[activeIdx];

    return (
        <div className="mg-main-wrap">
            <div className="mg-group-list">
                {groups.map((g, idx) => (
                    <div
                        key={g.name}
                        className={"mg-group-item" + (activeIdx === idx ? " active" : "")}
                        style={activeIdx === idx ? { color: g.color, background: g.bg, borderLeft: `4px solid ${g.color}` } : {}}
                        onMouseEnter={() => handleGroupClick(idx)}
                    >
                        {g.name}
                    </div>
                ))}
            </div>
            <div
                className="mg-btn-list"
                style={{
                    background: `linear-gradient(120deg, ${activeGroup.bg} 100%, #fff 100%)`,
                }}
            >
                <div className="mg-btn-title" style={{ color: activeGroup.color }}>{activeGroup.name}</div>
                {activeGroup.subtitle && (
                    <div style={{ fontSize: 15, color: '#bbb', fontWeight: 400, margin: '-16px 0 18px 0', lineHeight: 1.4 }}>{activeGroup.subtitle}</div>
                )}
                <div className="mg-btns" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px 20px',
                    width: '100%',
                    justifyItems: 'center',
                    paddingRight: '32px',
                }}>
                    {activeGroup.buttons.map(btnObj => (
                        <div
                            key={btnObj.title}
                            className="mg-btn mg-btn-card"
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                width: '100%',
                                minWidth: 0,
                                maxWidth: 340,
                                aspectRatio: '16/9',
                                height: 'auto',
                                padding: '18px 18px 14px 18px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.14s, border 0.16s, transform 0.16s cubic-bezier(.4,2,.6,1)',
                                border: '2px solid #fff',
                                overflow: 'hidden',
                            }}
                            onClick={() => handleBtnClick(btnObj)}
                            onMouseOver={e => {
                                e.currentTarget.style.boxShadow = `0 10px 24px 0 ${activeGroup.color}33`;
                                e.currentTarget.style.border = `2px solid ${activeGroup.color}`;
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                const arrow = e.currentTarget.querySelector('.mg-card-arrow');
                                if (arrow) {
                                    arrow.style.opacity = '1';
                                    arrow.style.transform = 'translateX(0)';
                                }
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.06)';
                                e.currentTarget.style.border = '2px solid #fff';
                                e.currentTarget.style.transform = 'translateY(0)';
                                const arrow = e.currentTarget.querySelector('.mg-card-arrow');
                                if (arrow) {
                                    arrow.style.opacity = '0';
                                    arrow.style.transform = 'translateX(24px)';
                                }
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 6 }}>
                                <div style={{ flex: '0 0 48px', width: 48, aspectRatio: '1/1', borderRadius: 12, background: activeGroup.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' }}>
                                    <span style={{ fontSize: 32, color: activeGroup.color, width: '70%', height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>{btnObj.icon}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: 20, color: '#222', marginBottom: 2 }}>{btnObj.title}</div>
                                    <div style={{ fontSize: 14, color: '#888', fontWeight: 400, marginTop: 0 }}>{btnObj.desc}</div>
                                </div>
                            </div>
                            <img
                                className="mg-card-arrow"
                                src={require('./assets/home/right-arrow.png')}
                                alt="right-arrow"
                                style={{
                                    position: 'absolute',
                                    right: 18,
                                    top: '50%',
                                    transform: 'translateY(-50%) translateX(24px)',
                                    width: 28,
                                    height: 28,
                                    opacity: 0,
                                    transition: 'all 0.32s cubic-bezier(.4,2,.6,1)',
                                    pointerEvents: 'none',
                                    zIndex: 10,
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                width: '100%',
                                borderTop: '1px solid #f0f0f0',
                                marginTop: 'auto',
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                background: '#fff',
                                borderRadius: '0 0 16px 16px',
                                overflow: 'hidden',
                            }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        border: 'none',
                                        background: '#fff',
                                        color: '#888',
                                        fontWeight: 500,
                                        fontSize: 15,
                                        cursor: 'pointer',
                                        transition: 'color 0.18s',
                                        outline: 'none',
                                    }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (btnObj.introRoute) {
                                            history.push(btnObj.introRoute);
                                        } else {
                                            alert('功能介绍未搭建');
                                        }
                                    }}
                                >功能介绍</button>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        border: 'none',
                                        background: '#fff',
                                        color: activeGroup.color,
                                        fontWeight: 600,
                                        fontSize: 15,
                                        cursor: 'pointer',
                                        transition: 'color 0.18s',
                                        outline: 'none',
                                    }}
                                    onClick={e => { e.stopPropagation(); handleBtnClick(btnObj); }}
                                >开始使用</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MedGuideCardGrid;

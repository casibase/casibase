import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

// 分组与按钮数据
const GROUPS = [
    {
        name: "系统管理",
        color: "#2d5af1",
        bg: "#fcfdff",
        buttons: [
            { title: "系统设置", icon: "⚙️", desc: "平台参数配置", route: "/system/settings" },
            { title: "资源状态", icon: "📊", desc: "各类资源监控", route: "/system/resources" },
            { title: "用户管理", icon: "👤", desc: "账号与角色", route: "/system/users" },
            { title: "权限管理", icon: "🔑", desc: "访问与操作权限", route: "/system/permissions" },
        ],
    },
    {
        name: "数据管理",
        color: "#10b981",
        bg: "#fcfefd",
        buttons: [
            { title: "患者上链数据", icon: "📝", desc: "患者数据上链明细", route: "/data/patient" },
            { title: "专病知识图谱", icon: "🧠", desc: "专病知识结构化", route: "/data/kg" },
        ],
    },
    {
        name: "上链服务",
        color: "#f59e42",
        bg: "#fffcfa",
        buttons: [
            { title: "医疗记录上联", icon: "📄", desc: "医疗文档上链", route: "/uplink/record" },
            { title: "数据操作上联", icon: "🔗", desc: "数据操作上链", route: "/uplink/data" },
            { title: "区块链浏览器", icon: "🌐", desc: "链上数据浏览", route: "/uplink/blockchain" },
            { title: "查询与审计", icon: "🔍", desc: "链上数据查询与审计", route: "/uplink/audit" },
        ],
    },
    {
        name: "共享服务",
        color: "#8b5cf6",
        bg: "#fdfbff",
        buttons: [
            { title: "图像超分", icon: "🖼️", desc: "医学影像超分辨率", route: "/share/sr" },
            { title: "受控使用", icon: "🛡️", desc: "数据受控访问", route: "/share/usage" },
            { title: "密文计算", icon: "🔒", desc: "隐私保护计算", route: "/share/crypto" },
            { title: "可信解密", icon: "🔓", desc: "安全可信解密", route: "/share/decrypt" },
        ],
    },
    {
        name: "应用场景",
        color: "#ef4444",
        bg: "#fffdfd",
        buttons: [
            { title: "质量控制", icon: "📈", desc: "医疗质量监控", route: "/scene/quality" },
            { title: "临床路径监管", icon: "🩺", desc: "路径执行监管", route: "/scene/pathway" },
            { title: "主动理赔", icon: "💰", desc: "理赔流程自动化", route: "/scene/claim" },
            { title: "多中心诊疗", icon: "🏥", desc: "多机构协作诊疗", route: "/scene/multicenter" },
        ],
    },
];

// 路由已合并到GROUPS配置中

const MedGuideCardGrid = () => {
    const history = useHistory();
    const [activeIdx, setActiveIdx] = useState(0); // 默认分组1

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
                .mg-main-wrap { display: flex; width: 80%; min-height: 480px; background: #f7f8fa; border-radius: 18px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); margin: 0 auto; }
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

    const handleGroupClick = idx => setActiveIdx(idx);
    const handleBtnClick = btnObj => {
        if (btnObj.route) history.push(btnObj.route);
    };

    // 当前分组色彩
    const activeGroup = GROUPS[activeIdx];

    return (
        <div className="mg-main-wrap">
            <div className="mg-group-list">
                {GROUPS.map((g, idx) => (
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
                <div className="mg-btns">
                    {activeGroup.buttons.map(btnObj => (
                        <div
                            key={btnObj.title}
                            className="mg-btn mg-btn-card"
                            style={{
                                borderColor: activeGroup.color,
                                color: activeGroup.color,
                                background: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                minWidth: 260,
                                maxWidth: 340,
                                aspectRatio: '16/9',
                                height: 'auto',
                                padding: '20px 24px 18px 24px',
                                boxSizing: 'border-box',
                                boxShadow: '0 2px 12px rgba(45,90,241,0.06)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onClick={() => handleBtnClick(btnObj)}
                            onMouseOver={e => {
                                e.currentTarget.style.background = activeGroup.color;
                                e.currentTarget.style.color = '#fff';
                                const icon = e.currentTarget.querySelector('.mg-btn-icon');
                                icon.style.background = '#fff8';
                                icon.style.color = activeGroup.color;
                                icon.style.width = '88px';
                                icon.style.height = '88px';
                                icon.style.fontSize = '48px';
                                icon.style.right = '6px';
                                icon.style.bottom = '2px';
                                icon.style.backdropFilter = 'blur(8px)';
                                icon.style.WebkitBackdropFilter = 'blur(8px)';
                                const inner = icon.querySelector('.mg-btn-icon-inner');
                                if (inner) inner.style.fontSize = '56px';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = activeGroup.color;
                                const icon = e.currentTarget.querySelector('.mg-btn-icon');
                                icon.style.background = activeGroup.bg + 'CC';
                                icon.style.color = activeGroup.color;
                                icon.style.width = '68px';
                                icon.style.height = '68px';
                                icon.style.fontSize = '38px';
                                icon.style.right = '14px';
                                icon.style.bottom = '10px';
                                icon.style.backdropFilter = 'blur(4px)';
                                icon.style.WebkitBackdropFilter = 'blur(4px)';
                                const inner = icon.querySelector('.mg-btn-icon-inner');
                                if (inner) inner.style.fontSize = '38px';
                            }}
                        >
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', zIndex: 2 }}>
                                <span style={{ fontWeight: 600, fontSize: 21 }}>{btnObj.title}</span>
                                <span style={{ fontSize: 15, color: 'inherit', opacity: 0.75, marginTop: 4 }}>{btnObj.desc}</span>
                            </span>
                            <span className="mg-btn-icon" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 68, height: 68, borderRadius: '50%', background: activeGroup.bg + 'CC', color: activeGroup.color, fontSize: 38, position: 'absolute', right: 14, bottom: 10, transition: 'all 0.28s cubic-bezier(.4,2,.6,1)', zIndex: 1, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
                            }}>
                                <span className="mg-btn-icon-inner" style={{ transition: 'all 0.28s cubic-bezier(.4,2,.6,1)', fontSize: 38 }}>{btnObj.icon}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MedGuideCardGrid;

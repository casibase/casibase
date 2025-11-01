
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import * as Setting from "./Setting";

// 分组与按钮数据
const GROUPS = [
    {
        name: "系统管理",
        subtitle: "平台基础配置与权限管理",
        color: "#23408e", // 深蓝
        bg: "#f6f8fb",
        buttons: [

            { title: "资源状态", icon: "💻", desc: "实时监控服务器运行状态，保障平台稳定。", route: "/sysinfo" },
            { title: "系统设置", icon: "⚙️", desc: "配置平台基础参数（如提供商等），定制系统行为。", route: "/stores" },
            { title: "用户管理", icon: "👤", desc: "集中管理所有用户账号、分配角色权限" },
            { title: "权限管理", icon: "🔑", desc: "灵活配置访问控制策略，细粒度分配操作与权限。" },
        ],
    },
    {
        name: "数据管理",
        subtitle: "数据全生命周期管理与分析",
        color: "#217867", // 稳重墨绿
        bg: "#f6fbf8",
        buttons: [
            { title: "数据总览", icon: "📊", desc: "全局展示平台内数据分布、趋势与共享情况。", route: "/dashboard" },

            { title: "专病知识图谱", icon: "🧠", desc: "构建专病知识结构，助力智能诊疗与科研分析。", route: "https://rws.neusoft.com:10100/medkb/#/login" },
        ],
    },
    {
        name: "上链服务",
        subtitle: "医疗数据可信上链与审计",
        color: "#b97a2a", // 稳重棕金
        bg: "#f9f7f3",
        buttons: [
            { title: "医疗记录上链", icon: "📄", desc: "将医疗数据高效上链，数据不可篡改可追溯。", route: "/ipfs-archive", introRoute: "/introduce/medical-record-chain" },
            { title: "数据操作上链", icon: "🔗", desc: "各类数据操作全流程长脸，提升数据可信。", route: "/records" },
            { title: "区块链浏览器", icon: "🌐", desc: "可视化浏览链上数据，支持多条件筛选与溯源。", route: "http://192.168.0.228:9996/chain1/home" },
            // { title: "区块链浏览器", icon: "🌐", desc: "可视化浏览链上数据，支持多条件筛选与溯源。", route: "/forms/区块链浏览器/data" },
            { title: "病例数据", icon: "🗒", desc: "可视化病例数据上传，支持批量导入", route: "/med-records" },
            { title: "查询与审计", icon: "🔍", desc: "查看患者的上链数据明细，支持检索与追溯。", route: "/ipfs-search", introRoute: "/introduce/patient-chain-data" },
        ],
    },
    {
        name: "共享服务",
        subtitle: "数据共享与隐私保护",
        color: "#5a4697", // 稳重紫
        bg: "#f7f6fa",
        buttons: [
            { title: "医疗影像分析", icon: "📸", desc: "AI驱动医学影像检测、分割与辅助诊断。", route: "/yolov8mi" },
            { title: "受控使用", icon: "🛡️", desc: "实现数据分级授权与受控访问，保障数据安全。", route: "/share/usage" },
            { title: "密文计算", icon: "🧮", desc: "支持隐私保护计算，数据加密流转与分析。", route: "/forms/密文计算/data" },
            { title: "SM9-IPFE", icon: "🔐", desc: "支持SM9-IPFE，保障数据安全与合规。", route: "/forms/SM9-IPFE/data" },
            // { title: "可信联邦", icon: "🤝", desc: "安全可信的数据解密服务，合规可控。", route: "/forms/联邦学习/data" },
            { title: "可信联邦", icon: "🤝", desc: "安全可信的数据解密服务，合规可控。", route: "http://172.25.77.152/" },
        ],
    },
    {
        name: "应用场景",
        subtitle: "多元医疗业务创新应用",
        color: "#a03a3a", // 稳重酒红
        bg: "#fcf7f7",
        buttons: [
            { title: "协同诊疗", icon: "📈", desc: "提升医学影像分辨率，助力精准诊断与科研。", route: "/sr" },
            { title: "临床路径监管", icon: "🩺", desc: "监管临床路径执行，提升诊疗规范与效率。", route: "/workflows" },
            { title: "主动理赔", icon: "💰", desc: "自动化理赔流程，提升理赔效率与合规性。", route: "/scene/claim" },
            { title: "多中心科研", icon: "🏥", desc: "多机构协作科研，促进医疗科研资源共享与互通。", route: "/multi-center" },
        ],
    },
];
// 路由已合并到GROUPS配置中


const MedGuideCardGrid = (props) => {
    const history = useHistory();
    const account = props.account;

    // 根据用户标签过滤按钮，隐藏特定按钮给不同标签用户
    const filterButtonsByUserTag = (buttons) => {
        const userTag = account?.tag || '';
        const isAdmin = account?.isAdmin || account?.type === "chat-admin";

        return buttons.filter(button => {
            // 区块链浏览器 - 需要管理员权限且不是 user/doctor 标签
            if (button.title === "区块链浏览器") {
                const canViewBlockchainExplorer = isAdmin && userTag !== 'user' && userTag !== 'doctor';
                return canViewBlockchainExplorer;
            }
            // 可信联邦 - 需要管理员权限且不是 user 标签
            if (button.title === "可信联邦") {
                const canViewTrustFederation = isAdmin && userTag !== 'user';
                return canViewTrustFederation;
            }
            // 专病知识图谱 - 不是 user 标签
            if (button.title === "专病知识图谱") {
                const canViewKnowledgeGraph = userTag !== 'user';
                return canViewKnowledgeGraph;
            }
            // 用户管理 - 不是 user 和 doctor 标签
            if (button.title === "用户管理") {
                const canViewUserManagement = userTag !== 'user' && userTag !== 'doctor';
                return canViewUserManagement;
            }
            // 权限管理 - 需要管理员权限且不是 user 和 doctor 标签
            if (button.title === "权限管理") {
                const canViewPermissionManagement = isAdmin && userTag !== 'user' && userTag !== 'doctor';
                return canViewPermissionManagement;
            }
            // 资源管理 - 不是 user 和 doctor 标签（如果有这个按钮的话）
            if (button.title === "资源管理") {
                const canViewResourceManagement = userTag !== 'user' && userTag !== 'doctor';
                return canViewResourceManagement;
            }
            // 其他按钮正常显示
            return true;
        });
    };

    // 创建过滤后的分组数据并扁平化为一个按钮列表（不再按小分组展示）
    const filteredGroups = GROUPS.map(group => ({
        ...group,
        buttons: filterButtonsByUserTag(group.buttons)
    }));
    const flatButtons = filteredGroups.reduce((acc, g) => acc.concat(g.buttons || []), []);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
                /* 主容器：自适应宽度，高度随内容扩展，设置最大宽度并居中 */
                .mg-main-wrap { display: flex; width: calc(100% - 80px); max-width: 1240px; min-width: 320px; background: #f7f8fa; border-radius: 18px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); margin: 24px auto; box-sizing: border-box; padding: 20px; }
                /* 隐藏旧的分组列样式（保持兼容） */
                .mg-group-list { display: none; }
                .mg-group-item { display: none; }
                /* 按钮容器：允许内部滚动并使用响应式网格 */
                .mg-btn-list { flex: 1; display: block; padding: 12px 20px; border-radius: 12px; min-height: 240px; box-sizing: border-box; overflow: visible; }
                .mg-btn-title { font-size: 22px; font-weight: bold; margin-bottom: 12px; }
                .mg-btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
                .mg-btn { background: #fff; border-radius: 16px; box-shadow: 0 6px 18px rgba(18,35,85,0.06); border: 1px solid #f0f2f7; display: flex; flex-direction: column; padding: 18px; box-sizing: border-box; cursor: pointer; transition: transform 0.16s, box-shadow 0.16s; }
                .mg-btn:hover { transform: translateY(-6px); }
                /* 卡片内部布局限制，避免超高 */
                .mg-btn .mg-card-arrow { transition: all 0.32s cubic-bezier(.4,2,.6,1); }
                @media (max-width: 900px) { .mg-main-wrap { width: calc(100% - 32px); padding: 12px; flex-direction: column; } .mg-btn-list { padding: 12px; } .mg-btns { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; } }
            `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);


    // 动态处理分组按钮：设置路由和根据用户标签过滤按钮（平铺）
    const groups = GROUPS.map((g) => {
        let processedGroup = { ...g };

        // 处理系统管理分组的路由
        if (g.name === "系统管理" && account) {
            processedGroup = {
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

        // 对所有分组应用按钮过滤（隐藏区块链浏览器给特定标签用户）
        processedGroup = {
            ...processedGroup,
            buttons: filterButtonsByUserTag(processedGroup.buttons)
        };

        return processedGroup;
    });

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

    // 取首个分组作为默认主题色（用于按钮样式）
    const primaryGroup = groups[0] || { color: '#23408e', bg: '#f6f8fb' };

    return (
        <div className="mg-main-wrap">
            <div
                className="mg-btn-list"
                style={{
                    background: `linear-gradient(120deg, ${primaryGroup.bg} 100%, #fff 100%)`,
                    width: '100%'
                }}
            >
                <div className="mg-btn-title" style={{ color: primaryGroup.color }}>{/* 去掉分组标题，保持留白 */}</div>
                <div className="mg-btns" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    width: '100%',
                    justifyItems: 'center',
                    paddingRight: '32px',
                }}>
                    {flatButtons.map(btnObj => (
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
                                e.currentTarget.style.boxShadow = `0 10px 24px 0 ${primaryGroup.color}33`;
                                e.currentTarget.style.border = `2px solid ${primaryGroup.color}`;
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
                                <div style={{ flex: '0 0 48px', width: 48, aspectRatio: '1/1', borderRadius: 12, background: primaryGroup.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' }}>
                                    <span style={{ fontSize: 32, color: primaryGroup.color, width: '70%', height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>{btnObj.icon}</span>
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
                                {!btnObj.introRoute ? null : <button
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
                                >功能介绍</button>}
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        border: 'none',
                                        background: '#fff',
                                        color: primaryGroup.color,
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

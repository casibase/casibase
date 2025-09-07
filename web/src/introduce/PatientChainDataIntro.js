
import React from "react";

const steps = [
    {
        title: "1. 数据采集",
        desc: "在医院或医疗机构内，系统自动或人工采集患者的诊疗、检查、检验等原始数据。数据需经过标准化处理，确保结构化与合规性。"
    },
    {
        title: "2. 数据脱敏与加密",
        desc: "对采集到的患者数据进行脱敏处理，去除个人隐私标识，并采用加密算法保障数据传输与存储安全。"
    },
    {
        title: "3. 匹配区块链格式",
        desc: "将脱敏后的数据转换为区块链平台所需的数据结构，生成唯一数据摘要（Hash），确保数据不可篡改。"
    },
    {
        title: "4. 上链操作",
        desc: "通过智能合约或API接口，将数据摘要及必要元数据写入区块链，实现数据上链。系统自动记录上链时间、操作人等关键信息。"
    },
    {
        title: "5. 数据验证与追溯",
        desc: "上链后，任何授权用户均可通过区块链浏览器或平台界面，验证数据真实性，并支持全流程追溯。"
    }
];

export default function PatientChainDataIntro() {
    return (
        <div style={{ width: "100%", minHeight: 600, background: "#f7f8fa" }}>
            {/* 顶部深色渐变横幅 */}
            <div
                style={{
                    width: "100%",
                    minHeight: 320,
                    background: "linear-gradient(90deg, #23243a 0%, #2d3a5a 60%, #3a4a6d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 0 0 64px",
                    boxSizing: "border-box"
                }}
            >
                {/* 左侧文字 */}
                <div style={{ flex: 1, minWidth: 0, color: "#fff", padding: "0 0 0 0" }}>
                    <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 18, letterSpacing: 1 }}>患者上链数据</div>
                    <div style={{ fontSize: 18, color: "#e5e7eb", marginBottom: 32, lineHeight: 1.8, maxWidth: 540 }}>
                        患者上链数据功能，旨在将医疗机构采集的患者诊疗数据进行标准化、脱敏、加密处理后，安全高效地写入区块链，实现数据的不可篡改、可追溯与合规共享。平台严格遵循国家及行业数据安全规范，保障患者隐私与数据安全。
                    </div>
                </div>
                {/* 右侧插图 */}
                <div style={{ flex: "0 0 380px", height: 260, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 64 }}>
                    {/* 可替换为SVG或图片 */}
                    <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="40" width="220" height="140" rx="24" fill="#fff" fillOpacity="0.08" />
                        <rect x="40" y="60" width="180" height="100" rx="18" fill="#fff" fillOpacity="0.13" />
                        <rect x="60" y="80" width="140" height="60" rx="12" fill="#fff" fillOpacity="0.18" />
                        <circle cx="130" cy="110" r="32" fill="#fff" fillOpacity="0.22" />
                        <path d="M130 90v20l14 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <text x="130" y="120" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" opacity="0.8">区块链</text>
                    </svg>
                </div>
            </div>
            {/* 下方白色介绍区块 */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: 18,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                    maxWidth: 900,
                    margin: "-60px auto 0 auto",
                    padding: "40px 48px 32px 48px",
                    position: "relative",
                    zIndex: 2
                }}
            >
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: "#23243a" }}>操作步骤</div>
                <ol style={{ paddingLeft: 24, color: "#3a4a6d", fontSize: 16 }}>
                    {steps.map(step => (
                        <li key={step.title} style={{ marginBottom: 18 }}>
                            <div style={{ fontWeight: 600, fontSize: 16, color: "#23243a", marginBottom: 4 }}>{step.title}</div>
                            <div style={{ lineHeight: 1.7 }}>{step.desc}</div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

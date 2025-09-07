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
        <div style={{
            background: "#181A20",
            minHeight: 480,
            color: "#fff",
            borderRadius: 18,
            boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
            padding: "48px 48px 32px 48px",
            maxWidth: 900,
            margin: "40px auto"
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 18 }}>患者上链数据</div>
                    <div style={{ fontSize: 16, color: "#d1d5db", marginBottom: 32, lineHeight: 1.7 }}>
                        患者上链数据功能，旨在将医疗机构采集的患者诊疗数据进行标准化、脱敏、加密处理后，安全高效地写入区块链，实现数据的不可篡改、可追溯与合规共享。平台严格遵循国家及行业数据安全规范，保障患者隐私与数据安全。
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>操作步骤</div>
                    <ol style={{ paddingLeft: 24, color: "#e5e7eb", fontSize: 15 }}>
                        {steps.map(step => (
                            <li key={step.title} style={{ marginBottom: 18 }}>
                                <div style={{ fontWeight: 500, fontSize: 16, color: "#fff", marginBottom: 4 }}>{step.title}</div>
                                <div style={{ lineHeight: 1.7 }}>{step.desc}</div>
                            </li>
                        ))}
                    </ol>
                </div>
                <div style={{ flex: "0 0 240px", marginLeft: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>

                </div>
            </div>
        </div>
    );
}

import React, { Component } from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileMedical, faLock, faHistory, faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";

const dataSources = [
    {
        title: "门诊就诊记录",
        desc: "将患者在门诊就诊过程中产生的挂号、诊疗、检查、检验等文档高效上链，确保数据真实可信。",
        icon: faFileMedical,
        color: "#23408e"
    },
    {
        title: "住院诊疗数据",
        desc: "住院期间的诊疗、手术、护理、用药等全流程医疗文档均可安全上链，保障数据完整性。",
        icon: faLock,
        color: "#217867"
    },
    {
        title: "专病知识库数据",
        desc: "专病领域的诊疗、随访、科研等文档统一上链，助力专病管理与科研分析。",
        icon: faHistory,
        color: "#5a4697"
    },
    {
        title: "互联网医院就诊记录",
        desc: "线上问诊、处方、支付等互联网医疗文档同样支持高效上链，提升数据合规性。",
        icon: faCloudUploadAlt,
        color: "#b97a2a"
    },
];

const steps = [
    { title: "选择需上链的医疗文档", desc: "在归档队列中勾选待上链的医疗记录。" },
    { title: "发起上链操作", desc: "点击“添加”将选中文档提交至上链流程。" },
    { title: "区块链写入与归档", desc: "系统自动完成数据脱敏、加密并写入区块链，归档状态实时更新。" },
];

class MedicalRecordChainIntro extends Component {
    handleGoArchive = () => {
        this.props.history.push('/ipfs-archive');
    };

    render() {
        return (
            <div style={{ width: "100%", minHeight: 600, background: "#f7f8fa" }}>
                {/* 顶部深色渐变横幅 */}
                <div
                    style={{
                        width: "100%",
                        minHeight: 320,
                        background: "linear-gradient(90deg, #364fc7 0%, #3b5bdb 60%, #3a4a6d 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 0 0 64px",
                        boxSizing: "border-box"
                    }}
                >
                    {/* 左侧文字 */}
                    <div style={{ flex: 1, minWidth: 0, color: "#fff", padding: "0 0 0 0" }}>
                        <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 18, letterSpacing: 1 }}>医疗记录上链</div>
                        <div style={{ fontSize: 18, color: "#e5e7eb", marginBottom: 32, lineHeight: 1.8 }}>
                            医疗记录上链功能，支持将各类医疗文档（门诊、住院、专病、互联网医院等）高效、批量写入区块链，实现数据的不可篡改、可追溯与合规共享。平台自动完成数据脱敏、加密与归档，严格保障患者隐私与数据安全。
                        </div>
                    </div>
                    {/* 右侧按钮 */}
                    <div style={{ flex: "0 0 380px", height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginRight: 64 }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ArrowRightOutlined style={{ fontSize: 32 }} />}
                            style={{
                                fontSize: 20,
                                borderRadius: 20,
                                padding: "28px 32px",
                                marginTop: 32,
                                background: "white",
                                color: "#3a4a6d",
                                border: "none",
                                height: 40,
                                minWidth: 80,
                                boxShadow: "0 6px 24px rgba(58,74,109,0.13)"
                            }}
                            onClick={this.handleGoArchive}
                        >
                            开始使用
                        </Button>
                    </div>
                </div>
                {/* 数据源卡片 + 查询步骤卡片左右并排 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: 36,
                        width: '100%',
                        maxWidth: 1300,
                        margin: '-60px auto 0 auto',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    {/* 数据源卡片 */}
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 18,
                            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                            flex: 2.2,
                            minWidth: 0,
                            padding: "40px 48px 32px 48px",
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: "#23243a" }}>可上链医疗文档类型</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '28px 36px',
                            padding: '8px 0',
                            width: '100%'
                        }}>
                            {dataSources.map(ds => (
                                <div key={ds.title} style={{
                                    background: '#f7f8fa',
                                    borderRadius: 14,
                                    boxShadow: '0 2px 10px 0 rgba(45,90,241,0.06)',
                                    padding: '28px 28px 22px 28px',
                                    minHeight: 120,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    border: '1px solid #e3e7f1',
                                    gap: 22
                                }}>
                                    <div style={{
                                        width: 54,
                                        height: 54,
                                        borderRadius: '50%',
                                        background: ds.color + '22',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 18,
                                        flexShrink: 0
                                    }}>
                                        <FontAwesomeIcon icon={ds.icon} style={{ color: ds.color, fontSize: 28 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 700, fontSize: 18, color: '#23243a', marginBottom: 10 }}>{ds.title}</div>
                                        <div style={{ fontSize: 15, color: '#3a4a6d', lineHeight: 1.7 }}>{ds.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* 步骤卡片 */}
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 18,
                            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                            flex: 1,
                            minWidth: 0,
                            padding: "32px 40px 24px 40px",
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 20, color: '#23243a', marginBottom: 18 }}>上链操作步骤</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                            {steps.map((step, idx) => (
                                <div key={step.title} style={{
                                    background: '#f3f4f6',
                                    borderRadius: 12,
                                    boxShadow: '0 1px 6px 0 rgba(45,90,241,0.04)',
                                    padding: '18px 20px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 16,
                                    borderLeft: `5px solid ${['#23408e', '#217867', '#b97a2a'][idx] || '#5a4697'}`
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: '#23243a', minWidth: 80 }}>{`步骤${idx + 1}`}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#23243a', marginBottom: 4 }}>{step.title}</div>
                                        <div style={{ fontSize: 14, color: '#3a4a6d', lineHeight: 1.6 }}>{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* 操作提示 */}
                        <div style={{ marginTop: 32, color: '#b91c1c', fontSize: 15, fontWeight: 600, textAlign: 'right' }}>
                            所有上链操作均会被记录。
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MedicalRecordChainIntro;

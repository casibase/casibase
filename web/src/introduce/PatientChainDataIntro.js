import React, { Component } from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStethoscope, faHospital, faBookMedical, faClinicMedical } from "@fortawesome/free-solid-svg-icons";


const dataSources = [
    {
        title: "门诊就诊记录",
        desc: "包含患者在各医疗机构的门诊挂号、诊疗、检查、检验等上链数据。支持通过身份证号检索门诊索引，并可进一步查询每条门诊记录的详细信息。",
        icon: faStethoscope,
        color: "#2d5af1"
    },
    {
        title: "住院诊疗数据",
        desc: "涵盖患者住院期间的诊疗、手术、护理、用药等全流程上链数据。可按身份证号获取住院索引，支持对单次住院的所有明细数据进行深入查询。",
        icon: faHospital,
        color: "#10b981"
    },
    {
        title: "专病知识库数据",
        desc: "聚合患者在专病领域的诊疗、随访、科研等上链数据。通过身份证号可检索专病知识库相关索引，并可查看每条专病数据的详细内容。",
        icon: faBookMedical,
        color: "#f59e42"
    },
    {
        title: "互联网医院就诊记录",
        desc: "记录患者在互联网医院的在线问诊、处方、支付等上链数据。支持身份证号检索互联网医院索引，并可查询每次线上就诊的详细信息。",
        icon: faClinicMedical,
        color: "#8b5cf6"
    },
];

// 步骤卡片数据
const steps = [
    { title: "输入患者身份证号", desc: "在查询框中输入需检索的患者身份证号码。" },
    { title: "获取归档数据信息", desc: "系统自动检索该患者的所有归档数据索引。" },
    { title: "选择归档记录深入查询", desc: "点击需查询的归档记录，查看详细诊疗数据。" },
];

class PatientChainDataIntro extends Component {
    constructor(props) {
        super(props);
        this.handleIpfsSearch = this.handleIpfsSearch.bind(this);
    }

    handleIpfsSearch() {
        this.props.history.push('/ipfs-search');
    }

    render() {

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
                        <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 18, letterSpacing: 1 }}>查询与审计</div>
                        <div style={{ fontSize: 18, color: "#e5e7eb", marginBottom: 32, lineHeight: 1.8 }}>
                            查询与审计功能，旨在将医疗机构采集的患者诊疗数据进行标准化、脱敏、加密处理后，安全高效地写入区块链，实现数据的不可篡改、可追溯与合规共享。平台严格遵循国家及行业数据安全规范，保障患者隐私与数据安全。
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
                            onClick={this.handleIpfsSearch}
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
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: "#23243a" }}>可查询四类上链数据源</div>
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
                    {/* 查询步骤卡片 */}
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
                        <div style={{ fontWeight: 700, fontSize: 20, color: '#23243a', marginBottom: 18 }}>查询步骤</div>
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
                                    borderLeft: `5px solid ${['#2d5af1', '#10b981', '#f59e42'][idx] || '#8b5cf6'}`
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: '#23243a', minWidth: 80 }}>{`步骤${idx + 1}`}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#23243a', marginBottom: 4 }}>{step.title}</div>
                                        <div style={{ fontSize: 14, color: '#3a4a6d', lineHeight: 1.6 }}>{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* 查询操作提示 */}
                        <div style={{ marginTop: 32, color: '#b91c1c', fontSize: 15, fontWeight: 600, textAlign: 'right' }}>
                            所有查询操作均会被记录。
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PatientChainDataIntro;
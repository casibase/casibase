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
                        <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 18, letterSpacing: 1 }}>患者上链数据</div>
                        <div style={{ fontSize: 18, color: "#e5e7eb", marginBottom: 32, lineHeight: 1.8 }}>
                            患者上链数据功能，旨在将医疗机构采集的患者诊疗数据进行标准化、脱敏、加密处理后，安全高效地写入区块链，实现数据的不可篡改、可追溯与合规共享。平台严格遵循国家及行业数据安全规范，保障患者隐私与数据安全。
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
            </div>
        );
    }
}

export default PatientChainDataIntro;
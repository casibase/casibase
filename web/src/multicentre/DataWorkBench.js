import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Progress, Alert, Dropdown, Menu, Segmented, Result, Spin, message, Modal } from "antd";
import * as MultiCenterBackend from "../backend/MultiCenterBackend";
import { DownOutlined } from '@ant-design/icons';
import { Clock, Database, ShieldCheck, Link2, Image } from 'lucide-react';

const usageId = "use_test_001"
const datasetId = "MCTest1"

const columns = [
    { title: '患者ID', dataIndex: 'id', key: 'id' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '主要诊断', dataIndex: 'diagnosis', key: 'diagnosis' },
    { title: '入院日期', dataIndex: 'admitDate', key: 'admitDate' },
    { title: '射血分数', dataIndex: 'ef', key: 'ef', render: v => v + '%' },
    {
        title: '状态', dataIndex: 'status', key: 'status',
        render: v => {
            if (v === '已出院') return <Tag color="#bfbfbf">已出院</Tag>;
            if (v === '住院中') return <Tag color="#428be5" style={{ fontWeight: 600 }}>住院中</Tag>;
            if (v === '随访中') return <Tag color="#52c41a">随访中</Tag>;
            return v;
        }
    },
];

const data = [
    { id: 'P001', age: 65, gender: '男', diagnosis: '急性心肌梗死', admitDate: '2024-01-10', ef: 45, status: '已出院' },
    { id: 'P002', age: 58, gender: '女', diagnosis: '不稳定性心绞痛', admitDate: '2024-01-08', ef: 52, status: '住院中' },
    { id: 'P003', age: 72, gender: '男', diagnosis: '心房颤动', admitDate: '2024-01-05', ef: 38, status: '已出院' },
    { id: 'P004', age: 61, gender: '女', diagnosis: '心力衰竭', admitDate: '2024-01-03', ef: 35, status: '已出院' },
    { id: 'P005', age: 69, gender: '男', diagnosis: '冠心病', admitDate: '2024-01-01', ef: 48, status: '随访中' },
];

export default function DataWorkBench(props) {
    const { account } = props;
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    const [showTable, setShowLimitData] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [usageLoading, setUsageLoading] = useState(false);
    // 只存储 'structured' 或 'image'
    const [selectedData, setSelectedData] = useState('structured');
    const [checkingModal, setCheckingModal] = useState(false);
    // 图片预览相关
    const [previewImg, setPreviewImg] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const menu = (
        <Menu onClick={() => { }}>
            <Menu.Item key="cvd">心血管疾病数据</Menu.Item>
        </Menu>
    );
    // 你现在可以在组件内直接使用 accounts 变量
    // 例如：console.log(accounts);


    // 抽离数据用量信息请求逻辑
    const fetchUsageInfo = async () => {
        setUsageLoading(true);
        try {
            // 等待1s
            await new Promise(resolve => setTimeout(resolve, 1500));
            const resp = await MultiCenterBackend.queryDataSetsUsage(usageId);
            let info = null;
            if (resp?.data?.resultDecoded) {
                try {
                    info = JSON.parse(resp.data.resultDecoded);
                } catch (e) { }
            }
            setUsageInfo(info);
        } finally {
            setUsageLoading(false);
        }
    };

    // 点击确认查看时调用useDataSet
    const handleShowLimitData = async () => {
        setCheckingModal(true);
        try {
            // 等待1s
            await new Promise(resolve => setTimeout(resolve, 1000));
            const resp = await MultiCenterBackend.useDataSet(usageId, datasetId);
            const status = resp?.status?.toLowerCase?.() || resp?.data?.status?.toLowerCase?.();
            if (status === 'success' || status === 'ok') {
                setShowLimitData(true);
                fetchUsageInfo();
                // 等待2s后异步发送
                setTimeout(() => {
                    MultiCenterBackend.addDataUsageAuditRecord(account, usageId, datasetId);
                }, 2000);
            } else {
                message.error(resp?.msg || '操作失败');
            }
        } catch (e) {
            message.error(e?.message || '操作异常');
        } finally {
            setCheckingModal(false);
        }
    };



    useEffect(() => {
        // 页面加载时只调用一次
        fetchUsageInfo();
    }, []);

    return (
        <div style={{ background: 'white', minHeight: '100vh', padding: 32 }}>
            {/* 顶部卡片区 */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    flex: 1,
                    padding: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    minWidth: 260,
                    border: '1.5px solid #dbe6f2',
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                    title="点击可刷新用量信息"
                    onClick={() => !usageLoading && fetchUsageInfo()}
                >
                    <Clock size={32} color="#428be5" />
                    <div>
                        <div style={{ color: '#888', fontSize: 16 }}>访问时间截止至 </div>
                        {usageLoading ? (
                            <Spin size="small" style={{ marginTop: 4 }} />
                        ) : usageInfo ? (
                            <div style={{ color: '#428be5', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{usageInfo.ExpireTime}</div>
                        ) : (
                            <div style={{ color: '#428be5', fontWeight: 700, fontSize: 22, marginTop: 4 }}>--</div>
                        )}
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    flex: 1,
                    padding: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    minWidth: 260,
                    border: '1.5px solid #dbe6f2',
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                    title="点击可刷新用量信息"
                    onClick={() => !usageLoading && fetchUsageInfo()}
                >
                    <Database size={32} color="#428be5" />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#888', fontSize: 16 }}>剩余数据查询次数 </div>
                        {usageLoading ? (
                            <Spin size="small" style={{ marginTop: 4 }} />
                        ) : usageInfo ? (
                            <div style={{ color: '#23408e', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{usageInfo.UseCountLeft}</div>
                        ) : (
                            <div style={{ color: '#23408e', fontWeight: 700, fontSize: 22, marginTop: 4 }}>--</div>
                        )}
                        {/* <Progress percent={15} showInfo={false} strokeColor="#428be5" style={{ marginTop: 6, width: 120 }} /> */}
                    </div>
                </div>
                <div style={{
                    background: 'transparent',
                    borderRadius: 16,
                    flex: 1,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 18,
                    minWidth: 260,
                    justifyContent: 'space-between',
                    border: 'none',
                    boxShadow: 'none'
                }}>
                    <div
                        style={{
                            flex: 1,
                            background: '#f6faff',
                            borderRadius: 14,
                            border: '1.5px solid #dbe6f2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '18px 20px',
                            cursor: 'pointer',
                            transition: 'box-shadow .2s',
                            boxShadow: '0 2px 8px 0 rgba(66,139,229,0.06)'
                        }}
                        onClick={() => history && history.push && history.push('/multi-center/audit-log')}
                    >
                        <ShieldCheck size={32} color="#428be5" />
                        <div>
                            <div style={{ color: '#23408e', fontWeight: 700, fontSize: 17, marginBottom: 2, whiteSpace: 'nowrap' }}>数据审计记录</div>
                            <div style={{ color: '#888', fontSize: 14 }}>区块链全程追溯</div>
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            background: '#f6faff',
                            borderRadius: 14,
                            border: '1.5px solid #dbe6f2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '18px 20px',
                            cursor: 'pointer',
                            transition: 'box-shadow .2s',
                            boxShadow: '0 2px 8px 0 rgba(66,139,229,0.06)'
                        }}
                        onClick={() => history && history.push && history.push('/multi-center')}
                    >
                        <Link2 size={32} color="#428be5" />
                        <div>
                            <div style={{ color: '#23408e', fontWeight: 700, fontSize: 17, marginBottom: 2, whiteSpace: 'nowrap' }}>我的科研项目</div>
                            <div style={{ color: '#888', fontSize: 14 }}>多中心协作管理</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 表格区块 */}

            <div style={{
                background: '#fff',
                borderRadius: 8,
                padding: 28,
                marginBottom: 24,
                border: '1.5px solid #f1f3f5',
                boxShadow: 'none',
                minHeight: 120
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ fontSize: 22, fontWeight: 700 }}>心血管疾病数据</span>
                            <Dropdown overlay={menu} trigger={["click"]}>
                                <Button type="text" style={{ marginLeft: 4, boxShadow: 'none', border: 'none' }}>
                                    <DownOutlined style={{ fontSize: 12, marginLeft: 0 }} />
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                    <Tag color="#20c997" style={{ fontSize: 16, padding: '2px 14px', borderRadius: 16, fontWeight: 500, marginLeft: 16, verticalAlign: 'middle' }}>
                        <ShieldCheck size={16} style={{ marginRight: 4, verticalAlign: -2 }} /> 安全访问中
                    </Tag>
                </div>
                {!showTable && (
                    <div>
                        <Result
                            status="warning"
                            title="本数据为受控数据，将会记录一次访问"
                            extra={
                                <Button type="primary" onClick={handleShowLimitData} style={{ marginTop: 24 }}>确认查看</Button>
                            }
                        />
                        <Modal
                            open={checkingModal}
                            footer={null}
                            closable={false}
                            centered
                            maskClosable={false}
                            keyboard={false}
                            bodyStyle={{ textAlign: 'center', padding: 32 }}
                        >
                            <Spin size="large" style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>正在进行受控数据权限检查及记录…</div>
                        </Modal>
                    </div>
                )}
                {showTable && (
                    <div>
                        <Segmented
                            options={[
                                {
                                    label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Database size={20} />结构化数据</span>,
                                    value: 'structured',
                                },
                                {
                                    label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Image size={20} />医疗影像</span>,
                                    value: 'image',
                                },
                            ]}
                            block
                            style={{ width: '100%', marginBottom: 18 }}
                            value={selectedData}
                            onChange={setSelectedData}
                        />
                        {selectedData === 'image' ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 32,
                                    marginTop: 8,
                                    minHeight: 200
                                }}>
                                    {/* 示例影像卡片数据，可替换为真实数据 */}
                                    {[
                                        { id: 'ECG001', patient: 'P001', date: '2025-09-10', src: './sample/sample_hr_input.png' },
                                        { id: 'ECG002', patient: 'P002', date: '2025-09-08', src: './sample/sample_lr_input.png' },
                                        { id: 'ECHO001', patient: 'P001', date: '2025-09-11', src: './sample/sample_hr_input.png' }
                                    ].map(item => (
                                        <div key={item.id} style={{
                                            width: 240,
                                            background: '#fff',
                                            borderRadius: 18,
                                            boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                                            border: '1.5px solid #e6eaf1',
                                            padding: 18,
                                            marginBottom: 8,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            position: 'relative',
                                        }}>
                                            <div style={{
                                                width: 180,
                                                height: 120,
                                                background: '#111',
                                                borderRadius: 12,
                                                marginBottom: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}>
                                                {(() => {
                                                    let imgSrc = '';
                                                    try {
                                                        imgSrc = require(`${item.src}`);
                                                    } catch (e) {
                                                        imgSrc = '';
                                                    }
                                                    return (
                                                        <img
                                                            src={imgSrc}
                                                            alt={item.id}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, opacity: 0.85 }}
                                                            onClick={() => { setPreviewImg(imgSrc); setPreviewOpen(true); }}
                                                        />
                                                    );
                                                })()}
                                                <span style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    background: '#f5f6fa',
                                                    color: '#428be5',
                                                    borderRadius: 8,
                                                    padding: '2px 12px',
                                                    fontSize: 15,
                                                    fontWeight: 500,
                                                    pointerEvents: 'none'
                                                }}>低分辨率</span>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{item.id}</div>
                                            <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>患者: {item.patient} | 日期: {item.date}</div>
                                            <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
                                                <Button icon={<span role="img" aria-label="eye">👁️</span>} style={{ fontWeight: 500, borderRadius: 8, borderColor: '#e6eaf1', color: '#222', background: '#fff' }}
                                                    onClick={() => {
                                                        let imgSrc = '';
                                                        try {
                                                            imgSrc = require(`${item.src}`);
                                                        } catch (e) {
                                                            imgSrc = '';
                                                        }
                                                        setPreviewImg(imgSrc);
                                                        setPreviewOpen(true);
                                                    }}
                                                >查看</Button>
                                                <Button icon={<span role="img" aria-label="ai">🪄</span>} style={{ fontWeight: 500, borderRadius: 8, background: 'linear-gradient(90deg,#a259e4 0%,#f857a6 100%)', color: '#fff', border: 'none' }}>AI超分</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Modal
                                    open={previewOpen}
                                    footer={null}
                                    onCancel={() => setPreviewOpen(false)}
                                    centered
                                    bodyStyle={{ padding: 0, background: '#111', textAlign: 'center' }}
                                    width={600}
                                >
                                    {previewImg && (
                                        <img src={previewImg} alt="预览" style={{ maxWidth: '100%', maxHeight: 480, margin: '32px auto', display: 'block', borderRadius: 12 }} />
                                    )}
                                </Modal>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 18 }}>
                                    {usageLoading ? (
                                        <div ></div>
                                    ) : usageInfo ? (
                                        <div>
                                            {/* <div style={{ fontSize: 16, color: '#23408e', fontWeight: 600 }}>
                                                剩余可用次数：{usageInfo.UseCountLeft}
                                            </div>
                                            <div style={{ fontSize: 16, color: '#23408e', fontWeight: 600 }}>
                                                到期时间：{usageInfo.ExpireTime}
                                            </div> */}
                                        </div>
                                    ) : null}
                                </div>
                                <Table columns={columns} dataSource={data} pagination={false} bordered rowKey="id" style={{ marginTop: 18 }} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 安全提醒 */}
            <div style={{ background: '#fff7e6', borderRadius: 16, padding: 28, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <ShieldCheck size={28} color="#faad14" style={{ marginTop: 2 }} />
                <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#d48806', marginBottom: 4 }}>安全提醒</div>
                    <div style={{ color: '#444', fontSize: 16, lineHeight: 1.7 }}>
                        您的所有操作都在安全沙箱环境中进行，数据经过脱敏处理且不可导出。所有访问行为已记录在区块链上，确保全程可追溯。
                    </div>
                </div>
            </div>
        </div>
    );
}


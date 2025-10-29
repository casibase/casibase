import React, { useEffect, useState } from "react";
import { Input, Button, Tag, Spin, Timeline, Empty } from "antd";
import * as MultiCenterBackend from "../backend/MultiCenterBackend";
import { AlertCircle, Clock, Link2, ShieldCheck, CheckCircle2, Repeat2, Eye, User, Database } from 'lucide-react';
import dayjs from "dayjs";

const topRecordLen = 20;
export default function DataAuditLog() {
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    const [loading, setLoading] = useState(false);
    const [auditList, setAuditList] = useState([]);
    const [error, setError] = useState("");

    const fetchAudit = async () => {
        setLoading(true);
        setError("");
        try {
            // use getAuditUsage which returns similar shape
            const resp = await MultiCenterBackend.getAuditUsage();
            if (resp?.status === 'ok' && Array.isArray(resp.data)) {
                const sorted = resp.data.slice().sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
                // sorted只保留最近20条

                if (sorted.length > topRecordLen) {
                    sorted.splice(topRecordLen);
                }
                setAuditList(sorted);
            } else {
                setError(resp?.msg || '数据获取失败');
            }
        } catch (e) {
            setError(e?.message || '数据获取异常');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit();
    }, []);

    return (
        <div style={{ background: '#f7f9fb', minHeight: '100vh', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 38, fontWeight: 700 }}>区块链审计记录</div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="default"
                        size="large"
                        style={{ fontWeight: 500, borderRadius: 8, borderColor: '#dbe6f2', color: '#23408e', background: '#f6faff' }}
                        onClick={() => history && history.push && history.push('/multi-center')}
                    >我的科研项目</Button>
                    <Button
                        type="default"
                        size="large"
                        style={{ fontWeight: 500, borderRadius: 8, borderColor: '#dbe6f2', color: '#23408e', background: '#f6faff' }}
                        onClick={() => history && history.push && history.push('/multi-center/data-workbench')}
                    >数据工作台</Button>
                </div>
            </div>
            <div style={{ color: '#888ca0', fontSize: 18, marginBottom: 18 }}>
                所有数据访问和操作的不可篡改记录，确保全程透明可追溯
            </div>

            {/* 操作时间线区块 */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 32, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
                    <Clock size={22} color="#23408e" /> 操作时间线
                </div>
                <div style={{ color: '#888', fontSize: 16, marginBottom: 32 }}>按时间从新到旧展示操作历史，仅展示最近{topRecordLen}条</div>
                {loading ? (
                    <div style={{ textAlign: 'center', margin: '60px 0 40px 0' }}><Spin size="large" /></div>
                ) : error ? (
                    <div style={{ textAlign: 'center', margin: '60px 0 40px 0' }}>
                        <AlertCircle size={60} color="#e53935" style={{ marginBottom: 18 }} />
                        <div style={{ color: '#e53935', fontSize: 20, marginBottom: 10 }}>{error}</div>
                        <Button type="primary" size="large" onClick={fetchAudit}>重新加载</Button>
                    </div>
                ) : auditList.length === 0 ? (
                    <Empty description="暂无审计记录" style={{ margin: '60px 0 40px 0' }} />
                ) : (
                    <Timeline mode="left" style={{ margin: '40px 0' }}>
                        {auditList.map(item => {
                            let obj = {};
                            try {
                                obj = JSON.parse(item.object || '{}');
                            } catch { }
                            // 使用dayjs格式化时间为xxxx年xx月xx日 xx:xx:xx
                            let timeStr = item.createdTime;
                            if (item.createdTime) {
                                const d = dayjs(item.createdTime);
                                if (d.isValid()) {
                                    timeStr = d.format('YYYY年MM月DD日 HH:mm:ss');
                                }
                            }
                            return (
                                <Timeline.Item key={item.id}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#888', fontSize: 18, marginLeft: 4, marginBottom: 2, fontWeight: 600 }}>
                                            操作人：{item.user || '--'} <span style={{ fontSize: 14, color: '#888', marginLeft: 0, fontWeight: 400 }}>@ {item.organization || '--'}</span>
                                        </div>
                                        <div style={{ color: '#23408e', fontSize: 14, fontWeight: 400, marginTop: 2 }}>
                                            {timeStr}，
                                            {/* 如果 object 中包含 isGranted 且为 false，则显示调用的数据集ID，且不显示“已上链”信息 */}
                                            {((obj.isGranted === false) || (String(obj.isGranted || '').toLowerCase() === 'false')) ? (
                                                <span>查询自己管理的的数据集，调用的数据集ID为：{obj.id || obj.dataset_id || '--'}</span>
                                            ) : (
                                                <span>查询了被授权的数据，本次相应的授权工单id为：{obj.id || '--'}。</span>
                                            )}
                                            <Button
                                                type="link"
                                                style={{ fontSize: 15, fontWeight: 500, marginLeft: 16, marginTop: 0, padding: 0 }}
                                                onClick={() => history && history.push && history.push(`/records/${item.organization}/${item.id}`)}
                                            >
                                                查看详情
                                            </Button>
                                        </div>
                                    </div>

                                </Timeline.Item>
                            );
                        })}
                    </Timeline>
                )}
            </div>
            {/* 区块链技术保障 banner */}
            <div style={{ background: '#fff', borderRadius: 28, marginTop: 32, padding: '36px 32px 32px 32px', boxShadow: '0 2px 8px #f0f1f3', border: '1.5px solid #e6eaf1' }}>
                {/* 标题区块 */}
                <div style={{ minWidth: 220, marginRight: 36, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, marginTop: 2, color: '#222' }}>区块链技术保障</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                    {/* 三个特性卡片横向分布 */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <CheckCircle2 size={44} color="#52c41a" style={{ background: '#e9faef', borderRadius: '50%', padding: 8, marginBottom: 8 }} />
                            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>不可篡改性</div>
                            <div style={{ color: '#888ca0', fontSize: 15, lineHeight: 1.7 }}>
                                所有记录一旦上链，永远无法修改或删除，<br />
                                每个操作都可溯源，确保审计的完整性和安全性
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <Repeat2 size={44} color="#428be5" style={{ background: '#eaf2fe', borderRadius: '50%', padding: 8, marginBottom: 8 }} />
                            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>时间戳证明</div>
                            <div style={{ color: '#888ca0', fontSize: 15, lineHeight: 1.7 }}>
                                每个操作都有精确的时间戳，提供可靠的时间证明，<br />
                                审计链路完整，支持全流程时间追溯
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <Eye size={44} color="#a259e4" style={{ background: '#f4f0fa', borderRadius: '50%', padding: 8, marginBottom: 8 }} />
                            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>透明可追溯</div>
                            <div style={{ color: '#888ca0', fontSize: 15, lineHeight: 1.7 }}>
                                完整的操作链路，支持端到端的责任追溯，<br />
                                审计过程透明公开，便于合规监管
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


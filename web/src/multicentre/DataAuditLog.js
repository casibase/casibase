import React from "react";
import { Input, Button, Tag } from "antd";
import { AlertCircle, Clock, Link2, ShieldCheck, CheckCircle2, Repeat2, Eye } from 'lucide-react';

export default function DataAuditLog() {
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
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

            {/* 顶部统计卡片和搜索 */}
            {/* <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div style={{ flex: 2 }}>
                    <Input.Search
                        placeholder="搜索审计记录..."
                        style={{ background: '#f5f6fa', borderRadius: 12, height: 48, fontSize: 18, border: 'none' }}
                        size="large"
                        disabled
                    />
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, minWidth: 180 }}>
                    <div style={{ color: '#52c41a', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>2</div>
                    <div style={{ color: '#888', fontSize: 18, marginTop: 2 }}>确认交易</div>
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, minWidth: 180 }}>
                    <div style={{ color: '#222', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>0</div>
                    <div style={{ color: '#888', fontSize: 18, marginTop: 2 }}>待确认</div>
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, minWidth: 180, position: 'relative' }}>
                    <Link2 size={22} style={{ position: 'absolute', left: 18, top: 18, color: '#23408e' }} />
                    <div style={{ color: '#23408e', fontSize: 16, fontWeight: 600, position: 'absolute', right: 18, top: 18 }}>链上记录总数: 2</div>
                </div>
            </div> */}

            {/* 错误提示 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <AlertCircle color="#e53935" size={22} />
                <span style={{ color: '#e53935', fontWeight: 600, fontSize: 18 }}>数据获取失败</span>
            </div>

            {/* 操作时间线区块 */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 32, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
                    <Clock size={22} color="#23408e" /> 操作时间线
                </div>
                <div style={{ color: '#888', fontSize: 16, marginBottom: 32 }}>按时间顺序展示所有区块链记录的操作历史</div>
                <div style={{ textAlign: 'center', margin: '60px 0 40px 0' }}>
                    <AlertCircle size={60} color="#888ca0" style={{ marginBottom: 18 }} />
                    <div style={{ color: '#888ca0', fontSize: 20, marginBottom: 10 }}>获取审计记录失败，请稍后重试</div>
                    <Button type="primary" size="large">重新加载</Button>
                </div>
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

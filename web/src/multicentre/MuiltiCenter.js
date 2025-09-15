import React, { useState } from "react";
import { Button, Input, Progress, Tag } from "antd";
import { UserPlus, FilePlus, Lock, Link2, ShieldCheck, Hospital } from 'lucide-react';

const projectList = [
    {
        title: "心血管疾病预后分析研究",
        partner: "B医院",
        status: "数据收集中",
        statusType: "processing",
        percent: 65,
        sampleCount: 247,
        requestCount: 3,
        approvedCount: 2,
    },
    {
        title: "糖尿病并发症关联性研究",
        partner: "C医院",
        status: "申请审批中",
        statusType: "default",
        percent: 30,
        sampleCount: 156,
        requestCount: 1,
        approvedCount: 0,
    },
];

const resourceList = [
    {
        title: "心血管患者诊疗记录集",
        org: "B医院",
        access: "受控访问",
        count: 1348,
    },
    {
        title: "心电图影像数据集",
        org: "B医院",
        access: "受控访问",
        count: 856,
    },
    {
        title: "超声心动图数据集",
        org: "B医院",
        access: "受控访问",
        count: 624,
    },
];

export default function MuiltiCenter() {
    const [search, setSearch] = useState("");
    return (
        <div style={{ background: '#f7f9fb', minHeight: '100vh', paddingBottom: 40 }}>
            {/* 顶部欢迎区块 */}
            <div style={{ background: '#428be5', borderRadius: 24, margin: 24, padding: '36px 48px 32px 48px', color: '#fff', position: 'relative' }}>
                <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>多中心科研</div>
                <div style={{ fontSize: 18, opacity: 0.95, marginBottom: 18 }}>基于区块链技术的安全多中心科研数据协作平台，让跨机构研究更加可信透明</div>
                <div style={{ display: 'flex', gap: 32, fontSize: 16, opacity: 0.93 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={18} /> 端到端加密</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Link2 size={18} /> 区块链审计</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={18} /> 零信任架构</span>
                </div>
                <div style={{ position: 'absolute', right: 36, top: 36, display: 'flex', gap: 16 }}>
                    {/* <Button icon={<UserPlus size={18} />} style={{ fontWeight: 500 }}>邀请协作者</Button>
                    <Button icon={<FilePlus size={18} />} type="primary">新建项目</Button> */}
                </div>
            </div>

            {/* 科研协作项目 */}
            <div style={{ margin: '0 36px' }}>
                <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>科研协作项目</div>
                <div style={{ color: '#888', fontSize: 18, marginBottom: 24 }}>管理您的跨机构医疗数据协作研究</div>

                <div style={{ fontSize: 24, fontWeight: 700, margin: '32px 0 18px 0' }}>我的协作项目</div>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {projectList.map((p, idx) => (
                        <div key={idx} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #e6eaf1', padding: 32, minWidth: 420, flex: 1, marginBottom: 24, position: 'relative' }}>
                            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
                            <div style={{ color: '#888', fontSize: 16, marginBottom: 8 }}>
                                <span style={{ marginRight: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Hospital size={16} /> 协作方：{p.partner}</span>
                            </div>
                            <Tag color={p.statusType === 'processing' ? 'blue' : 'default'} style={{ position: 'absolute', right: 32, top: 32, fontSize: 15 }}>{p.status}</Tag>
                            <div style={{ margin: '18px 0 8px 0', fontWeight: 500 }}>项目进度</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Progress percent={p.percent} showInfo={false} strokeColor="#428be5" style={{ flex: 1 }} />
                                <span style={{ fontWeight: 600, fontSize: 18 }}>{p.percent}%</span>
                            </div>
                            <div style={{ display: 'flex', gap: 32, margin: '18px 0 0 0', fontSize: 20, fontWeight: 700 }}>
                                <div style={{ textAlign: 'center' }}>{p.sampleCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>样本数量</div></div>
                                <div style={{ textAlign: 'center' }}>{p.requestCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>数据请求</div></div>
                                <div style={{ textAlign: 'center', color: '#1bbf4c' }}>{p.approvedCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>已批准</div></div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                                <Button type="primary">查看详情</Button>
                                <Button>进入工作台</Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 可用数据资源 */}
                <div style={{ fontSize: 22, fontWeight: 700, margin: '40px 0 18px 0' }}>可用数据资源</div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                    <Input.Search
                        placeholder="搜索数据集..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 320, background: '#fff', borderRadius: 8 }}
                        allowClear
                    />
                </div>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {resourceList.filter(r => r.title.includes(search)).map((r, idx) => (
                        <div key={idx} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px #e6eaf1', padding: 28, minWidth: 320, flex: 1, marginBottom: 24, position: 'relative' }}>
                            <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>{r.title}</div>
                            <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>
                                <span style={{ marginRight: 10, display: 'flex', alignItems: 'center', gap: 4 }}><Hospital size={15} /> {r.org}</span>
                            </div>
                            <Tag icon={<Lock size={14} style={{ verticalAlign: -2 }} />} color="default" style={{ position: 'absolute', right: 28, top: 28, fontSize: 14 }}>{r.access}</Tag>
                            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 18 }}>{r.count}</div>
                            <div style={{ fontSize: 14, color: '#888' }}>样本数量</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { Button, Input, Progress, Tag } from "antd";
import { UserPlus, FilePlus, Lock, Link2, ShieldCheck, Hospital } from 'lucide-react';
import * as MuiltiCenterBackend from "../backend/MultiCenterBackend";


const dataSetsIds = ["MCTest1", "MCTest2", "MCTest3"];

const projectList = [
    {
        title: "病例分析研究",
        partner: "医大一院",
        status: "项目进行中",
        statusType: "processing",
        percent: 65,
        sampleCount: 247,
        requestCount: 3,
        approvedCount: 2,
    },
    // {
    //     title: "糖尿病并发症关联性研究",
    //     partner: "C医院",
    //     status: "申请审批中",
    //     statusType: "default",
    //     percent: 30,
    //     sampleCount: 156,
    //     requestCount: 1,
    //     approvedCount: 0,
    // },
];

// 动态获取数据集基本信息
const resourceListInit = dataSetsIds.map(id => ({ id, description: '', loading: true }));

import { useHistory } from 'react-router-dom';
export default function MuiltiCenter() {
    const [search, setSearch] = useState("");
    const [resourceList, setResourceList] = useState(resourceListInit);
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const results = [];
            for (let i = 0; i < dataSetsIds.length; i++) {
                const id = dataSetsIds[i];
                try {
                    const resp = await MuiltiCenterBackend.queryDataSetsInfo(id);
                    if (resp?.data?.resultDecoded) {
                        const info = JSON.parse(resp.data.resultDecoded);
                        results.push({ id, description: info.Description || '', loading: false });
                    } else {
                        results.push({ id, description: '', loading: false });
                    }
                } catch (e) {
                    results.push({ id, description: '', loading: false });
                }
                if (i < dataSetsIds.length - 1) {
                    await new Promise(res => setTimeout(res, 1500)); // 每秒只允许一个请求
                }
            }
            setResourceList(results);
            setLoading(false);
        };
        fetchAll();
    }, []);

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
                    <Button onClick={() => history.push('/multi-center/data-workbench')} style={{ fontWeight: 500, background: '#fff', color: '#23408e', border: '1px solid #d9d9d9' }}>数据工作台</Button>
                    <Button onClick={() => history.push('/multi-center/audit-log')} style={{ fontWeight: 500, background: '#fff', color: '#23408e', border: '1px solid #d9d9d9' }}>数据审计记录</Button>
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
                                {/* <div style={{ textAlign: 'center' }}>{p.sampleCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>样本数量</div></div>
                                <div style={{ textAlign: 'center' }}>{p.requestCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>数据请求</div></div>
                                <div style={{ textAlign: 'center', color: '#1bbf4c' }}>{p.approvedCount}<div style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>已批准</div></div> */}
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                                <Button onClick={() => history.push('/multi-center/data-workbench')}> 进入工作台</Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 可用数据资源 */}
                <div style={{ fontSize: 22, fontWeight: 700, margin: '40px 0 18px 0' }}>可用数据资源</div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                    {/* <Input.Search
                        placeholder="搜索数据集..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 320, background: '#fff', borderRadius: 8 }}
                        allowClear
                    /> */}
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', fontSize: 18, color: '#428be5', margin: '32px 0' }}>
                        <Spin size="large" style={{ marginRight: 16 }} />
                        数据加载中...
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                        {resourceList
                            .filter(r => r.description && r.description.includes(search))
                            .map((r, idx) => (
                                <div key={r.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px #e6eaf1', padding: 28, minWidth: 320, flex: 1, marginBottom: 24, position: 'relative' }}>
                                    <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>{r.loading ? '加载中...' : r.description || '无描述'}</div>
                                    <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>
                                        <span style={{ marginRight: 10, display: 'flex', alignItems: 'center', gap: 4 }}><FilePlus size={15} /> {r.id}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div >
    );
}

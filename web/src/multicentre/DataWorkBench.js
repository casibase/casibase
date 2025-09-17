import React, { useState } from "react";
import { Table, Tag, Button, Progress, Alert, Dropdown, Menu, Segmented, Result } from "antd";
import { DownOutlined } from '@ant-design/icons';
import { Clock, Database, ShieldCheck, Link2, Image } from 'lucide-react';

const usageId = "use_test_001"

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

export default function DataWorkBench() {
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    const [showTable, setShowLimitData] = useState(false);
    const [selectedData, setSelectedData] = useState('心血管疾病数据');
    const menu = (
        <Menu onClick={() => { }}>
            <Menu.Item key="cvd">心血管疾病数据</Menu.Item>
        </Menu>
    );
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
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)'
                }}>
                    <Clock size={32} color="#428be5" />
                    <div>
                        <div style={{ color: '#888', fontSize: 16 }}>剩余访问时间</div>
                        <div style={{ color: '#428be5', fontWeight: 700, fontSize: 22, marginTop: 4 }}>29天 12小时 34分钟</div>
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
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)'
                }}>
                    <Database size={32} color="#428be5" />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#888', fontSize: 16 }}>数据查询次数</div>
                        <div style={{ color: '#23408e', fontWeight: 700, fontSize: 22, marginTop: 4 }}>15/100</div>
                        <Progress percent={15} showInfo={false} strokeColor="#428be5" style={{ marginTop: 6, width: 120 }} />
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
                                <Button type="primary" onClick={() => setShowLimitData(true)} style={{ marginTop: 24 }}>确认查看</Button>
                            }
                        />

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
                            defaultValue="structured"
                        />

                        <Table columns={columns} dataSource={data} pagination={false} bordered rowKey="id" style={{ marginTop: 18 }} />
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


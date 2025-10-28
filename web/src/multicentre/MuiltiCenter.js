import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { Button, Input, Progress, Tag, Modal, Form, DatePicker, InputNumber, message } from "antd";
import { UserPlus, FilePlus, Lock, Link2, ShieldCheck, Hospital } from 'lucide-react';
import * as MuiltiCenterBackend from "../backend/MultiCenterBackend";

import * as DYCF_UTIL from "../utils/dynamicConfigUtil";

import * as Setting from '../Setting';


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
import { is } from "bpmn-js/lib/util/ModelUtil";

export default function MuiltiCenter() {
    const [search, setSearch] = useState("");
    const [resourceList, setResourceList] = useState(resourceListInit);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalResource, setModalResource] = useState(null);
    const [form] = Form.useForm();
    const history = useHistory();

    // 全局灰度开关（window.isHuidu 可由外部注入）
    const routeTo = async (path) => {
        const isHuiduStr = await DYCF_UTIL.GET("multiCenter.gray-block", "false");
        const isHuidu = (isHuiduStr === "true");
        if (isHuidu) {
            for (let i = 0; i < 5; i++) {
                Setting.showMessage("info", "当前功能正在按新需求重构，暂未完工或正在灰度测试。因涉及到区块链数据，为保证数据一致性，暂不可进入");
            }
            return;
        }
        history.push(path);
    };

    useEffect(() => {
        const fetchAll = async () => {

        };
        fetchAll();
    }, []);

    // 弹窗确认
    const handleApply = () => {
        setModalOpen(false);
        message.success('受区块链合约限制，请对方机构赋权后方可使用');
        form.resetFields();
    };

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

                {/* 可用数据集 */}
                <div style={{ fontSize: 22, fontWeight: 700, margin: '40px 0 18px 0' }}>数据集申请与管理</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                    {/* 更炫酷的入口卡片 */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => routeTo('/multi-center/data-usage/my-data-set')}
                        onKeyDown={(e) => { if (e.key === 'Enter') routeTo('/multi-center/data-usage/my-data-set'); }}
                        style={{
                            flex: 1,
                            minWidth: 280,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 18,
                            padding: '18px 20px',
                            borderRadius: 14,
                            color: '#0f1724',
                            cursor: 'pointer',
                            background: 'linear-gradient(90deg,#f0f7ff 0%, #ffffff 100%)',
                            boxShadow: '0 8px 20px rgba(15,23,36,0.06)',
                            transition: 'transform 160ms ease, box-shadow 160ms ease'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>我管理的数据集</div>
                            <div style={{ marginTop: 6, color: 'rgba(15,23,36,0.7)' }}>管理你发布的数据集，并审批他人的申请。</div>
                        </div>
                        <div>
                            <Button type="default" onClick={(e) => { e.stopPropagation(); routeTo('/multi-center/data-usage/my-data-set'); }}>进入</Button>
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => routeTo('/multi-center/data-usage/my-data-application')}
                        onKeyDown={(e) => { if (e.key === 'Enter') routeTo('/multi-center/data-usage/my-data-application'); }}
                        style={{
                            flex: 1,
                            minWidth: 280,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 18,
                            padding: '18px 20px',
                            borderRadius: 14,
                            color: '#0f1724',
                            cursor: 'pointer',
                            background: 'linear-gradient(90deg,#fff9f2 0%, #ffffff 100%)',
                            boxShadow: '0 8px 20px rgba(17,24,39,0.04)',
                            transition: 'transform 160ms ease, box-shadow 160ms ease'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>我的数据集申请</div>
                            <div style={{ marginTop: 6, color: 'rgba(17,24,39,0.7)' }}>查看你发起的申请与已获授权，快速管理使用权限。</div>
                        </div>
                        <div>
                            <Button onClick={(e) => { e.stopPropagation(); routeTo('/multi-center/data-usage/my-data-application'); }}>查看</Button>
                        </div>
                    </div>
                </div>

                <Modal
                    title="申请数据集使用权"
                    open={modalOpen}
                    onCancel={() => { setModalOpen(false); form.resetFields(); }}
                    onOk={handleApply}
                    okText="确认"
                    cancelText="取消"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ maxCount: 1 }}
                    >
                        <Form.Item label="申请用途" name="purpose" rules={[{ required: true, message: '请输入申请用途' }]}> <Input.TextArea rows={2} placeholder="请输入用途" /> </Form.Item>
                        <Form.Item label="数据使用截至时间" name="deadline" rules={[{ required: true, message: '请选择截至时间' }]}> <DatePicker style={{ width: '100%' }} /> </Form.Item>
                        <Form.Item label="数据使用最大次数" name="maxCount" rules={[{ required: true, message: '请输入最大次数' }]}> <InputNumber min={1} style={{ width: '100%' }} /> </Form.Item>
                        <Form.Item label="申请数据集信息">
                            <div style={{ background: '#f7f9fb', borderRadius: 8, padding: 12, fontSize: 15 }}>
                                <div><b>数据集ID：</b>{modalResource?.id}</div>
                                <div><b>数据集信息：</b>{modalResource?.description}</div>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

import React, { useState } from "react";
import { Row, Col, Card, Button, Empty, Space, Typography, Tabs, Modal, Form, Input, DatePicker } from "antd";
import { DatabaseOutlined, TeamOutlined } from "@ant-design/icons";
import moment from 'moment';

const { Meta } = Card;
const { Title, Text } = Typography;

// Mock datasets for two categories: requested (I asked) and managed (I manage)
// Note: removed `visibility` field per requirement; requested items now carry `status` ("pending" | "approved")
const MOCK_REQUESTED = [
    {
        id: "req-101",
        name: "门诊影像样例",
        description: "申请访问门诊影像用于模型评估，包含少量 DICOM 截图。",
        createdTime: "2025-09-10 09:20:00",
        status: "pending",
    },
    {
        id: "req-102",
        name: "外部开放数据样例",
        description: "第三方共享的数据样例，已由管理员通过。",
        createdTime: "2025-09-12 11:02:10",
        status: "approved",
    },
];

const MOCK_MANAGED = [
    {
        id: "mg-201",
        name: "住院结构化病历",
        description: "本团队维护的住院病历结构化数据，供内部研究使用。",
        createdTime: "2024-11-20 14:45:00",
    },
    {
        id: "mg-202",
        name: "医学术语词表",
        description: "管理并对外发布的医学术语中英对照表。",
        createdTime: "2024-06-02 08:00:00",
    },
    {
        id: "mg-203",
        name: "影像标签集",
        description: "为影像算法训练准备的标注数据集，包含标签与边界框信息。",
        createdTime: "2025-01-15 16:33:21",
    },
];

function DataCard({ ds, role }) {
    return (
        <Card
            hoverable
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 12 }}
            actions={role === "manage" ? [<Button type="link">管理</Button>, <Button type="link">导出</Button>] : [<Button type="link">查看</Button>]}
        >
            <Meta
                title={<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <Title level={5} style={{ margin: 0 }}>{ds.name}</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>{ds.id}</Text>
                    </div>
                </div>}
                description={<div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8 }}>{ds.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>创建时间：{ds.createdTime}</Text>
                    </div>
                </div>}
            />
        </Card>
    );
}

export default function MyDataSetPage() {
    const [requested] = useState(MOCK_REQUESTED);
    const [managed, setManaged] = useState(MOCK_MANAGED);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [form] = Form.useForm();

    function formatNow() {
        const d = new Date();
        const Y = d.getFullYear();
        const M = String(d.getMonth() + 1).padStart(2, '0');
        const D = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    }

    const openCreateModal = () => {
        form.resetFields();
        setCreateModalVisible(true);
    };

    const closeCreateModal = () => {
        setCreateModalVisible(false);
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            // create a simple id and push to managed
            const newId = 'mg-' + Date.now();
            const newDs = {
                id: newId,
                name: values.name,
                description: values.keywords || '',
                createdTime: formatNow(),
                expiry: values.expiry ? values.expiry.format('YYYY-MM-DD HH:mm:ss') : undefined,
            };
            setManaged(prev => [newDs, ...prev]);
            setCreateModalVisible(false);
        } catch (err) {
            // validation failed, do nothing
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>我的可用数据源</Title>
                    <Text type="secondary">区分“我申请的数据源”和“我管理的数据源”，便于查看权限与运维。</Text>
                </div>
                <Space>
                    <Button>导入数据</Button>
                </Space>
            </div>

            <div style={{ marginBottom: 24 }}>
                <Card title={<span><DatabaseOutlined style={{ marginRight: 8 }} /> 我申请的数据源</span>} bordered={false} style={{ borderRadius: 12, boxShadow: '0 6px 18px rgba(10,20,40,0.06)' }}>
                    <Tabs defaultActiveKey="pending">
                        <Tabs.TabPane tab="申请中" key="pending">
                            {requested.filter(r => r.status === 'pending').length === 0 ? <Empty description="暂无申请中的数据源" /> : (
                                <Row gutter={[16, 16]}>
                                    {requested.filter(r => r.status === 'pending').map((ds) => (
                                        <Col xs={24} sm={12} key={ds.id}>
                                            <DataCard ds={ds} role="request" />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="申请通过" key="approved">
                            {requested.filter(r => r.status === 'approved').length === 0 ? <Empty description="暂无已通过的数据源" /> : (
                                <Row gutter={[16, 16]}>
                                    {requested.filter(r => r.status === 'approved').map((ds) => (
                                        <Col xs={24} sm={12} key={ds.id}>
                                            <DataCard ds={ds} role="request" />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Tabs.TabPane>
                    </Tabs>
                </Card>
            </div>

            <div>
                <Card
                    title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><TeamOutlined style={{ marginRight: 8 }} /> 我管理的数据源</div>
                        <div><Button type="primary" onClick={openCreateModal}>新建数据集</Button></div>
                    </div>}
                    bordered={false}
                    style={{ borderRadius: 12, boxShadow: '0 6px 18px rgba(10,20,40,0.06)' }}
                >
                    {managed.length === 0 ? <Empty description="暂无管理的数据源" /> : (
                        <Row gutter={[16, 16]}>
                            {managed.map((ds) => (
                                <Col xs={24} sm={12} key={ds.id}>
                                    <DataCard ds={ds} role="manage" />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card>

                <Modal
                    title="新建数据集"
                    visible={createModalVisible}
                    onOk={handleCreate}
                    onCancel={closeCreateModal}
                    destroyOnClose
                >
                    <Form form={form} layout="vertical">
                        <Form.Item name="name" label="数据集名称" rules={[{ required: true, message: '请输入数据集名称' }]}>
                            <Input placeholder="例如：门诊影像样例" />
                        </Form.Item>
                        <Form.Item name="keywords" label="数据集关键词" rules={[{ required: true, message: '请输入数据集关键词（至少 1 个）' }]}>
                            <Input placeholder="只能填写一个关键词" />
                        </Form.Item>
                        <Form.Item name="expiry" label="数据集到期时间" rules={[{ required: true, message: '请选择到期时间' }]}>
                            <DatePicker
                                style={{ width: '100%' }}
                                showTime={{ defaultValue: moment('23:59:59', 'HH:mm:ss') }}
                                format="YYYY-MM-DD HH:mm:ss"
                                disabledDate={(current) => {
                                    // disable dates before (now + 1 day)
                                    return current && current.isBefore(moment().add(1, 'days').startOf('day'));
                                }}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

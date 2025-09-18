import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography } from "antd";
import * as DynamicConfigBackend from "./backend/DynamicConfigBackend";

const { Text } = Typography;

export default function DynamicConfigPage() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await DynamicConfigBackend.getDynamicConfigs();
            setConfigs(res?.data ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleEdit = (record) => {
        setEditing(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleAdd = () => {
        setEditing(null);
        form.resetFields();
        setModalOpen(true);
    };

    const handleDelete = async (record) => {
        await DynamicConfigBackend.deleteDynamicConfig(record);
        message.success("删除成功");
        fetchConfigs();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editing) {
                await DynamicConfigBackend.updateDynamicConfig(editing.id, { ...editing, ...values });
                message.success("修改成功");
            } else {
                await DynamicConfigBackend.addDynamicConfig(values);
                message.success("添加成功");
            }
            setModalOpen(false);
            fetchConfigs();
        } catch (e) {
            // 校验失败
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "配置Key", dataIndex: "configkey", key: "configkey" },
        { title: "配置Value", dataIndex: "configvalue", key: "configvalue" },
        { title: "描述", dataIndex: "desc", key: "desc" },
        {
            title: "操作",
            key: "action",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record)}>
                        <Button size="small" danger>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: 32, minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>动态配置管理</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={fetchConfigs}>刷新</Button>
                    <Button type="primary" onClick={handleAdd}>新增配置</Button>
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={configs}
                rowKey="id"
                loading={loading}
                bordered
                pagination={false}
                style={{ marginBottom: 32 }}
            />
            <Modal
                open={modalOpen}
                title={editing ? "编辑配置" : "新增配置"}
                onCancel={() => setModalOpen(false)}
                onOk={handleOk}
                destroyOnClose
                width={1520}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="configkey"
                        label="配置Key"
                        rules={[{ required: true, whitespace: true, message: '请输入配置Key' }]}
                        validateTrigger={["onBlur", "onSubmit"]}
                    >
                        <Input autoComplete="off" />
                    </Form.Item>
                    <div style={{ color: '#888', fontSize: 13, margin: '-10px 0 12px 2px' }}>建议以xxx.xxx.xxx.xxx的形式填写以方便分组</div>
                    <Form.Item
                        name="configvalue"
                        label="配置Value"
                        rules={[{ required: true, whitespace: true, message: '请输入配置Value' }]}
                        validateTrigger={["onBlur", "onSubmit"]}
                    >
                        <Input.TextArea autoSize autoComplete="off" />
                    </Form.Item>
                    <div style={{ color: '#888', fontSize: 13, margin: '-10px 0 12px 2px' }}>数据库均以字符串形式存储</div>
                    <Form.Item
                        name="desc"
                        label="描述"
                        rules={[]}
                    >
                        <Input autoComplete="off" />
                    </Form.Item>
                </Form>
            </Modal>
            <div style={{ marginTop: 48, textAlign: 'center', color: '#888' }}>
                <Text type="secondary">参考自“美团Lion”进行简化版实现</Text>
            </div>
        </div>
    );
}

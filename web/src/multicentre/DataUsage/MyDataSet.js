import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Empty, Space, Typography, Modal, Drawer, Form, Input, DatePicker, Switch, Descriptions, Tag, Tabs, List, Spin, Table, Popconfirm, Popover } from "antd";
import { TeamOutlined, AuditOutlined, RightOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, AppstoreOutlined, FileSearchOutlined, SearchOutlined, InfoCircleOutlined } from "@ant-design/icons";
import moment from 'moment';
import * as MultiCenterBackend from '../../backend/MultiCenterBackend';
import * as Setting from '../../Setting';

import { MULTICENTER_DATASET_VISIBLE_STATUS, MULTICENTER_ACCESS_REQUEST_STATUS, MULTICENTER_GRANT_STATUS } from '../../const/MultiCenterConst';

const { Meta } = Card;
const { Title, Text } = Typography;



function DataCard({ ds, onView, onEdit, onQuery }) {
    return (
        <Card
            hoverable
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 12 }}
            actions={[
                <Button type="link" key="view" onClick={(e) => { e.stopPropagation(); onView && onView(); }}>查看基础信息</Button>,
                <Button type="link" key="edit" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}>编辑基础信息</Button>,
                // <Button type="link" key="query" onClick={(e) => { e.stopPropagation(); onQuery && onQuery(); }}>详细数据查询</Button>
            ]}
        >
            <Meta
                title={<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <Title level={5} style={{ margin: 0 }}>{ds.name}</Title>

                    </div>
                </div>}
                description={<div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8 }}>{ds.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>创建时间：{ds.createdTime}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>到期：{ds.expiry || '-'}</Text>
                            {/* visibility tag */}
                            {(() => {
                                const isPublic = ds.searchable || (ds.raw && ((ds.raw.VisibleStatus || ds.raw.visibleStatus || '').toUpperCase() === 'PUBLIC'));
                                return <Tag color={isPublic ? 'green' : 'default'}>{isPublic ? '公开' : '非公开'}</Tag>;
                            })()}
                        </div>
                    </div>
                </div>}
            />
        </Card>
    );
}

export default function MyDataSetPage() {
    const [managed, setManaged] = useState([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [viewDataset, setViewDataset] = useState(null);
    const [editingDataset, setEditingDataset] = useState(null);
    const [form] = Form.useForm();
    const [loadingManaged, setLoadingManaged] = useState(false);
    // request modal state
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requests, setRequests] = useState({
        PENDING: [],
        APPROVED: [],
        REJECTED: [],
    });
    const [loadingRequests, setLoadingRequests] = useState({
        PENDING: false,
        APPROVED: false,
        REJECTED: false,
    });
    const [activeRequestTab, setActiveRequestTab] = useState(MULTICENTER_ACCESS_REQUEST_STATUS.PENDING);
    // requester-side applications (我的申请) state
    const [requesterRequests, setRequesterRequests] = useState({
        PENDING: [],
        APPROVED: [],
        REJECTED: [],
    });
    const [loadingRequesterRequests, setLoadingRequesterRequests] = useState({
        PENDING: false,
        APPROVED: false,
        REJECTED: false,
    });
    const [activeRequesterTab, setActiveRequesterTab] = useState(MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED);
    // rejection reasons keyed by request id
    const [rejectReasonMap, setRejectReasonMap] = useState({});
    // dataset detail cache/loading state (used when clicking dataset search)
    const [datasetDetailMap, setDatasetDetailMap] = useState({});
    const [datasetDetailLoading, setDatasetDetailLoading] = useState(false);
    const [datasetModalVisible, setDatasetModalVisible] = useState(false);
    const [datasetModalData, setDatasetModalData] = useState(null);

    const defaultNoneDay = '1970-01-01 00:00:00';

    function renderStatusTag(status) {
        if (!status) return null;
        const s = status.toString().toUpperCase();
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED) return <Tag icon={<CheckCircleOutlined />} color="success">已通过</Tag>;
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.PENDING) return <Tag icon={<ClockCircleOutlined />} color="default">待审核</Tag>;
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.REJECTED) return <Tag icon={<CloseCircleOutlined />} color="error">已拒绝</Tag>;
        return <Tag>{status}</Tag>;
    }

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
        setEditingDataset(null);
        setCreateModalVisible(true);
    };

    const openEditModal = (ds) => {
        setEditingDataset(ds);
        // prefill form
        const raw = ds.raw || {};
        form.setFieldsValue({
            name: ds.name || raw.DatasetName || raw.datasetName || '',
            description: ds.description || raw.Description || raw.description || '',
            keywords: raw.Keyword || raw.keyword || ds.description || raw.description || '',
            searchable: !!ds.searchable,
            expiry: ds.expiry ? moment(ds.expiry, 'YYYY-MM-DD HH:mm:ss') : (raw.ExpiredAt ? moment(raw.ExpiredAt, 'YYYY-MM-DD HH:mm:ss') : undefined),
        });
        setCreateModalVisible(true);
    };

    const handleDetailQuery = (ds) => {
        // Placeholder for detailed data query behavior. Replace with navigation or real implementation.
        console.log('Detailed data query for:', ds);
        Setting.showMessage('error', '详细数据查询功能尚未实现');
    };

    const openViewModal = (ds) => {
        setViewDataset(ds);
        setViewModalVisible(true);
    };

    const closeViewModal = () => {
        setViewModalVisible(false);
        setViewDataset(null);
    };

    const closeCreateModal = () => {
        setCreateModalVisible(false);
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            // build payload using description field when provided
            const payload = {
                datasetName: values.name,
                description: values.description || values.keywords || '',
                keyword: values.keywords || '',
                expiredAt: values.expiry ? values.expiry.format('YYYY-MM-DD HH:mm:ss') : undefined,
                // visibleStatus: PUBLIC when searchable true, else PRIVATE
                visibleStatus: (values.searchable === undefined || values.searchable) ? MULTICENTER_DATASET_VISIBLE_STATUS.PUBLIC : MULTICENTER_DATASET_VISIBLE_STATUS.PRIVATE,
            };

            if (editingDataset) {
                // update existing dataset
                const id = editingDataset.id || (editingDataset.raw && (editingDataset.raw.Id || editingDataset.raw.id || editingDataset.raw.ID));
                const res = await MultiCenterBackend.updateDataset(id, payload);
                if (res && res.status === 'ok') {
                    Setting.showMessage('success', '更新数据集成功');
                    await loadManaged();
                    setCreateModalVisible(false);
                    setEditingDataset(null);
                    form.resetFields();
                } else {
                    Setting.showMessage('error', `更新失败: ${res ? res.msg : '未知错误'}`);
                }
            } else {
                const res = await MultiCenterBackend.addDataset(payload);
                if (res && res.status === 'ok') {
                    Setting.showMessage('success', '新建数据集成功');
                    await loadManaged();
                    setCreateModalVisible(false);
                    form.resetFields();
                } else {
                    Setting.showMessage('error', `新建失败: ${res ? res.msg : '未知错误'}`);
                }
            }
        } catch (err) {
            // validation failed, do nothing
        }
    };

    // --- access requests (assigned to me) ---
    async function loadRequests(status) {
        if (!status) {
            return;
        }
        setLoadingRequests(prev => ({ ...prev, [status]: true }));
        try {
            const res = await MultiCenterBackend.getAccessRequestsByReviewerAndStatus(status);
            if (res && res.status === 'ok') {
                setRequests(prev => ({ ...prev, [status]: res.data || [] }));
            } else {
                Setting.showMessage('error', `获取申请列表失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setLoadingRequests(prev => ({ ...prev, [status]: false }));
        }
    }

    const openRequestsModal = () => {
        setRequestModalVisible(true);
        setActiveRequestTab(MULTICENTER_ACCESS_REQUEST_STATUS.PENDING);
        loadRequests(MULTICENTER_ACCESS_REQUEST_STATUS.PENDING);
    };

    const closeRequestsModal = () => {
        setRequestModalVisible(false);
    };

    const handleRequestTabChange = (key) => {
        setActiveRequestTab(key);
        loadRequests(key);
    };

    // handlers for reviewer actions
    const handleApproveRequest = async (id) => {
        try {
            const res = await MultiCenterBackend.reviewAccessRequest(id, true, '');
            if (res && res.status === 'ok') {
                Setting.showMessage('success', '已通过申请');
                loadRequests(activeRequestTab);
            } else {
                Setting.showMessage('error', `通过申请失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        }
    };

    const handleRejectRequest = async (id) => {
        const reason = (rejectReasonMap[id] || '').toString().trim();
        if (!reason) {
            Setting.showMessage('error', '请填写拒绝理由');
            return;
        }
        try {
            const res = await MultiCenterBackend.reviewAccessRequest(id, false, reason);
            if (res && res.status === 'ok') {
                Setting.showMessage('success', '已拒绝申请');
                // clear reason
                setRejectReasonMap(prev => ({ ...prev, [id]: '' }));
                loadRequests(activeRequestTab);
            } else {
                Setting.showMessage('error', `拒绝申请失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        }
    };

    const requestTableColumns = [
        {
            title: '申请编号',
            dataIndex: 'requestId',
        },
        {
            title: '数据集ID',
            dataIndex: 'DatasetId',
            key: 'datasetId',
            render: (text, record, index) => {
                const numericId = record.assetId || record.AssetId || record.Assetid || record.AssetID || record.AssetId || record.AssetId || record.RequestId || record.requestId || null;
                const stableId = numericId ? String(numericId) : `row-${index}`;

                const popContent = () => {
                    if (datasetDetailLoading) {
                        return <div style={{ padding: 12, textAlign: 'center' }}><Spin /></div>;
                    }
                    const ds = datasetDetailMap[stableId];
                    if (!ds) return <div style={{ padding: 12 }}>暂无数据</div>;
                    return (
                        <div style={{ minWidth: 320 }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="数据集名称">{ds.DatasetName || ds.datasetName || '-'}</Descriptions.Item>
                                <Descriptions.Item label="描述">{ds.Description || ds.description || '-'}</Descriptions.Item>
                                <Descriptions.Item label="归口单位">{ds.Unit || ds.unit || '-'}</Descriptions.Item>
                                <Descriptions.Item label="到期时间">{ds.ExpiredAt || ds.expiredAt || '-'}</Descriptions.Item>
                                <Descriptions.Item label="所有者">{ds.Owner || ds.owner || '-'}</Descriptions.Item>
                                <Descriptions.Item label="数据集 ID">{ds.Id || ds.id || ds.DatasetId || '-'}</Descriptions.Item>
                            </Descriptions>
                        </div>
                    );
                };

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ color: '#333' }}>{stableId}</div>
                        <Button type="link" icon={<SearchOutlined />} onClick={async (e) => {
                            e.stopPropagation();
                            setDatasetModalVisible(true);
                            setDatasetModalData(null);
                            if (datasetDetailMap[stableId]) {
                                setDatasetModalData(datasetDetailMap[stableId]);
                                return;
                            }
                            setDatasetDetailLoading(true);
                            try {
                                if (numericId && !isNaN(Number(numericId))) {
                                    const idNum = Number(numericId);
                                    const res = await MultiCenterBackend.getDatasetById(idNum);
                                    if (res && res.status === 'ok') {
                                        setDatasetDetailMap(prev => ({ ...prev, [stableId]: res.data }));
                                        setDatasetModalData(res.data);
                                    } else {
                                        Setting.showMessage('error', `获取数据集详情失败: ${res ? res.msg : '未知错误'}`);
                                    }
                                } else {
                                    setDatasetDetailMap(prev => ({ ...prev, [stableId]: null }));
                                }
                            } catch (e) {
                                Setting.showMessage('error', `无法连接服务器: ${e}`);
                            } finally {
                                setDatasetDetailLoading(false);
                            }
                        }} />
                    </div>
                );
            }
        },
        {
            title: '数据使用访问次数',
            dataIndex: 'requestedAccessCount',
            key: 'requestedAccessCount',
            render: (text, record) => (record.requestedAccessCount || '-')
        },
        {
            title: '数据使用截止时间',
            dataIndex: 'requestedDeadline',
            key: 'requestedDeadline',
            render: (text, record) => (record.requestedDeadline || '-')
        },
        {
            title: '审核状态',
            dataIndex: 'RequestStatus',
            key: 'status',
            render: (text, record) => renderStatusTag(record.Status || record.status || record.RequestStatus || record.requestStatus)
        },
        {
            title: '申请人',
            dataIndex: 'requester',
            key: 'requester',
            render: (text, record) => (record.requester || record.Requester || '-')
        },
        {
            title: '审核人',
            dataIndex: 'reviewer',
            key: 'reviewer',
            render: (text, record) => (record.reviewer || record.Reviewer || '-')
        },
        {
            title: '申请提交时间',
            dataIndex: 'requestedAt',
            key: 'requestedAt',
            render: (text, record) => (record.requestedAt || record.RequestedAt || '-')
        },
        {
            title: '审核结论',
            dataIndex: 'reviewedAt',
            key: 'reviewedAt',
            render: (text, record) => {
                if ((record.requestStatus || record.RequestStatus || record.status || '').toString().toUpperCase() === MULTICENTER_ACCESS_REQUEST_STATUS.PENDING) {
                    return <Tag color="orange">审核中</Tag>;
                }

                const comment = record.reviewComment || record.review_comment || '审核员未给出评论';
                let reviewedAtFormatted = record.reviewedAt || record.ReviewedAt || record.reviewed_at || '';
                if (reviewedAtFormatted === defaultNoneDay) {
                    reviewedAtFormatted = '--';
                }

                const popContent = (
                    <div style={{ maxWidth: 320 }}>
                        <div style={{ marginBottom: 8, color: '#333' }}><strong>审核意见</strong></div>
                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{comment}</div>
                        <div style={{ color: '#888' }}><strong>审核时间：</strong>{reviewedAtFormatted}</div>
                    </div>
                );

                return (
                    <Popover content={popContent} title="审核详情" trigger="hover">
                        <Button type="link" icon={<InfoCircleOutlined />} onClick={(e) => e.stopPropagation()}>查看</Button>
                    </Popover>
                );
            }
        },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (t, record) => {
                const id = record.Id || record.id || record.RequestId || record.requestId;
                return (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="link" onClick={async (e) => { e.stopPropagation(); await handleApproveRequest(id); }}>通过</Button>
                        <Popconfirm
                            title={<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ color: '#333' }}>拒绝理由</div>
                                <Input.TextArea rows={3} value={rejectReasonMap[id] || ''} onChange={(ev) => setRejectReasonMap(prev => ({ ...prev, [id]: ev.target.value }))} />
                            </div>}
                            onConfirm={async () => { await handleRejectRequest(id); }}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button type="link" onClick={(e) => e.stopPropagation()}>拒绝</Button>
                        </Popconfirm>
                    </div>
                );
            }
        }
    ];

    // --- requester-side loads (我的申请) ---
    async function loadRequesterRequests(status) {
        if (!status) return;
        setLoadingRequesterRequests(prev => ({ ...prev, [status]: true }));
        try {
            const res = await MultiCenterBackend.getAccessRequestsByRequesterAndStatus(status);
            if (res && res.status === 'ok') {
                setRequesterRequests(prev => ({ ...prev, [status]: res.data || [] }));
            } else {
                Setting.showMessage('error', `获取我的申请失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setLoadingRequesterRequests(prev => ({ ...prev, [status]: false }));
        }
    }

    const handleRequesterTabChange = (key) => {
        setActiveRequesterTab(key);
        loadRequesterRequests(key);
    };

    async function loadManaged() {
        setLoadingManaged(true);
        try {
            const res = await MultiCenterBackend.getDatasets();
            if (res && res.status === 'ok') {
                const list = (res.data || []).map(d => ({
                    id: String(d.Id || d.id || d.ID || ''),
                    name: d.DatasetName || d.datasetName || '',
                    description: d.Description || d.description || '',
                    createdTime: d.CreatedAt || d.createdAt || '',
                    expiry: d.ExpiredAt || d.expiredAt || '',
                    // derive boolean from VisibleStatus string returned by backend
                    searchable: ((d.VisibleStatus || d.visibleStatus || '')).toString().toUpperCase() === MULTICENTER_DATASET_VISIBLE_STATUS.PUBLIC.toString().toUpperCase(),
                    raw: d,
                }));
                setManaged(list);
            } else {
                Setting.showMessage('error', `获取数据集失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setLoadingManaged(false);
        }
    }

    useEffect(() => {
        loadManaged();
    }, []);

    // load assigned (指派给我的) pending requests on component mount so header count is available immediately
    useEffect(() => {
        loadRequests(MULTICENTER_ACCESS_REQUEST_STATUS.PENDING);
        // we intentionally run this once on mount; loadRequests is stable enough here

    }, []);

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>我管理的数据源</Title>
                    <Text type="secondary">您可以在此查看和管理您拥有的数据源。并进行工单管理</Text>
                </div>
                <Space>
                    {/* bottom link to assigned requests (stylish with icon and pending count) */}
                    <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                        <Card
                            size="small"
                            hoverable
                            onClick={openRequestsModal}
                            bodyStyle={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 16 }}
                            style={{
                                cursor: 'pointer',
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '1px solid rgba(9,45,117,0.08)',
                                background: 'linear-gradient(90deg, rgba(240,247,255,1), rgba(230,244,255,1))',
                                boxShadow: '0 6px 18px rgba(10,20,40,0.04)'
                            }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(3,37,76,0.06)' }}>
                                <AuditOutlined style={{ fontSize: 20, color: '#096dd9' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#092c57' }}>
                                    指派给我的申请工单
                                    <span style={{ marginLeft: 8, fontSize: 12, color: '#096dd9' }}>（{(requests.PENDING || []).length} 待处理）</span>
                                </div>
                                <div style={{ color: '#666', fontSize: 12 }}>查看待处理 / 已处理的申请</div>
                            </div>
                            <RightOutlined style={{ fontSize: 16, color: '#888' }} />
                        </Card>
                    </div>
                </Space>
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
                                    <DataCard ds={ds} onView={() => openViewModal(ds)} onEdit={() => openEditModal(ds)} onQuery={() => handleDetailQuery(ds)} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card>



                <Modal
                    title={editingDataset ? "编辑数据集" : "新建数据集"}
                    visible={createModalVisible}
                    onOk={handleCreate}
                    onCancel={closeCreateModal}
                    destroyOnClose
                >
                    <Form form={form} layout="vertical" initialValues={{ searchable: true }}>
                        <Form.Item name="name" label="数据集名称" rules={[{ required: true, message: '请输入数据集名称' }]}>
                            <Input placeholder="例如：门诊影像样例" />
                        </Form.Item>
                        <Form.Item name="description" label="数据集描述">
                            <Input.TextArea placeholder="可选：填写数据集描述" rows={4} />
                        </Form.Item>
                        <Form.Item name="keywords" label="数据集关键词" rules={[{ required: true, message: '请输入数据集关键词' }]}>
                            <Input placeholder="请填写关键词" />
                        </Form.Item>
                        <Form.Item name="searchable" label="是否公开可搜索" valuePropName="checked">
                            <Switch checkedChildren="是" unCheckedChildren="否" />
                        </Form.Item>
                        {editingDataset && (
                            <div style={{ color: '#888', marginBottom: 2, marginTop: "-22px", fontSize: '10px' }}>非公开仅限制用户搜索，若在数据集公开期间授权他人使用，那么数据集仍可使用，与状态无关</div>
                        )}
                        {!editingDataset && <Form.Item name="expiry" label="数据集到期时间" rules={[{ type: 'object', required: true, message: '请选择到期时间' }]}>
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

                        }
                        <div style={{ fontSize: '10px', color: 'gray' }}>为了保证数据安全，请务必设置数据集到期时间，数据集到期后，将无法再被使用。一旦提交，到期时间将无法修改。</div>
                    </Form>
                </Modal>


                {/* Assigned requests modal */}
                <Drawer
                    title="指派给我的申请工单"
                    visible={requestModalVisible}
                    onClose={closeRequestsModal}
                    footer={null}
                    width={900}
                    destroyOnClose
                    placement="bottom"
                    height={700}
                >
                    {/* dataset detail modal */}
                    <Modal
                        visible={datasetModalVisible}
                        title="数据集详情"
                        onCancel={() => setDatasetModalVisible(false)}
                        footer={[<Button key="close" onClick={() => setDatasetModalVisible(false)}>关闭</Button>]}
                        width={600}
                        style={{ zIndex: 99999999999 }}
                    >
                        {datasetModalData ? (
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="数据集名称">{datasetModalData.DatasetName || datasetModalData.datasetName || '-'}</Descriptions.Item>
                                <Descriptions.Item label="描述">{datasetModalData.Description || datasetModalData.description || '-'}</Descriptions.Item>
                                <Descriptions.Item label="归口单位">{datasetModalData.Unit || datasetModalData.unit || '-'}</Descriptions.Item>
                                <Descriptions.Item label="到期时间">{datasetModalData.ExpiredAt || datasetModalData.expiredAt || '-'}</Descriptions.Item>
                                <Descriptions.Item label="所有者">{datasetModalData.Owner || datasetModalData.owner || '-'}</Descriptions.Item>
                                <Descriptions.Item label="可见性">{((datasetModalData.VisibleStatus || datasetModalData.visibleStatus || '') || '').toUpperCase() === MULTICENTER_DATASET_VISIBLE_STATUS.PUBLIC ? '公开' : '非公开'}</Descriptions.Item>
                                <Descriptions.Item label="数据集 ID">{datasetModalData.Id || datasetModalData.id || datasetModalData.DatasetId || '-'}</Descriptions.Item>
                            </Descriptions>
                        ) : <Spin />}
                    </Modal>
                    <Tabs activeKey={activeRequestTab} onChange={handleRequestTabChange}>
                        <Tabs.TabPane tab="待审核" key={MULTICENTER_ACCESS_REQUEST_STATUS.PENDING}>
                            {loadingRequests.PENDING ? <Spin /> : (
                                (requests.PENDING || []).length === 0 ? <Empty description="暂无待审核申请" /> : (
                                    <Table
                                        columns={requestTableColumns}
                                        dataSource={requests.PENDING}
                                        loading={loadingRequests.PENDING}
                                        rowKey={(r) => r.Id || r.id || r.RequestId || r.requestId}
                                        pagination={{ pageSize: 8 }}
                                    />
                                )
                            )}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="审核通过" key={MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED}>
                            {loadingRequests.APPROVED ? <Spin /> : (
                                (requests.APPROVED || []).length === 0 ? <Empty description="暂无已通过申请" /> : (
                                    <Table
                                        columns={requestTableColumns.filter(c => c.dataIndex !== 'operation')}
                                        dataSource={requests.APPROVED}
                                        loading={loadingRequests.APPROVED}
                                        rowKey={(r) => r.Id || r.id || r.RequestId || r.requestId}
                                        pagination={{ pageSize: 8 }}
                                    />
                                )
                            )}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="审核拒绝" key={MULTICENTER_ACCESS_REQUEST_STATUS.REJECTED}>
                            {loadingRequests.REJECTED ? <Spin /> : (
                                (requests.REJECTED || []).length === 0 ? <Empty description="暂无被拒绝申请" /> : (
                                    <Table
                                        columns={requestTableColumns.filter(c => c.dataIndex !== 'operation')}
                                        dataSource={requests.REJECTED}
                                        loading={loadingRequests.REJECTED}
                                        rowKey={(r) => r.Id || r.id || r.RequestId || r.requestId}
                                        pagination={{ pageSize: 8 }}
                                    />
                                )
                            )}
                        </Tabs.TabPane>
                    </Tabs>
                </Drawer>
                <Modal
                    title="数据集详情"
                    visible={viewModalVisible}
                    onCancel={closeViewModal}
                    footer={[<Button key="close" onClick={closeViewModal}>关闭</Button>]}
                    width={700}
                    destroyOnClose

                >
                    {viewDataset && (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="数据集 ID">{viewDataset.raw.id}</Descriptions.Item>
                            <Descriptions.Item label="数据集所有者">{(viewDataset.raw && (viewDataset.raw.Owner || viewDataset.raw.owner)) || '-'}</Descriptions.Item>
                            <Descriptions.Item label="数据集名称">{(viewDataset.raw && (viewDataset.raw.DatasetName || viewDataset.raw.datasetName)) || viewDataset.name}</Descriptions.Item>
                            <Descriptions.Item label="数据集描述">{(viewDataset.raw && (viewDataset.raw.Description || viewDataset.raw.description)) || viewDataset.description}</Descriptions.Item>
                            <Descriptions.Item label="归口单位">{(viewDataset.raw && viewDataset.raw.Unit) || '-'}</Descriptions.Item>
                            <Descriptions.Item label="可见性">
                                {(() => {
                                    const raw = viewDataset.raw || {};
                                    const vis = (raw.VisibleStatus || raw.visibleStatus || viewDataset.visibleStatus || '').toString();
                                    const isPublic = (vis && vis.toUpperCase() === 'PUBLIC') || viewDataset.searchable;
                                    return (
                                        <div>
                                            <Tag color={isPublic ? 'green' : 'default'}>{isPublic ? '公开' : '非公开'}</Tag>
                                            {!isPublic && (
                                                <div style={{ color: '#888', marginTop: 8 }}>非公开仅限制用户搜索，若在数据集公开期间授权他人使用，那么数据集仍可使用，与状态无关</div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </Descriptions.Item>
                            <Descriptions.Item label="关键词">{(viewDataset.raw && (viewDataset.raw.Keyword || viewDataset.raw.keyword)) || '-'}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">{(viewDataset.raw && viewDataset.raw.createdAt) || viewDataset.createdTime || '-'}</Descriptions.Item>
                            <Descriptions.Item label="更新时间">{(viewDataset.raw && viewDataset.raw.updatedAt) || '-'}</Descriptions.Item>
                            <Descriptions.Item label="到期时间">{(viewDataset.raw && viewDataset.raw.ExpiredAt) || viewDataset.expiry || '-'}</Descriptions.Item>

                        </Descriptions>
                    )}
                </Modal>
            </div>
        </div >
    );
}

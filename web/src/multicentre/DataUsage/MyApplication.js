import React, { useEffect, useState } from 'react';
import { Card, Tabs, List, Table, Tag, Empty, Spin, Button, Modal, Typography, Row, Col, Input, Space, Avatar, Drawer, Form, InputNumber, DatePicker, Descriptions, Popover, Popconfirm, Timeline, Alert } from 'antd';
import moment from 'moment';
import * as MultiCenterBackend from '../../backend/MultiCenterBackend';
import * as Setting from '../../Setting';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, FileSearchOutlined, AppstoreOutlined, ShopOutlined, RocketOutlined, SearchOutlined, RightOutlined, TeamOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { MULTICENTER_ACCESS_REQUEST_STATUS, MULTICENTER_DATASET_VISIBLE_STATUS } from '../../const/MultiCenterConst';

const { Title, Text } = Typography;

const defaultNoneDay = '1970-01-01 00:00:00'
export default function MyApplication() {
    const [activeTab, setActiveTab] = useState(MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED);
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    const [data, setData] = useState({
        PENDING: [],
        APPROVED: [],
        REJECTED: [],
    });
    const [loading, setLoading] = useState({
        PENDING: false,
        APPROVED: false,
        REJECTED: false,
    });

    const [detailVisible, setDetailVisible] = useState(false);
    const [detailItem, setDetailItem] = useState(null);

    // dataset detail cache/loading state
    const [datasetDetailMap, setDatasetDetailMap] = useState({}); // id -> dataset (null means no-data)
    const [datasetDetailLoading, setDatasetDetailLoading] = useState(false);
    // dataset detail modal state
    const [datasetModalVisible, setDatasetModalVisible] = useState(false);
    const [datasetModalData, setDatasetModalData] = useState(null);
    // approval flow modal state
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [approvalTimeline, setApprovalTimeline] = useState([]);
    // granted assets (可用数据授权) state
    const [granted, setGranted] = useState([]);
    const [grantedLoading, setGrantedLoading] = useState(false);
    // request modal state for dataset detail + apply form
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [requestForm] = Form.useForm();

    // market modal state
    const [marketVisible, setMarketVisible] = useState(false);
    const [marketKeyword, setMarketKeyword] = useState('');
    const [marketLoading, setMarketLoading] = useState(false);
    const [marketResults, setMarketResults] = useState([]);
    // hover state for market list items
    const [hoveredItemId, setHoveredItemId] = useState(null);

    useEffect(() => {
        // load default tab
        loadTab(activeTab);

    }, []);

    async function loadTab(status) {

        if (!status) return;
        if (status === MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED) {
            loadGranted()
            return;
        }
        setLoading(prev => ({ ...prev, [status]: true }));
        try {
            const res = await MultiCenterBackend.getAccessRequestsByRequesterAndStatus(status);
            if (res && res.status === 'ok') {
                setData(prev => ({ ...prev, [status]: res.data || [] }));
            } else {
                Setting.showMessage('error', `获取申请失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setLoading(prev => ({ ...prev, [status]: false }));
        }
    }

    // load granted assets (可用数据授权) for requester
    async function loadGranted() {
        setGrantedLoading(true);
        try {
            const res = await MultiCenterBackend.getGrantedAssetsByRequester();
            if (res && res.status === 'ok') {
                const payload = res.data;
                let rows = [];

                // handle a few possible shapes from backend defensively
                if (Array.isArray(payload)) {
                    // array of { accessGrant, dataset } or array of pairs
                    rows = payload.map((item, idx) => {
                        const grant = item.accessGrant || item.grant || item.access_grant || item;
                        const dataset = item.dataset || item.dataSet || item;
                        return { grant, dataset, key: (grant && (grant.GrantId || grant.grantId)) || (dataset && (dataset.Id || dataset.id)) || `g-${idx}` };
                    });
                } else if (payload) {
                    // possible object with grants + datasets arrays
                    const grants = payload.accessGrants || payload.grants || payload.grantList || payload.grant || [];
                    const datasets = payload.datasets || payload.dataSets || payload.datasetList || [];
                    const map = {};
                    (datasets || []).forEach(ds => {
                        const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || '');
                        if (id) map[id] = ds;
                    });
                    rows = (grants || []).map((g) => {
                        const assetId = String(g.AssetId || g.assetId || g.Assetid || g.assetID || '');
                        return { grant: g, dataset: map[assetId] || null, key: (g.GrantId || g.grantId || assetId || Math.random()) };
                    });
                }

                setGranted(rows);
            } else {
                Setting.showMessage('error', `获取已授权列表失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setGrantedLoading(false);
        }
    }

    function tabTitle(icon, text, count) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {icon}
                <div>
                    <div style={{ fontWeight: 700 }}>{text}</div>

                </div>
            </div>
        );
    }

    function renderStatusTag(status) {
        if (!status) return null;
        const s = status.toString().toUpperCase();
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED) return <Tag icon={<CheckCircleOutlined />} color="success">已通过</Tag>;
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.PENDING) return <Tag icon={<ClockCircleOutlined />} color="default">待审核</Tag>;
        if (s === MULTICENTER_ACCESS_REQUEST_STATUS.REJECTED) return <Tag icon={<CloseCircleOutlined />} color="error">已拒绝</Tag>;
        return <Tag>{status}</Tag>;
    }

    const openDetail = (item) => {
        setDetailItem(item);
        setDetailVisible(true);
    };

    const closeDetail = () => {
        setDetailVisible(false);
        setDetailItem(null);
    };

    const openMarketModal = () => {
        setMarketVisible(true);
        // preload with empty keyword
        loadMarketResults('');
    };

    const closeMarketModal = () => {
        setMarketVisible(false);
        setMarketResults([]);
        setMarketKeyword('');
    };

    async function loadMarketResults(keyword) {
        // allow empty keyword
        setMarketLoading(true);
        try {
            const res = await MultiCenterBackend.searchDatasetsMarket(keyword === undefined || keyword === null ? '' : keyword);
            if (res && res.status === 'ok') {
                setMarketResults(res.data || []);
            } else {
                Setting.showMessage('error', `搜索市场失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setMarketLoading(false);
        }
    }

    const openRequestModalForDataset = (item) => {
        setSelectedDataset(item);
        // prefill request form defaults
        requestForm.resetFields();
        requestForm.setFieldsValue({ RequestedAccessCount: 1 });
        setRequestModalVisible(true);
    };

    const closeRequestModal = () => {
        setRequestModalVisible(false);
        setSelectedDataset(null);
    };

    const handleRequestSubmit = async () => {
        try {
            const values = await requestForm.validateFields();
            // validate RequestedDeadline < dataset expiry
            const expiryStr = (selectedDataset && (selectedDataset.ExpiredAt || selectedDataset.expiredAt || selectedDataset.ExpiredAt)) || '';
            if (values.RequestedDeadline && expiryStr) {
                const deadline = moment(values.RequestedDeadline);
                const expiry = moment(expiryStr, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601]);
                if (!deadline.isBefore(expiry)) {
                    Setting.showMessage('error', 'RequestedDeadline 必须早于数据集到期时间');
                    return;
                }
            }

            const payload = {
                assetId: selectedDataset && (selectedDataset.Id || selectedDataset.id || selectedDataset.ID || selectedDataset.DatasetId || selectedDataset.datasetId),
                requestedAccessCount: values.RequestedAccessCount,
                requestedDeadline: values.RequestedDeadline ? values.RequestedDeadline.format('YYYY-MM-DD HH:mm:ss') : undefined,
                requestReason: values.requestReason || '',
            };

            const res = await MultiCenterBackend.addAccessRequest(payload);
            if (res && res.status === 'ok') {
                Setting.showMessage('success', '申请提交成功');
                closeRequestModal();
            } else {
                Setting.showMessage('error', `申请提交失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            // validation error
        }
    };

    const counts = {
        PENDING: (data.PENDING || []).length,
        // APPROVED corresponds to granted assets now
        APPROVED: (granted || []).length || (data.APPROVED || []).length,
        REJECTED: (data.REJECTED || []).length,
    };

    // table columns for requests
    const tableColumns = [
        {
            title: '申请编号',
            dataIndex: 'requestId',
        },
        {
            title: '数据集ID',
            dataIndex: 'DatasetId',
            key: 'datasetId',
            render: (text, record, index) => {
                // prefer numeric asset id; fallback to request id; final fallback is row index to ensure uniqueness
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
                            // if cached, use it
                            if (datasetDetailMap[stableId]) {
                                setDatasetModalData(datasetDetailMap[stableId]);
                                return;
                            }
                            // fetch
                            setDatasetDetailLoading(true);
                            try {
                                // only fetch when we have a numeric dataset id
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
                                    // no numeric asset id, mark as no-data to avoid repeated fetches
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
                // 当PENDING时，显示审核中
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
            render: (text, record, index) => {
                const status = (record.requestStatus || record.RequestStatus || record.status || '').toString().toUpperCase();

                // helper to build a minimal dataset object from the request record
                const datasetFromRecord = () => {
                    return {
                        Id: record.assetId || record.AssetId || record.Assetid || record.AssetID || record.DatasetId || record.datasetId || record.RequestId || record.requestId,
                        DatasetName: record.DatasetName || record.datasetName || record.DatasetId || record.datasetId || '',
                        Description: record.Description || record.description || '',
                        ExpiredAt: record.ExpiredAt || record.expiredAt || '',
                        Owner: record.Owner || record.owner || ''
                    };
                };

                // 如果审批被拒绝，显示“重新填写”按钮，打开申请弹窗
                if (status === MULTICENTER_ACCESS_REQUEST_STATUS.REJECTED) {
                    return (
                        <Button type="link" onClick={async (e) => {
                            e.stopPropagation();
                            // open request modal and try to fetch full dataset info by id
                            const numericId = record.assetId || record.AssetId || record.Assetid || record.AssetID || record.DatasetId || record.datasetId || record.RequestId || record.requestId || null;
                            const stableId = numericId ? String(numericId) : `row-op-${index}`;
                            // reset form defaults
                            requestForm.resetFields();
                            requestForm.setFieldsValue({ RequestedAccessCount: 1 });
                            setSelectedDataset(null);
                            setRequestModalVisible(true);

                            if (numericId && !isNaN(Number(numericId))) {
                                setDatasetDetailLoading(true);
                                try {
                                    const idNum = Number(numericId);
                                    const res = await MultiCenterBackend.getDatasetById(idNum);
                                    if (res && res.status === 'ok') {
                                        setDatasetDetailMap(prev => ({ ...prev, [stableId]: res.data }));
                                        setSelectedDataset(res.data);
                                    } else {
                                        Setting.showMessage('error', `获取数据集详情失败: ${res ? res.msg : '未知错误'}`);
                                        // fallback to minimal dataset from record
                                        setSelectedDataset(datasetFromRecord());
                                    }
                                } catch (err) {
                                    Setting.showMessage('error', `无法连接服务器: ${err}`);
                                    setSelectedDataset(datasetFromRecord());
                                } finally {
                                    setDatasetDetailLoading(false);
                                }
                            } else {
                                // no numeric id, fallback to record-derived dataset
                                setSelectedDataset(datasetFromRecord());
                            }
                        }}>
                            重新填写
                        </Button>
                    );
                }

                // 如果申请正在进行中（PENDING），显示“取消申请”按钮并使用 Popconfirm
                if (status === MULTICENTER_ACCESS_REQUEST_STATUS.PENDING) {
                    const reqId = record.RequestId || record.requestId || record.ID || record.id;
                    return (
                        <Popconfirm
                            title="确定要取消该申请吗？"
                            onConfirm={async () => {
                                if (!reqId) {
                                    Setting.showMessage('error', '无法识别申请ID');
                                    return;
                                }
                                try {
                                    const res = await MultiCenterBackend.cancelAccessRequest(reqId);
                                    if (res && res.status === 'ok') {
                                        Setting.showMessage('success', '已取消申请');
                                        // reload current tab
                                        loadTab(activeTab);
                                    } else {
                                        Setting.showMessage('error', `取消申请失败: ${res ? res.msg : '未知错误'}`);
                                    }
                                } catch (e) {
                                    Setting.showMessage('error', `无法连接服务器: ${e}`);
                                }
                            }}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button type="link" onClick={(e) => e.stopPropagation()}>取消申请</Button>
                        </Popconfirm>
                    );
                }

                // 默认：提供查看详情操作（打开详情 Modal）
                return (
                    <Button type="link" onClick={(e) => { e.stopPropagation(); openDetail(record); }}>
                        查看
                    </Button>
                );
            }
        }
    ];


    async function loadMarketResults(keyword) {
        // allow empty keyword
        setMarketLoading(true);
        try {
            const res = await MultiCenterBackend.searchDatasetsMarket(keyword === undefined || keyword === null ? '' : keyword);
            if (res && res.status === 'ok') {
                setMarketResults(res.data || []);
            } else {
                Setting.showMessage('error', `搜索市场失败: ${res ? res.msg : '未知错误'}`);
            }
        } catch (e) {
            Setting.showMessage('error', `无法连接服务器: ${e}`);
        } finally {
            setMarketLoading(false);
        }
    }





    return (
        <div style={{ padding: 24 }}>
            <Row gutter={16} style={{ marginBottom: 18 }}>
                <Col span={18}>
                    <Title level={3} style={{ margin: 0 }}>
                        <AppstoreOutlined style={{ color: '#096dd9', marginRight: 8 }} /> 我的数据集申请
                    </Title>
                    <Text type="secondary">集中展示你发起的申请：可用 / 待对方审核 / 审核被拒绝，快速查看详情与状态。</Text>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                    <Button type="primary" icon={<FileSearchOutlined />} onClick={() => { if (activeTab === MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED) { loadGranted(); } else { loadTab(activeTab); } }}>
                        刷新当前列表
                    </Button>
                </Col>
            </Row>

            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 8px 30px rgba(9,45,117,0.04)' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => {
                        setActiveTab(key);
                        if (key === MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED) {
                            loadGranted();
                        } else {
                            loadTab(key);
                        }
                    }}
                >
                    <Tabs.TabPane tab={tabTitle(<CheckCircleOutlined style={{ fontSize: 18, color: '#13c2c2' }} />, '可用数据授权', counts.APPROVED)} key={MULTICENTER_ACCESS_REQUEST_STATUS.APPROVED}>
                        {/* Table for granted (可用数据授权) */}
                        <Alert showIcon={false} message="本页面展示的是您被授权访问的数据集授权工单信息，当审批通过后，系统自动流转审批工单至授权工单，为您开通授权。" type="success" banner />
                        <Table
                            columns={[
                                { title: '授权ID', dataIndex: ['grant', 'GrantId'], render: (v, row) => (row.grant && (row.grant.GrantId || row.grant.grantId || '-')) },

                                {
                                    title: '数据集名称与ID', render: (v, row) => {
                                        if (!row || !row.dataset) return '-';
                                        const ds = row.dataset;
                                        // try to find a numeric id from dataset or grant
                                        const numericId = ds.Id || ds.id || ds.DatasetId || ds.datasetId || (row.grant && (row.grant.AssetId || row.grant.assetId)) || null;
                                        const stableId = numericId ? String(numericId) : (ds.DatasetName || ds.datasetName || '-') + Math.random();

                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div>{ds.datasetName || ds.name || '-'}
                                                        &nbsp;
                                                        <span style={{ fontSize: '10px', color: 'gray' }}>(ID: {numericId || ds.id || ds.DatasetId || '-'})</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Button type="link" icon={<SearchOutlined />} onClick={async (e) => {
                                                        e.stopPropagation();
                                                        // open dataset modal; try cache first
                                                        setDatasetModalVisible(true);
                                                        setDatasetModalData(null);
                                                        if (datasetDetailMap[stableId]) {
                                                            setDatasetModalData(datasetDetailMap[stableId]);
                                                            return;
                                                        }
                                                        if (!numericId || isNaN(Number(numericId))) {
                                                            // no numeric id, mark as no-data and show fallback
                                                            setDatasetDetailMap(prev => ({ ...prev, [stableId]: null }));
                                                            Setting.showMessage('error', '无法识别数据集ID');
                                                            return;
                                                        }
                                                        setDatasetDetailLoading(true);
                                                        try {
                                                            const idNum = Number(numericId);
                                                            const res = await MultiCenterBackend.getDatasetById(idNum);
                                                            if (res && res.status === 'ok') {
                                                                setDatasetDetailMap(prev => ({ ...prev, [stableId]: res.data }));
                                                                setDatasetModalData(res.data);
                                                            } else {
                                                                Setting.showMessage('error', `获取数据集详情失败: ${res ? res.msg : '未知错误'}`);
                                                            }
                                                        } catch (err) {
                                                            Setting.showMessage('error', `无法连接服务器: ${err}`);
                                                        } finally {
                                                            setDatasetDetailLoading(false);
                                                        }
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    }
                                },
                                { title: '数据集归口单位', render: (v, row) => (row.dataset ? (row.dataset.Unit || row.dataset.unit || '-') : '-') },
                                { title: '总申请访问次数', render: (v, row) => (row.grant ? (row.grant.AccessCount || row.grant.accessCount || '-') : '-') },
                                { title: '授权截至时间', render: (v, row) => (row.grant ? (row.grant.Deadline || row.grant.deadline || '-') : '-') },
                                {
                                    title: '审批流程', render: (v, row) => {
                                        // show a text button that opens approval timeline modal
                                        // need to derive request id: prefer grant.RequestId or grant.requestId, fallback to null
                                        const reqId = (row.grant && (row.grant.RequestId || row.grant.requestId || row.grant.request_id)) || null;
                                        return (
                                            <Button type="link" onClick={async (e) => {
                                                e && e.stopPropagation();
                                                if (!reqId) {
                                                    Setting.showMessage('error', '无法识别申请ID');
                                                    return;
                                                }
                                                // open modal and load timeline
                                                setApprovalModalVisible(true);
                                                setApprovalTimeline([]);
                                                setApprovalLoading(true);
                                                try {
                                                    const res = await MultiCenterBackend.getAccessRequestByIdAndCurUser(reqId);
                                                    if (res && res.status === 'ok') {
                                                        const req = res.data;
                                                        // build timeline items
                                                        const items = [];
                                                        // 发起申请
                                                        items.push({
                                                            title: '发起申请',
                                                            time: req.requestedAt || req.RequestedAt || req.RequestedAt || '',
                                                            content: `申请人：${req.requester || req.Requester || '-'}；申请次数：${req.requestedAccessCount || req.RequestedAccessCount || '-'}；截至：${req.requestedDeadline || req.RequestedDeadline || '-'}；理由：${req.requestReason || req.RequestReason || '-'}`
                                                        });
                                                        // 指派/审核人信息
                                                        if (req.reviewer || req.Reviewer) {
                                                            items.push({
                                                                title: '指派审核',
                                                                time: '',
                                                                content: `审核人：${req.reviewer || req.Reviewer}`
                                                            });
                                                        }
                                                        // 审批结果
                                                        const status = (req.requestStatus || req.RequestStatus || '').toString().toUpperCase();
                                                        if (status && status !== '') {
                                                            items.push({
                                                                title: status === 'APPROVED' ? '审批通过' : (status === 'REJECTED' ? '审批拒绝' : status),
                                                                time: req.reviewedAt || req.ReviewedAt || req.reviewed_at || '',
                                                                content: `审核意见：${req.reviewComment || req.review_comment || '-'}`
                                                            });
                                                        }
                                                        setApprovalTimeline(items);
                                                    } else {
                                                        Setting.showMessage('error', `获取审批信息失败: ${res ? res.msg : '未知错误'}`);
                                                    }
                                                } catch (err) {
                                                    Setting.showMessage('error', `无法连接服务器: ${err}`);
                                                } finally {
                                                    setApprovalLoading(false);
                                                }
                                            }}>查看流程</Button>
                                        );
                                    }
                                },
                                {
                                    title: '操作', render: (v, row) => (
                                        <div>
                                            <Button type="link" key="query" onClick={(e) => {
                                                e.stopPropagation();
                                                try {
                                                    const id = row.dataset && (row.dataset.id);
                                                    if (!id) {
                                                        return;
                                                    }
                                                    const target = `/multi-center/data-workbench?datasetId=${encodeURIComponent(String(id))}`;
                                                    // navigate using react-router history when available, otherwise fallback to full page load
                                                    try {
                                                        if (history && typeof history.push === 'function') {
                                                            history.push(target);
                                                        } else if (typeof window !== 'undefined') {
                                                            window.location.href = target;
                                                        }
                                                    } catch (err) {
                                                        console.error('navigation error', err);
                                                        if (typeof window !== 'undefined') window.location.href = target;
                                                    }


                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }}>详细数据查询</Button>
                                        </div>
                                    )
                                }
                            ]}
                            dataSource={granted}
                            loading={grantedLoading}
                            pagination={{ pageSize: 10 }}
                            rowKey={(record) => record.key || (record.grant && (record.grant.GrantId || record.grant.grantId)) || Math.random()}
                        />
                    </Tabs.TabPane>

                    <Tabs.TabPane tab={tabTitle(<ClockCircleOutlined style={{ fontSize: 18, color: '#fa8c16' }} />, '待对方审核', counts.PENDING)} key={MULTICENTER_ACCESS_REQUEST_STATUS.PENDING}>
                        {/* Table for pending requests */}
                        <Table
                            columns={tableColumns}
                            dataSource={data.PENDING}
                            loading={loading.PENDING}
                            pagination={{ pageSize: 10 }}
                            rowKey={(record) => record.RequestId || record.requestId || record.ID || record.id || record.AssetId || record.assetId || Math.random()}
                        />
                    </Tabs.TabPane>

                    <Tabs.TabPane tab={tabTitle(<CloseCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />, '审核被拒绝', counts.REJECTED)} key={MULTICENTER_ACCESS_REQUEST_STATUS.REJECTED}>
                        {/* Table for rejected requests */}
                        <Table
                            columns={tableColumns}
                            dataSource={data.REJECTED}
                            loading={loading.REJECTED}
                            pagination={{ pageSize: 10 }}
                            rowKey={(record) => record.RequestId || record.requestId || record.ID || record.id || record.AssetId || record.assetId || Math.random()}
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Card>

            {/* flashy market card (bottom) */}
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', display: 'block' }}>
                <Card
                    hoverable

                    onClick={openMarketModal}
                    bodyStyle={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}
                    style={{
                        borderRadius: 16,
                        background: 'linear-gradient(90deg, #0047b3 0%, #00b4ff 100%)',
                        color: '#fff',
                        boxShadow: '0 12px 30px rgba(0,75,160,0.18)'
                    }}
                >
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>公开数据集市场</div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)' }}>探索并搜索所有公开的数据集 </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button type="default" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none' }} icon={<RightOutlined />}>进入市场</Button>

                    </div>
                </Card>
            </div>

            <Modal visible={detailVisible} title="申请详情" footer={[<Button key="close" onClick={closeDetail}>关闭</Button>]} onCancel={closeDetail} width={720}>
                {detailItem ? (
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{detailItem.DatasetName || detailItem.datasetName || detailItem.DatasetId || detailItem.datasetId || '数据集'}</div>
                        <div style={{ marginTop: 8 }}>{detailItem.Description || detailItem.description || '-'}</div>
                        <div style={{ marginTop: 12 }}>{renderStatusTag(detailItem.Status || detailItem.status)}</div>
                        <div style={{ marginTop: 12, color: '#888' }}>申请人：{detailItem.Requester || detailItem.requester || detailItem.User || '-'}</div>
                        <div style={{ marginTop: 6, color: '#888' }}>创建时间：{moment(detailItem.CreatedAt || detailItem.createdAt || detailItem.created || '').format('YYYY-MM-DD HH:mm:ss') || '-'}</div>
                        <div style={{ marginTop: 10 }}><Text strong>原始记录（JSON）</Text>
                            <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 10, borderRadius: 6, marginTop: 6 }}>{JSON.stringify(detailItem, null, 2)}</pre>
                        </div>
                    </div>
                ) : <Spin />}
            </Modal>

            {/* market drawer */}
            <Drawer
                visible={marketVisible}
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShopOutlined style={{ color: '#096dd9' }} /> 公开数据集市场</div>}
                onClose={closeMarketModal}
                footer={null}
                width={900}
                destroyOnClose
                // 从底部滑出
                placement="right"
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input.Search
                        placeholder="输入数据集名称，支持模糊查询，留空可检索全部"
                        allowClear
                        enterButton={<Button icon={<SearchOutlined />}>搜索</Button>}
                        value={marketKeyword}
                        onChange={(e) => setMarketKeyword(e.target.value)}
                        onSearch={(v) => loadMarketResults(v)}
                    />
                    <div style={{ fontSize: '12px', color: 'gray' }}>tips: 点击数据卡片可进行申请</div>

                    {marketLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                    ) : (marketResults || []).length === 0 ? (
                        <Empty description="未找到匹配的数据集" />
                    ) : (
                        <List
                            dataSource={marketResults}
                            renderItem={(item) => {
                                const unit = (item.Unit || item.unit) || '-';
                                const expiryRaw = (item.ExpiredAt || item.expiredAt) || '';
                                const expiry = expiryRaw ? moment(expiryRaw, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601]).format('YYYY-MM-DD HH:mm') : '-';
                                const stableId = item.Id || item.id || item.ID || item.DatasetId || item.datasetId || null;

                                return (
                                    <div
                                        onClick={() => openRequestModalForDataset(item)}
                                        onMouseEnter={() => setHoveredItemId(stableId)}
                                        onMouseLeave={() => setHoveredItemId(null)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f0f0f0',
                                            background: (hoveredItemId === stableId) ? '#fafafa' : undefined,
                                            transition: 'background 120ms ease-in-out'
                                        }}
                                    >
                                        <List.Item.Meta
                                            title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontWeight: 600 }}>{item.DatasetName || item.datasetName || item.DatasetId || item.datasetId || '数据集'}</div>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

                                                    <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); openRequestModalForDataset(item); }}>点击申请</Button>
                                                </div>
                                            </div>}
                                            description={<div>
                                                <div style={{ color: '#444' }}>{item.Description || item.description || (item.Keyword || item.keyword) || '-'}</div>
                                                <div style={{ marginTop: 8, color: '#888', display: 'flex', gap: 18, alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <TeamOutlined />
                                                        <span>归口单位：{unit}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <CalendarOutlined />
                                                        <span>到期时间：{expiry}</span>
                                                    </div>
                                                </div>
                                            </div>}
                                        />
                                    </div>
                                );
                            }}
                        />
                    )}
                </Space>
            </Drawer>

            {/* dataset detail & request modal */}
            <Modal
                visible={requestModalVisible}
                title={selectedDataset ? (selectedDataset.DatasetName || selectedDataset.datasetName || selectedDataset.DatasetId || selectedDataset.datasetId || '数据集') : '数据集'}
                onCancel={closeRequestModal}
                footer={null}
                width={900}
                destroyOnClose
            >
                {selectedDataset ? (
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div style={{ flex: 1, minWidth: 320 }}>
                            <div bordered={false} style={{ padding: 12 }}>
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="数据集名称">{selectedDataset.DatasetName || selectedDataset.datasetName || selectedDataset.DatasetId || selectedDataset.datasetId || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="描述">{selectedDataset.Description || selectedDataset.description || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="可见性">{((selectedDataset.VisibleStatus || selectedDataset.visibleStatus || '') || '').toUpperCase() === MULTICENTER_DATASET_VISIBLE_STATUS.PUBLIC ? '公开' : '非公开'}</Descriptions.Item>
                                    <Descriptions.Item label="关键词">{(selectedDataset.Keyword || selectedDataset.keyword) || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="到期时间">{(selectedDataset.ExpiredAt || selectedDataset.expiredAt) || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="所有者">{(selectedDataset.Owner || selectedDataset.owner) || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="归口单位">{(selectedDataset.Unit || selectedDataset.unit) || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="数据集 ID">{(selectedDataset.Id || selectedDataset.id || selectedDataset.ID || selectedDataset.DatasetId || selectedDataset.datasetId) || '-'}</Descriptions.Item>

                                </Descriptions>
                            </div>
                            <Alert message="如果您已经获得本数据集的授权，当本次申请通过时，此前的授权将被本次覆盖" type="info" banner />
                        </div>
                        <div style={{ width: 380 }}>
                            <Card bordered={true} style={{ padding: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>申请访问</div>
                                <Form layout="vertical" form={requestForm}>
                                    <Form.Item name="RequestedAccessCount" label="数据使用访问次数" rules={[{ required: true, message: '请输入申请次数' }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                        name="RequestedDeadline"
                                        label="数据使用截至时间"
                                        rules={[
                                            { required: true, message: '请选择数据使用截至时间' },
                                            {
                                                validator: (_, value) => {
                                                    if (!value) {
                                                        return Promise.reject('');
                                                    }
                                                    // must be after today (strictly greater than today)
                                                    if (!value.isAfter(moment(), 'day')) {
                                                        return Promise.reject('数据使用截至时间必须大于今天');
                                                    }
                                                    // if dataset has expiry, requested deadline must be <= expiry
                                                    const expiryStr = (selectedDataset && (selectedDataset.ExpiredAt || selectedDataset.expiredAt || selectedDataset.ExpiredAt)) || '';
                                                    if (expiryStr) {
                                                        console.log('expiryStr', expiryStr);
                                                        const expiry = moment(expiryStr, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601]);
                                                        if (!value.isBefore(expiry)) {
                                                            return Promise.reject('数据使用截至时间必须小于等于数据集到期时间');
                                                        }
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item name="requestReason" label="申请理由" rules={[{ required: true, message: '请输入申请理由' }]}>
                                        <Input.TextArea rows={4} />
                                    </Form.Item>
                                    <Form.Item>
                                        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button onClick={closeRequestModal}>取消</Button>
                                            <Button type="primary" onClick={handleRequestSubmit}>提交申请</Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </div>
                    </div>
                ) : <Spin />}
            </Modal>

            {/* approval flow modal */}
            <Modal
                visible={approvalModalVisible}
                title="审批流程"
                onCancel={() => setApprovalModalVisible(false)}
                footer={[<Button key="close" onClick={() => setApprovalModalVisible(false)}>关闭</Button>]}
                width={600}
            >
                {approvalLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : (
                    approvalTimeline && approvalTimeline.length > 0 ? (
                        <Timeline>
                            {approvalTimeline.map((it, idx) => (
                                <Timeline.Item key={idx}>
                                    <div style={{ fontWeight: 600 }}>{it.title}</div>
                                    <div style={{ color: '#888', fontSize: 12 }}>{it.time || ''}</div>
                                    <div style={{ marginTop: 6 }}>{it.content}</div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    ) : <div>暂无审批信息</div>
                )}
            </Modal>

            {/* dataset detail modal */}
            <Modal
                visible={datasetModalVisible}
                title="数据集详情"
                onCancel={() => setDatasetModalVisible(false)}
                footer={[<Button key="close" onClick={() => setDatasetModalVisible(false)}>关闭</Button>]}
                width={600}
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
        </div >
    );
}

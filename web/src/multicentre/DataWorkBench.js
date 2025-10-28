import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Progress, Alert, Dropdown, Menu, Segmented, Result, Spin, message, Modal } from "antd";
import * as MultiCenterBackend from "../backend/MultiCenterBackend";
import { SwapOutlined } from '@ant-design/icons';
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

export default function DataWorkBench(props) {
    const { account } = props;
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    const [showTable, setShowLimitData] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [usageLoading, setUsageLoading] = useState(false);
    // granted and managed datasets for menu
    const [grantedList, setGrantedList] = useState([]);
    const [managedList, setManagedList] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState('MCTest1');
    const [datasetSwitchVisible, setDatasetSwitchVisible] = useState(false);
    // 只存储 'structured' 或 'image'
    const [selectedData, setSelectedData] = useState('structured');
    const [checkingModal, setCheckingModal] = useState(false);
    // 图片预览相关
    const [previewImg, setPreviewImg] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    // 影像卡片超分状态与超分图片
    const [srMap, setSrMap] = useState({}); // { [id]: { url, done } }
    const handleMenuClick = ({ key }) => {
        // key is dataset id
        if (!key) return;
        // set selected dataset and refetch usage info for it
        setSelectedDatasetId(key);
        // re-fetch usage info if already showing
        if (showTable) {
            fetchUsageInfo();
        }
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.ItemGroup title="我获得授权的数据集">
                {menuLoading ? (
                    <Menu.Item key="loading-granted">加载中...</Menu.Item>
                ) : ((grantedList || []).length === 0 ? (
                    <Menu.Item key="no-granted">无已授权数据集</Menu.Item>
                ) : (
                    grantedList.map((item, idx) => {
                        const ds = item.dataset || item.dataSet || item || {};
                        const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || (item.accessGrant && (item.accessGrant.AssetId || item.accessGrant.assetId)) || `gr-${idx}`);
                        const name = ds.DatasetName || ds.datasetName || ds.name || (`数据集 ${id}`);
                        return <Menu.Item key={id}>{name}</Menu.Item>;
                    })
                ))}
            </Menu.ItemGroup>
            <Menu.Divider />
            <Menu.ItemGroup title="我管理的数据集">
                {menuLoading ? (
                    <Menu.Item key="loading-managed">加载中...</Menu.Item>
                ) : ((managedList || []).length === 0 ? (
                    <Menu.Item key="no-managed">无管理的数据集</Menu.Item>
                ) : (
                    managedList.map((ds, idx) => {
                        const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || `m-${idx}`);
                        const name = ds.DatasetName || ds.datasetName || ds.name || (`数据集 ${id}`);
                        return <Menu.Item key={id}>{name}</Menu.Item>;
                    })
                ))}
            </Menu.ItemGroup>
        </Menu>
    );
    // 你现在可以在组件内直接使用 accounts 变量
    // 例如：console.log(accounts);


    // 抽离数据用量信息请求逻辑
    const fetchUsageInfo = async () => {
        setUsageLoading(true);
        try {
            // 等待1s
            await new Promise(resolve => setTimeout(resolve, 1500));
            const resp = await MultiCenterBackend.queryDataSetsUsage(usageId);
            let info = null;
            if (resp?.data?.resultDecoded) {
                try {
                    info = JSON.parse(resp.data.resultDecoded);
                } catch (e) { }
            }
            setUsageInfo(info);
        } finally {
            setUsageLoading(false);
        }
    };

    // load granted assets and managed datasets to populate menu
    const loadDatasetsForMenu = async () => {
        setMenuLoading(true);
        try {
            const [grRes, mgRes] = await Promise.all([
                MultiCenterBackend.getGrantedAssetsByRequester(),
                MultiCenterBackend.getDatasets(),
            ]);

            // parse granted
            let grants = [];
            if (grRes && grRes.status === 'ok' && Array.isArray(grRes.data)) {
                grants = grRes.data;
            }
            setGrantedList(grants);

            // parse managed datasets
            let managed = [];
            if (mgRes && mgRes.status === 'ok' && Array.isArray(mgRes.data)) {
                managed = mgRes.data;
            }
            setManagedList(managed);
        } catch (e) {
            console.error('loadDatasetsForMenu error', e);
        } finally {
            setMenuLoading(false);
        }
    };

    // 点击确认查看时调用useDataSet
    const handleShowLimitData = async () => {
        // 如果当前选中的是我管理的数据集，则直接展示，不走受控访问流程
        if (isManagedSelected) {
            setShowLimitData(true);
            return;
        }

        setCheckingModal(true);
        try {
            // 等待1s
            await new Promise(resolve => setTimeout(resolve, 1000));
            const resp = await MultiCenterBackend.useDataSet(usageId, selectedDatasetId);
            const status = resp?.status?.toLowerCase?.() || resp?.data?.status?.toLowerCase?.();
            if (status === 'success' || status === 'ok') {
                setShowLimitData(true);
                fetchUsageInfo();
                // 等待2s后异步发送
                setTimeout(() => {
                    MultiCenterBackend.addDataUsageAuditRecord(account, usageId, selectedDatasetId);
                }, 2000);
            } else {
                message.error(resp?.msg || '操作失败');
            }
        } catch (e) {
            message.error(e?.message || '操作异常');
        } finally {
            setCheckingModal(false);
        }
    };



    useEffect(() => {
        // 页面加载时只调用一次
        fetchUsageInfo();
        loadDatasetsForMenu();
    }, []);

    const selectedDatasetName = (() => {
        const findInGranted = (grantedList || []).find(item => {
            const ds = item.dataset || item.dataSet || item || {};
            const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || (item.accessGrant && (item.accessGrant.AssetId || item.accessGrant.assetId)) || '');
            return id === String(selectedDatasetId);
        });
        if (findInGranted) {
            const ds = findInGranted.dataset || findInGranted.dataSet || findInGranted || {};
            return ds.DatasetName || ds.datasetName || ds.name || String(selectedDatasetId);
        }
        const findInManaged = (managedList || []).find(ds => String(ds.Id || ds.id || ds.DatasetId || ds.datasetId) === String(selectedDatasetId));
        if (findInManaged) return findInManaged.DatasetName || findInManaged.datasetName || findInManaged.name || String(selectedDatasetId);
        return String(selectedDatasetId || '数据集');
    })();

    // determine whether selected dataset is managed by current user or granted
    const selectedContext = (() => {
        const findInGranted = (grantedList || []).find(item => {
            const ds = item.dataset || item.dataSet || item || {};
            const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || (item.grant && (item.grant.AssetId || item.grant.assetId)) || '');
            return id === String(selectedDatasetId);
        });
        if (findInGranted) return { type: 'granted', item: findInGranted };
        const findInManaged = (managedList || []).find(ds => String(ds.Id || ds.id || ds.DatasetId || ds.datasetId) === String(selectedDatasetId));
        if (findInManaged) return { type: 'managed', dataset: findInManaged };
        return { type: 'unknown' };
    })();

    const isManagedSelected = selectedContext.type === 'managed';
    const selectedExpireTime = (() => {
        if (isManagedSelected) {
            const ds = selectedContext.dataset || {};
            console.log(ds);
            return ds.expiredAt || null;
        }
        return usageInfo ? usageInfo.ExpireTime : null;
    })();
    const selectedUseCountLeft = isManagedSelected ? '∞' : (usageInfo ? (usageInfo.UseCountLeft ?? '--') : '--');

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
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                    title="点击可刷新用量信息"
                    onClick={() => !usageLoading && fetchUsageInfo()}
                >
                    <Clock size={32} color="#428be5" />
                    <div>
                        <div style={{ color: '#888', fontSize: 16 }}>访问时间截止至 </div>
                        {usageLoading && !isManagedSelected ? (
                            <Spin size="small" style={{ marginTop: 4 }} />
                        ) : selectedExpireTime ? (
                            <div style={{ color: '#428be5', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{selectedExpireTime}</div>
                        ) : (
                            <div style={{ color: '#428be5', fontWeight: 700, fontSize: 22, marginTop: 4 }}>--</div>
                        )}
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
                    boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                    title="点击可刷新用量信息"
                    onClick={() => !usageLoading && fetchUsageInfo()}
                >
                    <Database size={32} color="#428be5" />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#888', fontSize: 16 }}>剩余数据查询次数 </div>
                        {usageLoading && !isManagedSelected ? (
                            <Spin size="small" style={{ marginTop: 4 }} />
                        ) : (
                            <div style={{ color: '#23408e', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{selectedUseCountLeft}</div>
                        )}
                        {/* <Progress percent={15} showInfo={false} strokeColor="#428be5" style={{ marginTop: 6, width: 120 }} /> */}
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
            {/* 切换数据集 Modal（替代 Dropdown） */}
            <Modal
                title="切换数据集"
                open={datasetSwitchVisible}
                onCancel={() => setDatasetSwitchVisible(false)}
                footer={null}
                width={720}
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: 20 }}
            >
                <div style={{ display: 'flex', gap: 12, flexDirection: 'column', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>我获得授权的数据集</div>
                    {menuLoading ? <div>加载中...</div> : (grantedList && grantedList.length > 0 ? grantedList.map((item, idx) => {
                        const ds = item.dataset || item.dataSet || item || {};
                        const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || (item.accessGrant && (item.accessGrant.AssetId || item.accessGrant.assetId)) || `gr-${idx}`);
                        const name = ds.DatasetName || ds.datasetName || ds.name || (`数据集 ${id}`);
                        const desc = ds.Description || ds.description || ds.Desc || (item.accessGrant && (item.accessGrant.Description || item.accessGrant.description)) || '未提供描述';
                        const grantId = String((item.accessGrant && (item.accessGrant.grantId || item.accessGrant.id || item.accessGrant.Id || item.accessGrant.GrantID || item.accessGrant.Grant)) || '—');
                        return (
                            <div key={id} style={{ padding: 10, borderRadius: 8, border: '1px solid #f0f0f0', background: 'white', cursor: 'pointer' }} onClick={() => { setSelectedDatasetId(id); setDatasetSwitchVisible(false); if (showTable) fetchUsageInfo(); }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{name}</div>
                                    <div style={{ color: '#888', fontSize: 12, background: '#f5f7fa', padding: '4px 8px', borderRadius: 12 }}>授权ID: {grantId} / 数据集ID: {id}</div>
                                </div>
                                <div style={{ color: '#666', marginTop: 8, lineHeight: 1.6 }}>{desc}</div>
                            </div>
                        );
                    }) : <div style={{ color: '#888' }}>无已授权数据集</div>)}

                    <div style={{ height: 8 }} />
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>我管理的数据集</div>
                    {menuLoading ? <div>加载中...</div> : (managedList && managedList.length > 0 ? managedList.map((ds, idx) => {
                        const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || `m-${idx}`);
                        const name = ds.DatasetName || ds.datasetName || ds.name || (`数据集 ${id}`);
                        const desc = ds.Description || ds.description || ds.Desc || '未提供描述';
                        return (
                            <div key={id} style={{ padding: 10, borderRadius: 8, border: '1px solid #f0f0f0', background: 'white', cursor: 'pointer' }} onClick={() => { setSelectedDatasetId(id); setDatasetSwitchVisible(false); if (showTable) fetchUsageInfo(); }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{name}</div>
                                    <div style={{ color: '#888', fontSize: 12, background: '#f5f7fa', padding: '4px 8px', borderRadius: 12 }}> 数据集ID: {id}</div>
                                </div>
                                <div style={{ color: '#666', marginTop: 8, lineHeight: 1.6 }}>{desc}</div>
                            </div>
                        );
                    }) : <div style={{ color: '#888' }}>无管理的数据集</div>)}
                </div>
            </Modal>

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
                            <span style={{ fontSize: 22, fontWeight: 700 }}>{selectedDatasetName}</span>
                            <Button type="text" onClick={() => setDatasetSwitchVisible(true)} style={{ marginLeft: 8, boxShadow: 'none', border: 'none', color: '#1890ff' }}>
                                <SwapOutlined style={{ fontSize: 14, marginRight: 6 }} /> 切换数据集
                            </Button>
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
                                <Button type="primary" onClick={handleShowLimitData} style={{ marginTop: 24 }}>确认查看</Button>
                            }
                        />
                        <Modal
                            open={checkingModal}
                            footer={null}
                            closable={false}
                            centered
                            maskClosable={false}
                            keyboard={false}
                            bodyStyle={{ textAlign: 'center', padding: 32 }}
                        >
                            <Spin size="large" style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>正在进行受控数据权限检查及记录…</div>
                        </Modal>
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
                            value={selectedData}
                            onChange={setSelectedData}
                        />
                        {selectedData === 'image' ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 32,
                                    marginTop: 8,
                                    minHeight: 200
                                }}>
                                    {/* 示例影像卡片数据，可替换为真实数据 */}
                                    {[
                                        { id: 'ECG001', patient: 'P001', date: '2025-09-10', src: './sample/sample_hr_input.png' },
                                        { id: 'ECG002', patient: 'P002', date: '2025-09-08', src: './sample/sample_lr_input.png' },
                                        { id: 'ECHO001', patient: 'P001', date: '2025-09-11', src: './sample/sample_hr_input.png' }
                                    ].map(item => {
                                        // 判断是否已超分
                                        const srInfo = srMap[item.id];
                                        let imgSrc = '';
                                        try {
                                            imgSrc = srInfo && srInfo.url ? srInfo.url : require(`${item.src}`);
                                        } catch (e) {
                                            imgSrc = srInfo && srInfo.url ? srInfo.url : '';
                                        }
                                        return (
                                            <div key={item.id} style={{
                                                width: 240,
                                                background: '#fff',
                                                borderRadius: 18,
                                                boxShadow: '0 2px 12px 0 rgba(66,139,229,0.08)',
                                                border: '1.5px solid #e6eaf1',
                                                padding: 18,
                                                marginBottom: 8,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                position: 'relative',
                                            }}>
                                                <div style={{
                                                    width: 180,
                                                    height: 120,
                                                    background: '#111',
                                                    borderRadius: 12,
                                                    marginBottom: 12,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}>
                                                    <img
                                                        src={imgSrc}
                                                        alt={item.id}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, opacity: 0.85 }}
                                                        onClick={() => { setPreviewImg(imgSrc); setPreviewOpen(true); }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: '50%',
                                                        top: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        background: srInfo && srInfo.done ? '#d4fbe5' : '#f5f6fa',
                                                        color: srInfo && srInfo.done ? '#20c997' : '#428be5',
                                                        borderRadius: 8,
                                                        padding: '2px 12px',
                                                        fontSize: 15,
                                                        fontWeight: 500,
                                                        pointerEvents: 'none',
                                                        border: srInfo && srInfo.done ? '1.5px solid #20c997' : undefined
                                                    }}>{srInfo && srInfo.done ? '超分完成' : '低分辨率'}</span>
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{item.id}</div>
                                                <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>患者: {item.patient} | 日期: {item.date}</div>
                                                <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
                                                    <Button icon={<span role="img" aria-label="eye">👁️</span>} style={{ fontWeight: 500, borderRadius: 8, borderColor: '#e6eaf1', color: '#222', background: '#fff' }}
                                                        onClick={() => {
                                                            setPreviewImg(imgSrc);
                                                            setPreviewOpen(true);
                                                        }}
                                                    >查看</Button>
                                                    {/* 仅未超分时显示AI超分按钮 */}
                                                    {!(srInfo && srInfo.done) && (
                                                        <Button
                                                            icon={<span role="img" aria-label="ai">🪄</span>}
                                                            style={{ fontWeight: 500, borderRadius: 8, background: 'linear-gradient(90deg,#a259e4 0%,#f857a6 100%)', color: '#fff', border: 'none' }}
                                                            onClick={async () => {
                                                                let originImg = '';
                                                                try {
                                                                    originImg = require(`${item.src}`);
                                                                } catch (e) {
                                                                    originImg = '';
                                                                }
                                                                if (!originImg) {
                                                                    message.error('图片资源不存在');
                                                                    return;
                                                                }
                                                                try {
                                                                    message.loading({ content: 'AI超分处理中...', key: 'ai-sr', duration: 0 });
                                                                    const res = await fetch(originImg);
                                                                    const blob = await res.blob();
                                                                    const srResult = await MultiCenterBackend.generateSRPicture(blob);
                                                                    // 假设 srResult 是 Blob 或 ArrayBuffer
                                                                    let srUrl = '';
                                                                    const srBlob = await srResult.blob();
                                                                    srUrl = URL.createObjectURL(srBlob);
                                                                    setSrMap(prev => ({ ...prev, [item.id]: { url: srUrl, done: true } }));
                                                                    setPreviewImg(srUrl);
                                                                    setPreviewOpen(true);
                                                                    message.success({ content: 'AI超分完成', key: 'ai-sr' });
                                                                } catch (e) {
                                                                    message.error({ content: 'AI超分失败', key: 'ai-sr' });
                                                                    console.error(e);
                                                                }
                                                            }}
                                                        >AI超分</Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Modal
                                    open={previewOpen}
                                    footer={null}
                                    onCancel={() => setPreviewOpen(false)}
                                    centered
                                    bodyStyle={{ padding: 0, background: '#111', textAlign: 'center' }}
                                    width={600}
                                >
                                    {previewImg && (
                                        <img src={previewImg} alt="预览" style={{ maxWidth: '100%', maxHeight: 480, margin: '32px auto', display: 'block', borderRadius: 12 }} />
                                    )}
                                </Modal>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 18 }}>
                                    {usageLoading ? (
                                        <div ></div>
                                    ) : usageInfo ? (
                                        <div>
                                            {/* <div style={{ fontSize: 16, color: '#23408e', fontWeight: 600 }}>
                                                剩余可用次数：{usageInfo.UseCountLeft}
                                            </div>
                                            <div style={{ fontSize: 16, color: '#23408e', fontWeight: 600 }}>
                                                到期时间：{usageInfo.ExpireTime}
                                            </div> */}
                                        </div>
                                    ) : null}
                                </div>
                                <Table columns={columns} dataSource={data} pagination={false} bordered rowKey="id" style={{ marginTop: 18 }} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 安全提醒 */}
            <div style={{ background: '#fff7e6', borderRadius: 16, padding: 28, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <ShieldCheck size={28} color="#faad14" style={{ marginTop: 2 }} />
                <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#d48806', marginBottom: 4 }}>安全提醒</div>
                    <div style={{ color: '#444', fontSize: 16, lineHeight: 1.7 }}>
                        您的所有操作都在安全环境中进行，数据受控访问。所有访问行为已记录在区块链上，确保全程可追溯。
                    </div>
                </div>
            </div>
        </div>
    );
}


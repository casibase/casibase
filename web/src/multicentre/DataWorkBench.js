import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Progress, Alert, Dropdown, Menu, Segmented, Result, Spin, message, Modal, Tooltip } from "antd";
import * as MultiCenterBackend from "../backend/MultiCenterBackend";
import { SwapOutlined } from '@ant-design/icons';
import { Clock, Database, ShieldCheck, Link2, Image } from 'lucide-react';

const usageId = "use_test_001"

const columnsMap = {
    "consultationTime": "就诊时间",
    "correlationId": "关联ID",
    "diagnosis": "诊断",
    "localDBIndex": "本地数据库索引",
    "patientName": "患者姓名",
    "section": "就诊单位",
    "unit": "就诊科室"
};

const data = [

];

export default function DataWorkBench(props) {
    const { account } = props;
    const isUserTagAdmin = account?.tag?.includes('admin');
    const history = typeof window !== 'undefined' && window.history && window.location ? require('react-router-dom').useHistory() : null;
    // try read dataset id from route query params: ?datasetId=xxx or ?id=xxx
    const routeRequestedDatasetId = (() => {
        try {
            if (typeof window === 'undefined') return -1;
            const sp = new URLSearchParams(window.location.search || '');


            return sp.get('datasetId') || -1;
        } catch (e) { return -1; }
    })();
    const [showTable, setShowLimitData] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [usageLoading, setUsageLoading] = useState(false);
    // granted and managed datasets for menu
    const [grantedList, setGrantedList] = useState([]);
    const [managedList, setManagedList] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState('请选择数据集');
    const [datasetSwitchVisible, setDatasetSwitchVisible] = useState(false);
    // when true modal cannot be closed until user selects a dataset
    const [datasetSwitchLocked, setDatasetSwitchLocked] = useState(false);
    // 只存储 'structured' 或 'image'
    const [selectedData, setSelectedData] = useState('structured');
    const [checkingModal, setCheckingModal] = useState(false);
    const [datasetSourceLoading, setDatasetSourceLoading] = useState(false);
    // store the full response from check-and-get-dataset-source: { status, msg, data, data2 }
    const [datasetSourceResp, setDatasetSourceResp] = useState(null);
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
        setSelectedData('structured');
        // re-fetch usage info if already showing
        if (showTable) {
            fetchUsageInfo();
        }
    };

    // normalize various backend usage shapes to a stable UI shape
    const normalizeUsage = (d) => {
        if (!d) return null;
        return {
            UseCountLeft: (d.leftCnt ?? d.UseCountLeft ?? d.useCountLeft ?? d.LeftCnt ?? null),
            ExpireTime: (d.expireTime ?? d.ExpireTime ?? d.expire_time ?? d.ExpiredAt ?? null),
            // keep original data for debugging if needed
            _raw: d,
        };
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
    // 改为调用后端 checkUsage 接口：仅当当前选中的是“授权的数据集”时，提取 grantId 并传入；否则清空 usageInfo（显示 --）
    const fetchUsageInfo = async (grantIDPass) => {
        setUsageLoading(true);
        try {
            // try to derive grantId from selectedContext (must be 'granted')
            // small debounce to avoid UI flicker
            await new Promise(resolve => setTimeout(resolve, 1000));
            let grantId = null;

            try {
                if (selectedContext && selectedContext.type === 'granted' && selectedContext.item) {
                    const ag = selectedContext.item.accessGrant || selectedContext.item.grant || selectedContext.item.grant || {};
                    grantId = String(ag.grantId || ag.id || ag.Id || ag.GrantID || ag.Grant || ag.grantedId || ag.GrantId || ag.GrantId || '');
                    if (!grantId) grantId = null;
                }
            } catch (e) {
                grantId = null;
            }
            if (!grantId && grantIDPass) {
                grantId = grantIDPass;
            }

            if (!grantId) {
                // not an authorized/granted dataset selection -> show dashes
                setUsageInfo(null);
                return;
            }


            const resp = await MultiCenterBackend.checkUsage(grantId);
            if (resp && resp.status === 'ok' && resp.data) {
                setUsageInfo(normalizeUsage(resp.data));
            } else {
                setUsageInfo(null);
            }
        } catch (e) {
            console.error('fetchUsageInfo error', e);
            setUsageInfo(null);
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

            // after both lists are loaded, if routeRequestedDatasetId exists, try auto-select
            if (routeRequestedDatasetId) {
                const foundInGranted = (grants || []).find(item => {
                    const ds = item.dataset || item.dataSet || item || {};
                    const id = String(ds.Id || ds.id || ds.DatasetId || ds.datasetId || (item.accessGrant && (item.accessGrant.AssetId || item.accessGrant.assetId)) || '');
                    return id === String(routeRequestedDatasetId);
                });
                if (foundInGranted) {
                    setSelectedDatasetId(String(routeRequestedDatasetId));

                    const grantId = String(foundInGranted.accessGrant && (foundInGranted.accessGrant.GrantId || foundInGranted.accessGrant.grantId));
                    fetchUsageInfo(grantId);
                    setSelectedData('structured');
                    return;
                }
                const foundInManaged = (managed || []).find(ds => String(ds.Id || ds.id || ds.DatasetId || ds.datasetId) === String(routeRequestedDatasetId));
                if (foundInManaged) {
                    setSelectedDatasetId(String(routeRequestedDatasetId));
                    // 获取数据
                    fetchDatasetSource(false, String(routeRequestedDatasetId));
                    setSelectedData('structured');
                    return;
                }
                // if routeRequestedDatasetId provided but not found, force open modal and lock it
                setDatasetSwitchVisible(true);
                setDatasetSwitchLocked(true);

                return;
            }

            // if no route param and no selection yet, open modal and lock it
            if (!selectedDatasetId || selectedDatasetId === '') {
                setDatasetSwitchVisible(true);
                setDatasetSwitchLocked(true);
            }
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
        // 对于授权数据集，先调用 check-and-get-dataset-source
        try {
            // try to get grantId from selectedContext
            let grantId = null;
            if (selectedContext && selectedContext.type === 'granted' && selectedContext.item) {
                const ag = selectedContext.item.accessGrant || selectedContext.item.grant || selectedContext.item.accessGrant || {};
                grantId = String(ag.grantId || ag.id || ag.Id || ag.GrantID || ag.Grant || ag.grantedId || ag.GrantId || '');
                if (!grantId) grantId = null;
            }
            // fallback: use selectedDatasetId if grantId not found
            const idToCheck = grantId || selectedDatasetId;
            if (!idToCheck) {
                message.error('无法解析授权ID');
                return;
            }
            // proceed to useDataSet flow
            setCheckingModal(true);
            setDatasetSourceLoading(true);
            const chk = await MultiCenterBackend.checkAndGetDatasetSource(true, idToCheck);
            setDatasetSourceLoading(false);
            if (!chk || (chk.status && chk.status !== 'ok')) {
                message.error(chk?.msg || '受控数据源检查失败');
                return;
            }
            // 如果返回了data，则尝试更新usageInfo以显示到期/次数等
            if (chk) {
                setDatasetSourceResp(chk);
                if (chk.data) setUsageInfo(chk.data);
            }
            setShowLimitData(true);
            fetchUsageInfo();


        } catch (e) {
            setDatasetSourceLoading(false);
            message.error(e?.message || '受控数据源检查异常');
        } finally {
            setCheckingModal(false);
        }
    };

    // fetch dataset source (check-and-get-dataset-source)
    const fetchDatasetSource = async (isGrantedFlag, id) => {
        if (!id) return null;
        setDatasetSourceLoading(true);
        try {
            const resp = await MultiCenterBackend.checkAndGetDatasetSource(isGrantedFlag, id);
            if (resp) {
                setDatasetSourceResp(resp);
                if (resp.status === 'ok') {
                    // populate usageInfo if provided
                    if (resp.data) setUsageInfo(resp.data);
                    return resp.data || null;
                }
                return null;
            } else {
                message.error(resp?.msg || '获取数据源信息失败');
                return null;
            }
        } catch (e) {
            message.error(e?.message || '获取数据源信息异常');
            return null;
        } finally {
            setDatasetSourceLoading(false);
        }
    };



    useEffect(() => {
        // 页面加载时只调用一次
        // fetchUsageInfo();
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

    // whether the currently selected dataset contains image data (title contains '影像')
    const selectedHasImage = (() => {
        try {
            if (!selectedDatasetName) return false;
            return String(selectedDatasetName).includes('影像');
        } catch (e) { return false; }
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
    const shouldShowTable = showTable || isManagedSelected;

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
                    {isUserTagAdmin && <div
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
                    </div>}
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
                // onCancel={() => { if (!datasetSwitchLocked) setDatasetSwitchVisible(false); }}
                onCancel={() => { setDatasetSwitchVisible(false); }}
                footer={null}
                width={720}
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: 20 }}
                // maskClosable={!datasetSwitchLocked}
                keyboard={!datasetSwitchLocked}
            // closable={!datasetSwitchLocked}
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
                            <div key={id} style={{ padding: 10, borderRadius: 8, border: '1px solid #f0f0f0', background: 'white', cursor: 'pointer' }} onClick={() => {
                                setShowLimitData(false);
                                setSelectedDatasetId(id); setSelectedData('structured'); setDatasetSwitchVisible(false); setDatasetSwitchLocked(false); fetchUsageInfo(grantId)
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{name}</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <div style={{ color: '#888', fontSize: 12, background: '#f5f7fa', padding: '4px 8px', borderRadius: 12 }}>授权ID: {grantId}</div>
                                        <div style={{ color: '#888', fontSize: 12, background: '#f5f7fa', padding: '4px 8px', borderRadius: 12 }}>数据集ID: {id}</div>
                                    </div>
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
                            <div key={id} style={{ padding: 10, borderRadius: 8, border: '1px solid #f0f0f0', background: 'white', cursor: 'pointer' }} onClick={() => { setSelectedDatasetId(id); setSelectedData('structured'); setDatasetSwitchVisible(false); setDatasetSwitchLocked(false); if (showTable) fetchUsageInfo(); fetchDatasetSource(false, id); }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{name}</div>
                                    <div style={{ color: '#888', fontSize: 12, background: '#f5f7fa', padding: '4px 8px', borderRadius: 12 }}> 数据集ID: {id}</div>
                                </div>
                                <div style={{ color: '#666', marginTop: 8, lineHeight: 1.6 }}>{desc}</div>
                            </div>
                        );
                    }) : <div style={{ color: '#888' }}>无管理的数据集</div>)}
                </div>
                {/* Modal 底部退出按钮 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button onClick={() => {
                        // // 关闭 modal 并返回上一页（优先使用 history.goBack）
                        // setDatasetSwitchVisible(false);
                        // setDatasetSwitchLocked(false);
                        // try {
                        //     if (history && typeof history.goBack === 'function') {
                        //         history.goBack();
                        //     } else if (history && typeof history.push === 'function') {
                        //         history.push('/multi-center');
                        //     } else {
                        //         window.history.back();
                        //     }
                        // } catch (e) {
                        //     window.history.back();
                        // }
                        setDatasetSwitchVisible(false)
                    }}>退出</Button>
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
                            <Button type="text" onClick={() => { setDatasetSwitchVisible(true); loadDatasetsForMenu(); }} style={{ marginLeft: 8, boxShadow: 'none', border: 'none', color: '#1890ff' }}>
                                <SwapOutlined style={{ fontSize: 14, marginRight: 6 }} /> 切换数据集
                            </Button>
                        </div>
                    </div>
                    <Tag color="#20c997" style={{ fontSize: 16, padding: '2px 14px', borderRadius: 16, fontWeight: 500, marginLeft: 16, verticalAlign: 'middle' }}>
                        <ShieldCheck size={16} style={{ marginRight: 4, verticalAlign: -2 }} /> 安全访问中
                    </Tag>
                </div>
                {!shouldShowTable ? (
                    (selectedDatasetId === '请选择数据集' || !selectedDatasetId) ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>请选择数据集</div>
                            <div style={{ color: '#666', marginBottom: 18 }}>请先选择要查看的数据集</div>
                            <Button type="primary" onClick={() => { setDatasetSwitchVisible(true); setDatasetSwitchLocked(true); loadDatasetsForMenu(); }}>切换数据集</Button>
                        </div>
                    ) : (
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
                    )
                ) : (
                    <div>
                        {
                            (() => {
                                const imageLabel = <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Image size={20} />医疗影像</span>;
                                const imageLabelNode = selectedHasImage ? imageLabel : <Tooltip title="本数据集无影像数据">{imageLabel}</Tooltip>;
                                const segOptions = [
                                    { label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Database size={20} />结构化数据</span>, value: 'structured' },
                                    { label: imageLabelNode, value: 'image', disabled: !selectedHasImage }
                                ];
                                return (
                                    <Segmented
                                        options={segOptions}
                                        block
                                        style={{ width: '100%', marginBottom: 18, display: datasetSourceResp?.status === 'ok' ? 'block' : 'none' }}
                                        value={selectedData}
                                        onChange={(v) => { if (v === 'image' && !selectedHasImage) return; setSelectedData(v); }}
                                    />
                                );
                            })()
                        }
                        {selectedData === 'image' ? (
                            <div >

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
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 18 }}>
                                    {usageLoading ? (
                                        <div ></div>
                                    ) : usageInfo ? (
                                        <div>
                                            {/* usageInfo may show expire/usecount if available */}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Render dataset source table when available */}
                                {datasetSourceLoading ? (
                                    <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
                                ) : datasetSourceResp ? (
                                    datasetSourceResp.status === 'ok' ? (
                                        datasetSourceResp.data == null ? (
                                            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>当前数据集无数据</div>
                                        ) : (
                                            (() => {
                                                // datasetSourceResp.data is an array of records, each has an 'object' field which is a JSON string
                                                const rows = [];
                                                const colSet = new Set();
                                                try {
                                                    (datasetSourceResp.data || []).forEach((rec, idx) => {
                                                        let obj = {};
                                                        if (rec.object) {
                                                            try {
                                                                obj = JSON.parse(rec.object);
                                                            } catch (e) {
                                                                // if object is already an object
                                                                obj = rec.object;
                                                            }
                                                        }
                                                        // record-level fields (optional) can be merged
                                                        // use parsed object as the row
                                                        rows.push({ ...obj, _rowIndex: idx });
                                                        Object.keys(obj || {}).forEach(k => colSet.add(k));
                                                    });
                                                } catch (e) {
                                                    console.error('failed to parse dataset source data', e);
                                                }
                                                const dynamicCols = Array.from(colSet).map(k => ({ title: (columnsMap[k] || k), dataIndex: k, key: k, render: v => (v === null || typeof v === 'undefined') ? '' : String(v) }));
                                                // ensure stable order: sort keys alphabetically
                                                dynamicCols.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));

                                                // 每列最大宽度（px）
                                                const maxColWidth = 200;
                                                // 当列较多时，每列的最小期望宽度（用于计算表格的 minWidth，以触发横向滚动）
                                                const preferredColWidth = 150;
                                                const totalMinWidth = dynamicCols.length * preferredColWidth;

                                                // 给每列附加 cell 样式，限制最大宽度并允许换行展示完整内容
                                                const colsWithCellStyle = dynamicCols.map(col => ({
                                                    ...col,
                                                    onHeaderCell: () => ({
                                                        style: {
                                                            maxWidth: maxColWidth,
                                                            whiteSpace: 'normal',
                                                            wordBreak: 'break-word',
                                                        }
                                                    }),
                                                    onCell: () => ({
                                                        style: {
                                                            maxWidth: maxColWidth,
                                                            whiteSpace: 'normal',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'anywhere',
                                                        }
                                                    })
                                                }));

                                                return (
                                                    <div style={{ marginTop: 18, overflowX: 'auto' }}>
                                                        <Table
                                                            columns={colsWithCellStyle}
                                                            dataSource={rows}
                                                            pagination={false}
                                                            bordered
                                                            rowKey="_rowIndex"
                                                            tableLayout="fixed" // 平均分配列宽
                                                            style={{ width: '100%', minWidth: `${totalMinWidth}px` }}
                                                        />
                                                    </div>
                                                );
                                            })()
                                        )
                                    ) : (
                                        <Result
                                            status="error"
                                            title={datasetSourceResp.msg || '获取数据失败'}
                                            subTitle="无法加载数据源，请检查权限或稍后重试。"
                                            extra={[

                                                <Button key="switch" onClick={() => { setDatasetSourceResp(null); setDatasetSwitchVisible(true); setDatasetSwitchLocked(false); loadDatasetsForMenu(); }}>切换数据集</Button>
                                            ]}
                                        />
                                    )
                                ) : (
                                    // fallback: no datasetSourceResp yet — show placeholder table
                                    <div>
                                        数据获取异常，请切换数据集稍后再试
                                    </div>
                                )}
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


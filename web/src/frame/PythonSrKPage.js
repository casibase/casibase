// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import { Card, Button, Checkbox, Select, Input, Progress, Space, Row, Col, message, Modal, Tag, Descriptions, Divider, Table, Tooltip, Alert } from "antd";
import { UserOutlined, FileTextOutlined, MedicineBoxOutlined, SearchOutlined, SendOutlined, CheckOutlined, CloseOutlined, EyeOutlined, EditOutlined, LockOutlined, UnlockOutlined, LinkOutlined } from "@ant-design/icons";
import * as Setting from "../Setting";
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

// 关系类型映射
const RELATION_TYPE_MAP = {
    'disease_diagdisease': '有诊断意义的阳性特征-体征',
    'disease_differential': '鉴别诊断',
    'disease_surgery': '关联手术',
    'disease_discipline': '所属学科'
};

// 关系类型中文名称
const RELATION_TYPE_NAMES = {
    'disease_diagdisease': '有诊断意义的阳性特征-体征',
    'disease_differential': '鉴别诊断',
    'disease_surgery': '关联手术',
    'disease_discipline': '所属学科'
};

class PythonSrKPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            classes: props,
            searchDiseaseName: '', // 查询专病医学概念
            knowledgeRecords: [], // 查询到的知识记录
            relationTypes: [], // 关系类型列表 [{relation: 'xxx', count: 0, organization: 'xxx', hasPermission: false, shareCount: 0}]
            isLoading: false,

            // 协同诊疗相关状态
            collaborationForm: {
                selectedHospitals: [],
                selectedDoctors: [], // [{hospitalName: 'xxx', doctorId: 'owner/name', doctorName: 'xxx'}, ...]
                selectedRelationTypes: [], // 选择的关系类型
                description: ''
            },
            isSubmittingCollaboration: false,
            // 医院医生映射：{hospitalName: [doctors]}
            hospitalDoctorsMap: {},
            isLoadingDoctors: false,

            // 医生发起的协同诊疗请求
            myCollaborationRequests: [],
            isLoadingMyRequests: false,

            // 针对本医院的协同诊疗请求
            hospitalCollaborationRequests: [],
            isLoadingHospitalRequests: false,
            // 针对当前医生的协同诊疗请求
            doctorCollaborationRequests: [],
            isLoadingDoctorRequests: false,

            // 当前查询的专病名称
            currentDiseaseName: null,

            // 查看三元组详情
            selectedRelationType: null,
            showTriplesModal: false,
            triples: [], // 三元组列表

            // 诊疗意见相关
            selectedRequest: null,
            showRequestModal: false,
            showOpinionModal: false,
            diagnosisOpinion: {
                opinion: '',
                diagnosis: '',
                treatmentSuggestion: ''
            },
            isSubmittingOpinion: false,

            // 查看诊疗意见
            selectedRequestForOpinions: null,
            showOpinionsModal: false,
            diagnosisOpinions: [],
            isLoadingOpinions: false,

            // 共享知识相关
            selectedRequestForShare: null,
            showShareModal: false,
            shareTriples: [], // 待共享的三元组
            isSubmittingShare: false,
        };
        this.formRef = React.createRef();
    }

    renderUserInfoCard = () => {
        const { account } = this.props;
        const originalUserTag = account?.tag || "";
        const normalizedUserTag = originalUserTag.toLowerCase();

        let cardTitle = "操作员信息";
        let buttonText = "编辑操作员信息";

        if (normalizedUserTag === "admin") {
            cardTitle = "管理员信息";
            buttonText = "编辑管理员信息";
        }

        return (
            <Card
                title={
                    <Space>
                        <UserOutlined style={{ color: '#165DFF' }} />
                        {cardTitle}
                    </Space>
                }
                style={{ marginBottom: '24px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    {normalizedUserTag !== "admin" && (
                        <UserOutlined style={{ fontSize: '48px', color: '#165DFF', marginBottom: '12px' }} />
                    )}
                    <h4 style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>
                        {account?.displayName || account?.name || '未知用户'}
                    </h4>
                    <p style={{ color: '#86909C', margin: '4px 0 0 0' }}>
                        ID: {account?.id || account?.name || 'N/A'}
                    </p>
                </div>

                <Space direction="vertical" style={{ width: '100%' }}>
                    {normalizedUserTag === "admin" ? (
                        null
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ color: '#86909C' }}>工作单位</span>
                                <span>{account?.affiliation || '未设置'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span style={{ color: '#86909C' }}>联系方式</span>
                                <span>{account?.phone || account?.email || '未设置'}</span>
                            </div>
                        </>
                    )}
                </Space>

                <Button
                    type="primary"
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => Setting.openLink(Setting.getMyProfileUrl(account))}
                >
                    {buttonText}
                </Button>
            </Card>
        );
    }

    // 安全解析就诊记录的object字段
    safeParseRecordObject = (objectStr) => {
        if (!objectStr || typeof objectStr !== 'string') {
            return null;
        }

        try {
            const normalized = objectStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            return JSON.parse(normalized);
        } catch (error) {
            console.error('解析记录object字段失败:', error);
            return null;
        }
    }

    // 查询专病医学概念知识
    searchDiseaseKnowledge = async () => {
        const { searchDiseaseName } = this.state;
        const trimmedDiseaseName = (searchDiseaseName || '').trim();

        if (!trimmedDiseaseName) {
            message.warning('请输入待查询专病医学概念');
            return;
        }

        this.setState({
            isLoading: true,
            knowledgeRecords: [],
            relationTypes: [],
            currentDiseaseName: null
        });

        try {
            console.log('开始查询专病医学概念知识:', trimmedDiseaseName);

            // 使用后端提供的 search-disease-knowledge API
            const response = await fetch(`${Setting.ServerUrl}/api/search-disease-knowledge?diseaseName=${encodeURIComponent(trimmedDiseaseName)}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const res = await response.json();
            console.log('API响应数据:', res);

            if (res.status === 'ok') {
                const records = res.data || [];
                console.log('获取到的知识记录数量:', records.length);

                if (records.length === 0) {
                    message.warning('未找到该专病的知识记录');
                    this.setState({ knowledgeRecords: [], relationTypes: [] });
                    return;
                }

                // 解析记录中的三元组数据
                const relationTypesMap = this.extractRelationTypesFromRecords(records);
                const relationTypes = Array.from(relationTypesMap.values());

                // 获取共享次数统计
                await this.updateShareCounts(relationTypes, trimmedDiseaseName);

                // 更新权限：检查是否有共享知识，如果有则更新可访问的医院列表
                await this.updatePermissionsFromSharedKnowledge(relationTypes, trimmedDiseaseName);

                this.setState({
                    knowledgeRecords: records,
                    relationTypes: relationTypes,
                    currentDiseaseName: trimmedDiseaseName
                });

                message.success(`找到 ${records.length} 条知识记录，包含 ${relationTypes.length} 种关系类型`);
            } else {
                console.error('API返回错误:', res);
                const errorMsg = res.msg || '查询失败';
                message.error(`查询失败: ${errorMsg}`);
                this.setState({ knowledgeRecords: [], relationTypes: [], currentDiseaseName: null });
            }
        } catch (error) {
            console.error('查询专病知识时发生错误:', error);
            message.error('查询失败，请稍后重试');
            this.setState({ knowledgeRecords: [], relationTypes: [], currentDiseaseName: null });
        } finally {
            this.setState({ isLoading: false });
        }
    }

    // 从记录中提取关系类型信息
    extractRelationTypesFromRecords = (records) => {
        const relationTypesMap = new Map();
        const { account } = this.props;

        // 获取当前医生的医院名称
        const currentUserHospital = account?.affiliation || '';

        records.forEach((record, index) => {
            try {
                if (!record.object || record.object.trim() === '') {
                    return;
                }

                const objectData = this.safeParseRecordObject(record.object);
                if (!objectData) {
                    return;
                }

                // 解析三元组：{"head": "周围血管病变", "relation": "disease_diagdisease", "tail": "关节炎"}
                const head = objectData.head || '';
                const relation = objectData.relation || '';
                const tail = objectData.tail || '';

                if (!head || !relation || !tail) {
                    return;
                }

                // 获取所属机构（优先使用section字段，如果section为空或为"casibase"则使用organization）
                // section字段存储医院名称，organization字段可能存储系统名称
                let organization = record.section || '';
                if (!organization || organization === 'casibase') {
                    organization = record.organization || '未知机构';
                }
                // 如果organization也是"casibase"，则设为未知机构
                if (organization === 'casibase') {
                    organization = '未知机构';
                }

                // 判断是否有权限：如果数据的医院与当前医生的医院匹配，则有权限
                const hasPermission = currentUserHospital && organization === currentUserHospital;

                if (!relationTypesMap.has(relation)) {
                    relationTypesMap.set(relation, {
                        relation: relation,
                        relationName: RELATION_TYPE_NAMES[relation] || relation,
                        count: 0,
                        organization: organization, // 初始机构
                        organizations: [organization], // 所有机构的数组
                        hasPermission: hasPermission, // 初始权限（基于第一个记录）
                        accessibleHospitals: hasPermission ? [organization] : [], // 有权限的医院列表
                        inaccessibleHospitals: hasPermission ? [] : [organization], // 无权限的医院列表
                        shareCount: 0, // 共享次数，初始为0
                        records: [] // 存储该关系类型的所有记录
                    });
                }

                const relationType = relationTypesMap.get(relation);
                relationType.count += 1;
                relationType.records.push({
                    ...record,
                    head: head,
                    relation: relation,
                    tail: tail,
                    organization: organization
                });

                // 收集所有机构（去重）
                if (!relationType.organizations.includes(organization)) {
                    relationType.organizations.push(organization);
                }

                // 更新权限信息：如果该机构的数据有权限，加入accessibleHospitals；否则加入inaccessibleHospitals
                if (hasPermission) {
                    if (!relationType.accessibleHospitals.includes(organization)) {
                        relationType.accessibleHospitals.push(organization);
                    }
                    // 如果有权限，整体权限为true
                    relationType.hasPermission = true;
                } else {
                    if (!relationType.inaccessibleHospitals.includes(organization)) {
                        relationType.inaccessibleHospitals.push(organization);
                    }
                }

                // 更新 organization 字段为所有机构的字符串（用逗号分隔）
                relationType.organization = relationType.organizations.join(', ');
            } catch (error) {
                console.error(`解析记录 ${index} 时发生错误:`, error);
            }
        });

        return relationTypesMap;
    }

    // 更新共享次数统计
    updateShareCounts = async (relationTypes, diseaseName) => {
        try {
            // 从后端获取该专病的共享知识统计
            const response = await fetch(`${Setting.ServerUrl}/api/get-relation-type-share-counts?diseaseName=${encodeURIComponent(diseaseName)}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const res = await response.json();
                if (res.status === 'ok' && res.data) {
                    const shareCounts = res.data; // {relation: count}
                    relationTypes.forEach(rt => {
                        if (shareCounts[rt.relation] !== undefined) {
                            rt.shareCount = shareCounts[rt.relation];
                        }
                    });
                }
            }
        } catch (error) {
            console.error('获取共享次数统计失败:', error);
            // 如果API不存在，使用本地统计（从 shared_knowledge 表统计）
            // 这里暂时不处理，等待后端API实现
        }
    }

    // 根据共享知识更新权限
    updatePermissionsFromSharedKnowledge = async (relationTypes, diseaseName) => {
        const { account } = this.props;
        const currentUserHospital = account?.affiliation || '';

        if (!currentUserHospital) {
            return;
        }

        try {
            // 获取当前用户发起的、针对该专病的所有协同诊疗请求
            const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-knowledge-requests-by-doctor?doctorId=${encodeURIComponent(account?.id || account?.name || '')}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const res = await response.json();
                if (res.status === 'ok' && res.data) {
                    const requests = res.data || [];

                    // 筛选出针对该专病的请求
                    const relevantRequests = requests.filter(req => req.diseaseName === diseaseName);

                    // 对每个请求，获取共享知识
                    for (const request of relevantRequests) {
                        try {
                            const shareResponse = await fetch(`${Setting.ServerUrl}/api/get-shared-knowledge-by-request?requestId=${encodeURIComponent(request.requestId)}`, {
                                method: 'GET',
                                credentials: 'include',
                            });

                            if (shareResponse.ok) {
                                const shareRes = await shareResponse.json();
                                if (shareRes.status === 'ok' && shareRes.data) {
                                    const sharedKnowledgeList = shareRes.data || [];

                                    // 解析请求中的关系类型
                                    const requestedRelationTypes = JSON.parse(request.relationTypes || '[]');

                                    // 对每个共享知识，更新对应关系类型的权限
                                    sharedKnowledgeList.forEach(knowledge => {
                                        // 解析共享的三元组
                                        let triples = [];
                                        try {
                                            if (typeof knowledge.triples === 'string') {
                                                triples = JSON.parse(knowledge.triples);
                                            } else {
                                                triples = knowledge.triples || [];
                                            }
                                        } catch (e) {
                                            console.error('解析共享知识失败:', e);
                                            return;
                                        }

                                        // 获取共享知识的医院
                                        const sharedHospital = knowledge.hospitalName || '';

                                        // 对每个三元组，检查关系类型是否在请求的关系类型中
                                        triples.forEach(triple => {
                                            const relation = triple.relation;
                                            if (requestedRelationTypes.includes(relation)) {
                                                // 找到对应的关系类型
                                                const relationType = relationTypes.find(rt => rt.relation === relation);
                                                if (relationType && sharedHospital) {
                                                    // 将共享知识的医院加入可访问列表
                                                    if (!relationType.accessibleHospitals.includes(sharedHospital)) {
                                                        relationType.accessibleHospitals.push(sharedHospital);
                                                    }
                                                    // 从不可访问列表中移除
                                                    const index = relationType.inaccessibleHospitals.indexOf(sharedHospital);
                                                    if (index > -1) {
                                                        relationType.inaccessibleHospitals.splice(index, 1);
                                                    }
                                                    // 如果有可访问的医院，设置权限为true
                                                    if (relationType.accessibleHospitals.length > 0) {
                                                        relationType.hasPermission = true;
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('获取共享知识失败:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取协同诊疗请求失败:', error);
        }
    }

    // 查看三元组详情
    showTriples = async (relationType) => {
        const relationTypeData = this.state.relationTypes.find(rt => rt.relation === relationType.relation);
        if (!relationTypeData) {
            return;
        }

        const { account } = this.props;
        const currentUserHospital = account?.affiliation || '';

        // 检查权限 - 只显示有权限的医院的数据
        if (!relationTypeData.hasPermission || relationTypeData.accessibleHospitals.length === 0) {
            Modal.warning({
                title: '访问权限不足',
                content: `您没有访问"${relationTypeData.relationName}"关系类型的权限。当前可访问的医院：${relationTypeData.accessibleHospitals.length > 0 ? relationTypeData.accessibleHospitals.join('、') : '无'}。如需访问其他医院的数据，请发起协同诊疗请求。`,
                okText: '知道了'
            });
            return;
        }

        // 提取该关系类型的所有三元组（只显示有权限的医院的数据）
        let triples = relationTypeData.records
            .filter(record => {
                // 获取记录的医院
                let org = record.section || '';
                if (!org || org === 'casibase') {
                    org = record.organization || '未知机构';
                }
                if (org === 'casibase') {
                    org = '未知机构';
                }
                // 只返回有权限的医院的数据
                return relationTypeData.accessibleHospitals.includes(org);
            })
            .map(record => {
                // 获取所属机构（优先使用section字段）
                let org = record.section || '';
                if (!org || org === 'casibase') {
                    org = record.organization || '未知机构';
                }
                if (org === 'casibase') {
                    org = '未知机构';
                }
                return {
                    head: record.head,
                    relation: record.relation,
                    tail: record.tail,
                    organization: org,
                    createdTime: record.createdTime,
                    source: 'database' // 标记数据来源
                };
            });

        // 获取共享知识中的三元组（如果有权限访问）
        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-knowledge-requests-by-doctor?doctorId=${encodeURIComponent(account?.id || account?.name || '')}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const res = await response.json();
                if (res.status === 'ok' && res.data) {
                    const requests = res.data || [];
                    const relevantRequests = requests.filter(req =>
                        req.diseaseName === this.state.currentDiseaseName &&
                        JSON.parse(req.relationTypes || '[]').includes(relationType.relation)
                    );

                    // 获取每个请求的共享知识
                    for (const request of relevantRequests) {
                        try {
                            const shareResponse = await fetch(`${Setting.ServerUrl}/api/get-shared-knowledge-by-request?requestId=${encodeURIComponent(request.requestId)}`, {
                                method: 'GET',
                                credentials: 'include',
                            });

                            if (shareResponse.ok) {
                                const shareRes = await shareResponse.json();
                                if (shareRes.status === 'ok' && shareRes.data) {
                                    const sharedKnowledgeList = shareRes.data || [];

                                    sharedKnowledgeList.forEach(knowledge => {
                                        let sharedTriples = [];
                                        try {
                                            if (typeof knowledge.triples === 'string') {
                                                sharedTriples = JSON.parse(knowledge.triples);
                                            } else {
                                                sharedTriples = knowledge.triples || [];
                                            }
                                        } catch (e) {
                                            console.error('解析共享知识失败:', e);
                                            return;
                                        }

                                        // 只添加该关系类型的三元组
                                        sharedTriples.forEach(triple => {
                                            if (triple.relation === relationType.relation) {
                                                triples.push({
                                                    head: triple.head,
                                                    relation: triple.relation,
                                                    tail: triple.tail,
                                                    organization: knowledge.hospitalName || '未知机构',
                                                    createdTime: knowledge.createdTime,
                                                    source: 'shared', // 标记为共享数据
                                                    doctorName: knowledge.doctorName,
                                                    shareTime: knowledge.createdTime
                                                });
                                            }
                                        });
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('获取共享知识失败:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取协同诊疗请求失败:', error);
        }

        this.setState({
            selectedRelationType: relationTypeData,
            showTriplesModal: true,
            triples: triples
        });
    }

    // 获取医院的医生列表
    fetchDoctorsByHospital = async (hospitalName) => {
        if (!hospitalName) {
            return [];
        }

        if (this.state.hospitalDoctorsMap[hospitalName]) {
            return this.state.hospitalDoctorsMap[hospitalName];
        }

        this.setState({ isLoadingDoctors: true });

        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-doctors-by-hospital?hospitalName=${encodeURIComponent(hospitalName)}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('服务器返回的不是JSON:', text.substring(0, 200));
                throw new Error('服务器返回格式错误，请检查API路由是否正确配置');
            }

            const res = await response.json();

            if (res.status === 'ok') {
                const doctors = res.data || [];
                this.setState(prevState => ({
                    hospitalDoctorsMap: {
                        ...prevState.hospitalDoctorsMap,
                        [hospitalName]: doctors
                    }
                }));
                return doctors;
            } else {
                message.error(res.msg || '获取医生列表失败');
                return [];
            }
        } catch (error) {
            console.error('获取医生列表时发生错误:', error);
            message.error('获取医生列表失败，请稍后重试');
            return [];
        } finally {
            this.setState({ isLoadingDoctors: false });
        }
    }

    // 发起协同诊疗请求
    submitCollaborationRequest = async () => {
        const { account } = this.props;
        const { collaborationForm, currentDiseaseName } = this.state;

        if (!currentDiseaseName) {
            message.warning('请先查询专病医学概念');
            return;
        }

        if (collaborationForm.selectedDoctors.length === 0) {
            message.warning('请至少选择一位操作员');
            return;
        }

        if (collaborationForm.selectedRelationTypes.length === 0) {
            message.warning('请至少选择一个关系类型');
            return;
        }

        this.setState({ isSubmittingCollaboration: true });

        try {
            const hospitals = [...new Set(collaborationForm.selectedDoctors.map(item => item.hospitalName))];
            const doctorIds = collaborationForm.selectedDoctors.map(item => item.doctorId);
            const relationTypes = collaborationForm.selectedRelationTypes;

            const requestData = {
                initiatorDoctorId: account?.id || account?.name || '',
                initiatorDoctorName: account?.displayName || account?.name || '未知操作员',
                initiatorHospital: account?.affiliation || '未知机构',
                diseaseName: currentDiseaseName,
                targetHospitals: JSON.stringify(hospitals),
                targetDoctors: JSON.stringify(doctorIds),
                relationTypes: JSON.stringify(relationTypes), // 需要访问的关系类型
                description: collaborationForm.description || ''
            };

            console.log('发送协同诊疗请求:', requestData);

            const response = await fetch(`${Setting.ServerUrl}/api/create-collaboration-knowledge-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            const res = await response.json();

            if (res.status === 'ok') {
                message.success('协同诊疗请求已发送成功！');
                this.setState({
                    collaborationForm: {
                        selectedHospitals: [],
                        selectedDoctors: [],
                        selectedRelationTypes: [],
                        description: ''
                    }
                });
                if (this.formRef.current) {
                    this.formRef.current.resetFields();
                }
                this.fetchMyCollaborationRequests();
            } else {
                message.error(res.msg || '发送协同诊疗请求失败');
            }
        } catch (error) {
            console.error('发送协同诊疗请求时发生错误:', error);
            message.error('发送失败，请稍后重试');
        } finally {
            this.setState({ isSubmittingCollaboration: false });
        }
    }

    // 获取医生发起的协同诊疗请求
    fetchMyCollaborationRequests = async () => {
        const { account } = this.props;
        if (!account?.id) {
            return;
        }

        this.setState({ isLoadingMyRequests: true });

        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-knowledge-requests-by-doctor?doctorId=${encodeURIComponent(account.id)}`, {
                method: 'GET',
                credentials: 'include',
            });

            const res = await response.json();

            if (res.status === 'ok') {
                const requests = res.data || [];
                this.setState({ myCollaborationRequests: requests });
                console.log('获取到我的协同诊疗请求:', requests);
            } else {
                message.error(res.msg || '获取协同诊疗请求失败');
                this.setState({ myCollaborationRequests: [] });
            }
        } catch (error) {
            console.error('获取协同诊疗请求时发生错误:', error);
            this.setState({ myCollaborationRequests: [] });
        } finally {
            this.setState({ isLoadingMyRequests: false });
        }
    }

    // 获取针对本医院的协同诊疗请求
    fetchHospitalCollaborationRequests = async () => {
        const { account } = this.props;
        const hospitalName = account?.affiliation;
        const currentDoctorId = account?.id || account?.name || '';

        if (!hospitalName) {
            return;
        }

        this.setState({ isLoadingHospitalRequests: true });

        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-knowledge-requests-by-hospital?hospitalName=${encodeURIComponent(hospitalName)}&excludeDoctorId=${encodeURIComponent(currentDoctorId)}`, {
                method: 'GET',
                credentials: 'include',
            });

            const res = await response.json();

            if (res.status === 'ok') {
                const requests = res.data || [];
                this.setState({ hospitalCollaborationRequests: requests });
                console.log('获取到针对本医院的协同诊疗请求:', requests);
            } else {
                message.error(res.msg || '获取协同诊疗请求失败');
                this.setState({ hospitalCollaborationRequests: [] });
            }
        } catch (error) {
            console.error('获取协同诊疗请求时发生错误:', error);
            this.setState({ hospitalCollaborationRequests: [] });
        } finally {
            this.setState({ isLoadingHospitalRequests: false });
        }
    }

    // 获取针对当前医生的协同诊疗请求
    fetchDoctorCollaborationRequests = async () => {
        const { account } = this.props;
        const doctorId = account?.id || account?.name;

        if (!doctorId) {
            return;
        }

        this.setState({ isLoadingDoctorRequests: true });

        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-collaboration-knowledge-requests-by-target-doctor?doctorId=${encodeURIComponent(doctorId)}`, {
                method: 'GET',
                credentials: 'include',
            });

            const res = await response.json();

            if (res.status === 'ok') {
                const requests = res.data || [];
                this.setState({ doctorCollaborationRequests: requests });
                console.log('获取到针对当前医生的协同诊疗请求:', requests);
            } else {
                message.error(res.msg || '获取协同诊疗请求失败');
                this.setState({ doctorCollaborationRequests: [] });
            }
        } catch (error) {
            console.error('获取协同诊疗请求时发生错误:', error);
            this.setState({ doctorCollaborationRequests: [] });
        } finally {
            this.setState({ isLoadingDoctorRequests: false });
        }
    }

    // 显示请求详情
    showRequestDetails = (request) => {
        this.setState({
            selectedRequest: request,
            showRequestModal: true
        });
    }

    // 显示共享知识界面
    showShareKnowledgeForm = async (request) => {
        // 如果当前没有查询该专病，或者查询的专病与请求不一致，自动查询
        const { currentDiseaseName, relationTypes } = this.state;

        if (!currentDiseaseName || currentDiseaseName !== request.diseaseName) {
            // 自动查询该专病的数据
            console.log('自动查询专病数据:', request.diseaseName);
            this.setState({ isLoading: true });

            try {
                const response = await fetch(`${Setting.ServerUrl}/api/search-disease-knowledge?diseaseName=${encodeURIComponent(request.diseaseName)}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
                }

                const res = await response.json();

                if (res.status === 'ok') {
                    const records = res.data || [];

                    if (records.length === 0) {
                        message.warning('未找到该专病的知识记录');
                        this.setState({ isLoading: false });
                        return;
                    }

                    // 解析记录中的三元组数据
                    const relationTypesMap = this.extractRelationTypesFromRecords(records);
                    const relationTypesArray = Array.from(relationTypesMap.values());

                    // 获取共享次数统计
                    await this.updateShareCounts(relationTypesArray, request.diseaseName);

                    this.setState({
                        knowledgeRecords: records,
                        relationTypes: relationTypesArray,
                        currentDiseaseName: request.diseaseName
                    });

                    // 继续执行共享知识逻辑
                    this.processShareKnowledge(request, relationTypesArray);
                } else {
                    message.error(res.msg || '查询失败');
                    this.setState({ isLoading: false });
                }
            } catch (error) {
                console.error('查询专病知识时发生错误:', error);
                message.error('查询失败，请稍后重试');
                this.setState({ isLoading: false });
            }
        } else {
            // 如果已经查询过，直接处理
            this.processShareKnowledge(request, relationTypes);
        }
    }

    // 处理共享知识逻辑
    processShareKnowledge = (request, relationTypes) => {
        // 获取请求中需要共享的关系类型
        const requestedRelationTypes = JSON.parse(request.relationTypes || '[]');

        // 筛选出该关系类型的三元组（只显示当前医院的数据）
        const { account } = this.props;
        const currentUserHospital = account?.affiliation || '';

        const shareTriples = [];
        requestedRelationTypes.forEach(relation => {
            const relationTypeData = relationTypes.find(rt => rt.relation === relation);
            if (relationTypeData) {
                relationTypeData.records.forEach(record => {
                    // 获取记录的医院
                    let org = record.section || '';
                    if (!org || org === 'casibase') {
                        org = record.organization || '未知机构';
                    }
                    if (org === 'casibase') {
                        org = '未知机构';
                    }

                    // 只显示当前医院的数据
                    if (org === currentUserHospital) {
                        shareTriples.push({
                            head: record.head,
                            relation: record.relation,
                            tail: record.tail,
                            organization: org
                        });
                    }
                });
            }
        });

        if (shareTriples.length === 0) {
            message.warning('您没有该专病的相关数据可共享。');
            return;
        }

        this.setState({
            selectedRequestForShare: request,
            showShareModal: true,
            shareTriples: shareTriples
        });
    }

    // 提交共享知识
    submitShareKnowledge = async () => {
        const { account } = this.props;
        const { selectedRequestForShare, shareTriples } = this.state;

        if (!selectedRequestForShare) {
            message.error('请求信息不完整');
            return;
        }

        if (shareTriples.length === 0) {
            message.warning('没有可共享的知识三元组');
            return;
        }

        this.setState({ isSubmittingShare: true });

        try {
            const shareData = {
                collaborationReqId: selectedRequestForShare.requestId,
                doctorId: account?.id || account?.name || '',
                doctorName: account?.displayName || account?.name || '未知操作员',
                hospitalName: account?.affiliation || '未知机构',
                triples: JSON.stringify(shareTriples) // 共享的三元组列表（JSON 字符串）
            };

            console.log('提交共享知识:', shareData);

            const response = await fetch(`${Setting.ServerUrl}/api/submit-share-knowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(shareData)
            });

            const res = await response.json();

            if (res.status === 'ok') {
                message.success('知识共享成功！共享次数已更新');
                this.setState({
                    showShareModal: false,
                    selectedRequestForShare: null,
                    shareTriples: []
                });
                // 刷新列表和关系类型数据
                this.fetchHospitalCollaborationRequests();
                this.fetchDoctorCollaborationRequests();
                // 刷新我发起的请求列表（状态可能已更新为 completed）
                this.fetchMyCollaborationRequests();
                // 重新查询知识以更新共享次数（仅当发起方查询过该专病时才刷新）
                // 被请求方共享后不需要刷新查询结果
                const { account } = this.props;
                const isInitiator = selectedRequestForShare?.initiatorDoctorId === (account?.id || account?.name);
                if (isInitiator && this.state.currentDiseaseName) {
                    await this.searchDiseaseKnowledge();
                }
            } else {
                message.error(res.msg || '提交共享知识失败');
            }
        } catch (error) {
            console.error('提交共享知识时发生错误:', error);
            message.error('提交失败，请稍后重试');
        } finally {
            this.setState({ isSubmittingShare: false });
        }
    }

    // 查看诊疗知识（发起方查看接收方共享的知识）
    showKnowledgeOpinions = async (request) => {
        this.setState({
            selectedRequestForOpinions: request,
            showOpinionsModal: true,
            isLoadingOpinions: true
        });

        try {
            const response = await fetch(`${Setting.ServerUrl}/api/get-shared-knowledge-by-request?requestId=${encodeURIComponent(request.requestId)}`, {
                method: 'GET',
                credentials: 'include',
            });

            const res = await response.json();

            if (res.status === 'ok') {
                const opinions = res.data || [];
                // 解析每个 opinion 的 triples 字段（如果是字符串则解析为 JSON）
                const parsedOpinions = opinions.map(opinion => {
                    if (opinion.triples && typeof opinion.triples === 'string') {
                        try {
                            opinion.triples = JSON.parse(opinion.triples);
                        } catch (e) {
                            console.error('解析 triples 失败:', e);
                            opinion.triples = [];
                        }
                    }
                    return opinion;
                });
                this.setState({ diagnosisOpinions: parsedOpinions });
            } else {
                message.error(res.msg || '获取共享知识失败');
                this.setState({ diagnosisOpinions: [] });
            }
        } catch (error) {
            console.error('获取共享知识时发生错误:', error);
            this.setState({ diagnosisOpinions: [] });
        } finally {
            this.setState({ isLoadingOpinions: false });
        }
    }

    // 组件挂载时获取数据
    componentDidMount() {
        const { account } = this.props;
        const userTag = account?.tag || '';
        if (userTag === 'doctor' || userTag === 'admin') {
            this.fetchMyCollaborationRequests();
            this.fetchHospitalCollaborationRequests();
            this.fetchDoctorCollaborationRequests();
        }
    }

    render() {
        const { account } = this.props;
        const userTag = account?.tag || '';
        const isDoctor = userTag === 'doctor' || userTag === 'admin';

        // 定义可选医院列表
        const availableHospitals = ['医大一院', '东软集团', '广东省人民医院', '中国医科大学附属第一医院'];

        // 关系类型表格列
        const relationTypeColumns = [
            {
                title: '关系类型',
                dataIndex: 'relationName',
                key: 'relationName',
                width: 200,
            },
            {
                title: '所属机构',
                dataIndex: 'organization',
                key: 'organization',
                width: 300,
                render: (text, record) => {
                    const { account } = this.props;
                    const currentUserHospital = account?.affiliation || '';

                    // 区分有权限和无权限的医院
                    const accessibleOrgs = record.accessibleHospitals || [];
                    const inaccessibleOrgs = record.inaccessibleHospitals || [];

                    return (
                        <Space wrap direction="vertical" size="small">
                            {accessibleOrgs.length > 0 && (
                                <div>
                                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>可访问：</span>
                                    <Space wrap>
                                        {accessibleOrgs.map((org, idx) => (
                                            <Tag key={`accessible-${idx}`} color="green">{org}</Tag>
                                        ))}
                                    </Space>
                                </div>
                            )}
                            {inaccessibleOrgs.length > 0 && (
                                <div>
                                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>未授权：</span>
                                    <Space wrap>
                                        {inaccessibleOrgs.map((org, idx) => (
                                            <Tag key={`inaccessible-${idx}`} color="red">{org}</Tag>
                                        ))}
                                    </Space>
                                </div>
                            )}
                        </Space>
                    );
                },
            },
            {
                title: '访问权限',
                dataIndex: 'hasPermission',
                key: 'hasPermission',
                width: 100,
                render: (hasPermission) => (
                    <Tag color={hasPermission ? 'green' : 'red'}>
                        {hasPermission ? <UnlockOutlined /> : <LockOutlined />}
                        {hasPermission ? '有权限' : '无权限'}
                    </Tag>
                ),
            },
            {
                title: '三元组数量',
                dataIndex: 'count',
                key: 'count',
                width: 100,
            },
            {
                title: '共享次数',
                dataIndex: 'shareCount',
                key: 'shareCount',
                width: 100,
                render: (shareCount) => (
                    <Tag color="blue">{shareCount}</Tag>
                ),
            },
            {
                title: '操作',
                key: 'action',
                width: 150,
                render: (_, record) => (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            icon={record.hasPermission ? <EyeOutlined /> : <LockOutlined />}
                            onClick={() => {
                                if (record.hasPermission) {
                                    this.showTriples(record);
                                } else {
                                    message.warning('您没有访问该关系类型的权限');
                                }
                            }}
                            style={{ color: record.hasPermission ? '#1890ff' : '#999' }}
                        >
                            {record.hasPermission ? '查看三元组' : '无权限'}
                        </Button>
                    </Space>
                ),
            },
        ];

        return (
            <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* 页面标题 */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'bold', margin: 0 }}>协同诊疗-知识上链</h2>
                    <p style={{ color: '#86909C', margin: '4px 0 0 0' }}>查询诊疗知识，发起协同诊疗请求，共享知识三元组</p>
                </div>

                <Row gutter={24}>
                    {/* 左侧：用户信息 */}
                    <Col xs={24} lg={8}>
                        {this.renderUserInfoCard()}
                    </Col>

                    {/* 右侧：功能区 */}
                    <Col xs={24} lg={16}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            {/* 查询诊疗知识 */}
                            {isDoctor && (
                                <>
                                    <Card
                                        title={
                                            <Space>
                                                <SearchOutlined style={{ color: '#165DFF' }} />
                                                查询诊疗知识
                                            </Space>
                                        }
                                    >
                                        {/* 搜索栏 */}
                                        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                                                输入待查询专病医学概念
                                            </label>
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input
                                                    placeholder="例如：舌下腺肿瘤"
                                                    value={this.state.searchDiseaseName}
                                                    onChange={(e) => this.setState({ searchDiseaseName: e.target.value })}
                                                    onPressEnter={this.searchDiseaseKnowledge}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SearchOutlined />}
                                                    loading={this.state.isLoading}
                                                    onClick={this.searchDiseaseKnowledge}
                                                >
                                                    查询
                                                </Button>
                                            </Space.Compact>
                                        </div>

                                        {/* 显示诊疗专病知识列表 */}
                                        {this.state.relationTypes.length > 0 && (
                                            <div style={{ marginBottom: '24px' }}>
                                                <Divider orientation="left">诊疗专病知识</Divider>
                                                <Table
                                                    columns={relationTypeColumns}
                                                    dataSource={this.state.relationTypes}
                                                    rowKey="relation"
                                                    pagination={false}
                                                    size="small"
                                                />
                                            </div>
                                        )}

                                        {/* 发起协同诊疗请求 */}
                                        {this.state.relationTypes.length > 0 && (
                                            <>
                                                <Divider orientation="left">发起协同诊疗请求</Divider>

                                                {/* 选择关系类型 */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                                                        选择需要访问的关系类型
                                                    </label>
                                                    <Select
                                                        mode="multiple"
                                                        placeholder="请选择关系类型"
                                                        value={this.state.collaborationForm.selectedRelationTypes}
                                                        style={{ width: '100%' }}
                                                        onChange={(selectedTypes) => {
                                                            this.setState({
                                                                collaborationForm: {
                                                                    ...this.state.collaborationForm,
                                                                    selectedRelationTypes: selectedTypes
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        {this.state.relationTypes
                                                            .filter(rt => {
                                                                // 只显示有不可访问医院的关系类型（即有需要请求的数据）
                                                                return rt.inaccessibleHospitals && rt.inaccessibleHospitals.length > 0;
                                                            })
                                                            .map(rt => (
                                                                <Option key={rt.relation} value={rt.relation}>
                                                                    {rt.relationName} ({rt.inaccessibleHospitals?.length || 0} 个医院需请求)
                                                                </Option>
                                                            ))}
                                                    </Select>
                                                </div>

                                                {/* 选择协作机构和操作员 */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                                                        选择协作机构及操作员
                                                    </label>
                                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                                        {availableHospitals.map((hospital, index) => {
                                                            const isHospitalSelected = this.state.collaborationForm.selectedHospitals.includes(hospital);
                                                            const hospitalDoctors = this.state.hospitalDoctorsMap[hospital] || [];
                                                            const currentDoctorId = account?.id || account?.name || '';

                                                            return (
                                                                <Card key={index} size="small" style={{ border: isHospitalSelected ? '2px solid #165DFF' : '1px solid #d9d9d9' }}>
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <Checkbox
                                                                            checked={isHospitalSelected}
                                                                            onChange={async (e) => {
                                                                                const selectedHospitals = [...this.state.collaborationForm.selectedHospitals];
                                                                                let selectedDoctors = [...this.state.collaborationForm.selectedDoctors];

                                                                                if (e.target.checked) {
                                                                                    selectedHospitals.push(hospital);
                                                                                    await this.fetchDoctorsByHospital(hospital);
                                                                                } else {
                                                                                    const index = selectedHospitals.indexOf(hospital);
                                                                                    if (index > -1) {
                                                                                        selectedHospitals.splice(index, 1);
                                                                                    }
                                                                                    selectedDoctors = selectedDoctors.filter(item => item.hospitalName !== hospital);
                                                                                }

                                                                                this.setState({
                                                                                    collaborationForm: {
                                                                                        ...this.state.collaborationForm,
                                                                                        selectedHospitals,
                                                                                        selectedDoctors
                                                                                    }
                                                                                });
                                                                            }}
                                                                        >
                                                                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{hospital}</span>
                                                                        </Checkbox>
                                                                    </div>

                                                                    {isHospitalSelected && (
                                                                        <div style={{ marginLeft: '24px', marginTop: '8px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                                                            {this.state.isLoadingDoctors && hospitalDoctors.length === 0 ? (
                                                                                <div style={{ textAlign: 'center', padding: '8px' }}>
                                                                                    <Progress type="circle" size="small" />
                                                                                </div>
                                                                            ) : hospitalDoctors.length === 0 ? (
                                                                                <div style={{ color: '#86909C', fontSize: '12px' }}>该机构暂无操作员</div>
                                                                            ) : (() => {
                                                                                const availableDoctors = hospitalDoctors.filter(doctor => {
                                                                                    const doctorId = `${doctor.owner}/${doctor.name}`;
                                                                                    return doctorId !== currentDoctorId;
                                                                                });

                                                                                const selectedDoctorIds = this.state.collaborationForm.selectedDoctors
                                                                                    .filter(item => item.hospitalName === hospital)
                                                                                    .map(item => item.doctorId);

                                                                                return (
                                                                                    <Select
                                                                                        mode="multiple"
                                                                                        placeholder="请选择该机构的操作员（可多选）"
                                                                                        value={selectedDoctorIds}
                                                                                        style={{ width: '100%' }}
                                                                                        onChange={(selectedIds) => {
                                                                                            let selectedDoctors = this.state.collaborationForm.selectedDoctors.filter(
                                                                                                item => item.hospitalName !== hospital
                                                                                            );

                                                                                            selectedIds.forEach(doctorId => {
                                                                                                const doctor = availableDoctors.find(d => `${d.owner}/${d.name}` === doctorId);
                                                                                                if (doctor) {
                                                                                                    selectedDoctors.push({
                                                                                                        hospitalName: hospital,
                                                                                                        doctorId: doctorId,
                                                                                                        doctorName: doctor.displayName || doctor.name
                                                                                                    });
                                                                                                }
                                                                                            });

                                                                                            this.setState({
                                                                                                collaborationForm: {
                                                                                                    ...this.state.collaborationForm,
                                                                                                    selectedDoctors
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        optionLabelProp="label"
                                                                                        showSearch
                                                                                        filterOption={(input, option) => {
                                                                                            const label = option?.label || '';
                                                                                            return label.toLowerCase().includes(input.toLowerCase());
                                                                                        }}
                                                                                    >
                                                                                        {availableDoctors.map((doctor) => {
                                                                                            const doctorId = `${doctor.owner}/${doctor.name}`;
                                                                                            const label = `${doctor.displayName || doctor.name}${doctor.department ? ` (${doctor.department})` : ''}`;
                                                                                            return (
                                                                                                <Option key={doctorId} value={doctorId} label={label}>
                                                                                                    <div>
                                                                                                        <span style={{ fontWeight: 500 }}>{doctor.displayName || doctor.name}</span>
                                                                                                        {doctor.department && (
                                                                                                            <span style={{ color: '#86909C', marginLeft: '8px' }}>({doctor.department})</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </Option>
                                                                                            );
                                                                                        })}
                                                                                    </Select>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    )}
                                                                </Card>
                                                            );
                                                        })}
                                                    </Space>

                                                    {this.state.collaborationForm.selectedDoctors.length > 0 && (
                                                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                                                            <div style={{ fontSize: '13px', color: '#0050b3', marginBottom: '8px', fontWeight: 500 }}>
                                                                已选择 {this.state.collaborationForm.selectedDoctors.length} 位操作员：
                                                            </div>
                                                            <Space wrap>
                                                                {this.state.collaborationForm.selectedDoctors.map((item, idx) => (
                                                                    <Tag key={idx} color="blue">
                                                                        {item.hospitalName} - {item.doctorName}
                                                                    </Tag>
                                                                ))}
                                                            </Space>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#86909C', marginBottom: '8px' }}>
                                                        协同诊疗说明（可选）
                                                    </label>
                                                    <TextArea
                                                        rows={3}
                                                        placeholder="请说明需要协同诊疗的原因和关注点..."
                                                        value={this.state.collaborationForm.description}
                                                        onChange={(e) => {
                                                            this.setState({
                                                                collaborationForm: {
                                                                    ...this.state.collaborationForm,
                                                                    description: e.target.value
                                                                }
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        icon={<SendOutlined />}
                                                        loading={this.state.isSubmittingCollaboration}
                                                        onClick={this.submitCollaborationRequest}
                                                        disabled={this.state.collaborationForm.selectedDoctors.length === 0 || this.state.collaborationForm.selectedRelationTypes.length === 0}
                                                    >
                                                        发起协同诊疗请求
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Card>

                                    {/* 我发起的协同诊疗请求 */}
                                    <Card
                                        title={
                                            <Space>
                                                <FileTextOutlined style={{ color: '#165DFF' }} />
                                                我发起的协同诊疗请求
                                            </Space>
                                        }
                                        extra={
                                            <Button
                                                onClick={this.fetchMyCollaborationRequests}
                                                loading={this.state.isLoadingMyRequests}
                                            >
                                                刷新
                                            </Button>
                                        }
                                    >
                                        {this.state.isLoadingMyRequests ? (
                                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                                <Progress type="circle" />
                                            </div>
                                        ) : this.state.myCollaborationRequests.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                                                <div style={{ fontSize: '14px' }}>暂无协同诊疗请求</div>
                                            </div>
                                        ) : (
                                            <Row gutter={[16, 16]}>
                                                {this.state.myCollaborationRequests.map((request, index) => (
                                                    <Col xs={24} md={12} key={request.requestId}>
                                                        <Card
                                                            hoverable
                                                            style={{ height: '100%' }}
                                                            actions={[
                                                                <Button
                                                                    type="link"
                                                                    icon={<EyeOutlined />}
                                                                    onClick={() => this.showRequestDetails(request)}
                                                                >
                                                                    查看详情
                                                                </Button>,
                                                                <Button
                                                                    type="link"
                                                                    icon={<FileTextOutlined />}
                                                                    onClick={() => this.showKnowledgeOpinions(request)}
                                                                >
                                                                    查看诊疗知识
                                                                </Button>
                                                            ]}
                                                        >
                                                            <div style={{ marginBottom: '12px' }}>
                                                                <Tag color={request.status === 'active' ? 'green' : request.status === 'completed' ? 'blue' : 'default'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                                                                    {request.status === 'active' ? '待协作机构处理' : request.status === 'completed' ? '已完成' : request.status === 'cancelled' ? '已关闭' : '未知状态'}
                                                                </Tag>
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>请求ID</div>
                                                                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{request.requestId}</div>
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>专病名称</div>
                                                                <div style={{ fontSize: '14px' }}>{request.diseaseName || '未知'}</div>
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                                                <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>关系类型</div>
                                                                <div style={{ fontSize: '12px' }}>
                                                                    {JSON.parse(request.relationTypes || '[]').map((relation, idx) => {
                                                                        const relationName = RELATION_TYPE_NAMES[relation] || relation;
                                                                        return (
                                                                            <Tag key={idx} size="small" color="blue" style={{ marginBottom: '2px' }}>
                                                                                {relationName}
                                                                            </Tag>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </Card>

                                    {/* 待我处理的协同诊疗请求 */}

                                    <Card
                                        title={
                                            <Space>
                                                <FileTextOutlined style={{ color: '#165DFF' }} />
                                                待处理请求
                                            </Space>
                                        }
                                        extra={
                                            <Button
                                                onClick={() => {
                                                    this.fetchHospitalCollaborationRequests();
                                                    this.fetchDoctorCollaborationRequests();
                                                }}
                                                loading={this.state.isLoadingHospitalRequests || this.state.isLoadingDoctorRequests}
                                            >
                                                刷新
                                            </Button>
                                        }
                                    >
                                        {this.state.isLoadingHospitalRequests || this.state.isLoadingDoctorRequests ? (
                                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                                <Progress type="circle" />
                                            </div>
                                        ) : (() => {
                                            const allRequests = [...this.state.hospitalCollaborationRequests, ...this.state.doctorCollaborationRequests];
                                            const uniqueRequests = allRequests.filter((request, index, self) =>
                                                index === self.findIndex(r => r.requestId === request.requestId)
                                            );

                                            return uniqueRequests.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                                                    <div style={{ fontSize: '14px' }}>暂无待处理的协同诊疗请求</div>
                                                </div>
                                            ) : (
                                                <Row gutter={[16, 16]}>
                                                    {uniqueRequests.map((request, index) => {
                                                        const targetDoctors = JSON.parse(request.targetDoctors || '[]');
                                                        const currentDoctorId = account?.id || account?.name || '';
                                                        const isTargetDoctor = targetDoctors.includes(currentDoctorId);
                                                        const isActive = request.status === 'active';

                                                        return (
                                                            <Col xs={24} md={12} key={request.requestId}>
                                                                <Card
                                                                    hoverable
                                                                    style={{ height: '100%' }}
                                                                    actions={[
                                                                        <Button
                                                                            type="link"
                                                                            icon={<EyeOutlined />}
                                                                            onClick={() => this.showRequestDetails(request)}
                                                                        >
                                                                            查看详情
                                                                        </Button>,
                                                                        <Button
                                                                            type="link"
                                                                            icon={<LinkOutlined />}
                                                                            onClick={() => this.showShareKnowledgeForm(request)}
                                                                            disabled={!isActive}
                                                                        >
                                                                            {isActive ? '共享知识' : '已关闭'}
                                                                        </Button>
                                                                    ]}
                                                                >
                                                                    <div style={{ marginBottom: '12px' }}>
                                                                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                                                            {request.initiatorDoctorName}
                                                                        </Tag>
                                                                        <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                                                            {request.initiatorHospital}
                                                                        </Tag>
                                                                        {isTargetDoctor && (
                                                                            <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                                                                指定操作员
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>专病名称</div>
                                                                        <div style={{ fontSize: '14px' }}>{request.diseaseName || '未知'}</div>
                                                                    </div>
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>关系类型</div>
                                                                        <div style={{ fontSize: '12px' }}>
                                                                            {JSON.parse(request.relationTypes || '[]').map((relation, idx) => {
                                                                                const relationName = RELATION_TYPE_NAMES[relation] || relation;
                                                                                return (
                                                                                    <Tag key={idx} size="small" color="purple" style={{ marginBottom: '2px' }}>
                                                                                        {relationName}
                                                                                    </Tag>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>发起时间</div>
                                                                        <div style={{ fontSize: '14px' }}>{moment(request.createdTime).format('YYYY-MM-DD HH:mm')}</div>
                                                                    </div>
                                                                </Card>
                                                            </Col>
                                                        );
                                                    })}
                                                </Row>
                                            );
                                        })()}
                                    </Card>
                                </>
                            )}
                        </Space>
                    </Col>
                </Row>

                {/* 三元组详情模态框 */}
                <Modal
                    title={`三元组详情 - ${this.state.selectedRelationType?.relationName || ''}`}
                    open={this.state.showTriplesModal}
                    onCancel={() => this.setState({ showTriplesModal: false, selectedRelationType: null, triples: [] })}
                    footer={[
                        <Button key="close" onClick={() => this.setState({ showTriplesModal: false, selectedRelationType: null, triples: [] })}>
                            关闭
                        </Button>
                    ]}
                    width={800}
                >
                    <Table
                        columns={[
                            {
                                title: '头实体',
                                dataIndex: 'head',
                                key: 'head',
                            },
                            {
                                title: '关系',
                                dataIndex: 'relation',
                                key: 'relation',
                                render: (relation) => RELATION_TYPE_NAMES[relation] || relation,
                            },
                            {
                                title: '尾实体',
                                dataIndex: 'tail',
                                key: 'tail',
                            },
                            {
                                title: '所属机构',
                                dataIndex: 'organization',
                                key: 'organization',
                                render: (text, record) => (
                                    <Space>
                                        <span>{text}</span>
                                        {record.source === 'shared' && (
                                            <Tag color="green" size="small">共享</Tag>
                                        )}
                                    </Space>
                                ),
                            },
                            {
                                title: '创建时间',
                                dataIndex: 'createdTime',
                                key: 'createdTime',
                                render: (time) => time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-',
                            },
                        ]}
                        dataSource={this.state.triples}
                        rowKey={(record, index) => `${record.head}-${record.relation}-${record.tail}-${record.organization}-${index}`}
                        pagination={{ pageSize: 10 }}
                        size="small"
                    />
                </Modal>

                {/* 请求详情模态框 */}
                <Modal
                    title="协同诊疗请求详情"
                    open={this.state.showRequestModal}
                    onCancel={() => this.setState({ showRequestModal: false, selectedRequest: null })}
                    footer={[
                        <Button key="close" onClick={() => this.setState({ showRequestModal: false, selectedRequest: null })}>
                            关闭
                        </Button>
                    ]}
                    width={600}
                >
                    {this.state.selectedRequest && (
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="发起操作员">{this.state.selectedRequest.initiatorDoctorName}</Descriptions.Item>
                            <Descriptions.Item label="发起机构">{this.state.selectedRequest.initiatorHospital}</Descriptions.Item>
                            <Descriptions.Item label="专病名称">{this.state.selectedRequest.diseaseName || '未知'}</Descriptions.Item>
                            <Descriptions.Item label="发起时间">{moment(this.state.selectedRequest.createdTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                            <Descriptions.Item label="状态">
                                <Tag color={this.state.selectedRequest.status === 'active' ? 'green' : this.state.selectedRequest.status === 'completed' ? 'blue' : 'default'}>
                                    {this.state.selectedRequest.status === 'active' ? '待协作机构处理' : this.state.selectedRequest.status === 'completed' ? '已完成' : this.state.selectedRequest.status === 'cancelled' ? '已关闭' : '未知状态'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="协作机构">
                                {JSON.parse(this.state.selectedRequest.targetHospitals || '[]').map((hospital, index) => (
                                    <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>{hospital}</Tag>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item label="关系类型">
                                {JSON.parse(this.state.selectedRequest.relationTypes || '[]').map((relation, index) => {
                                    const relationName = RELATION_TYPE_NAMES[relation] || relation;
                                    return (
                                        <Tag key={index} color="purple" style={{ marginBottom: '4px' }}>{relationName}</Tag>
                                    );
                                })}
                            </Descriptions.Item>
                            <Descriptions.Item label="说明">
                                {this.state.selectedRequest.description || '无'}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Modal>

                {/* 共享知识模态框 */}
                <Modal
                    title="共享知识"
                    open={this.state.showShareModal}
                    onCancel={() => this.setState({ showShareModal: false, selectedRequestForShare: null, shareTriples: [] })}
                    footer={[
                        <Button key="cancel" onClick={() => this.setState({ showShareModal: false, selectedRequestForShare: null, shareTriples: [] })}>
                            取消
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            icon={<CheckOutlined />}
                            loading={this.state.isSubmittingShare}
                            onClick={this.submitShareKnowledge}
                        >
                            确认共享
                        </Button>
                    ]}
                    width={900}
                >
                    {this.state.selectedRequestForShare && (
                        <div>
                            <Alert
                                message="确认共享知识"
                                description={`您将共享以下知识三元组给发起方操作员 ${this.state.selectedRequestForShare.initiatorDoctorName}。共享后，该关系类型的共享次数将+1。`}
                                type="info"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                            <Table
                                columns={[
                                    {
                                        title: '头实体',
                                        dataIndex: 'head',
                                        key: 'head',
                                    },
                                    {
                                        title: '关系',
                                        dataIndex: 'relation',
                                        key: 'relation',
                                        render: (relation) => RELATION_TYPE_NAMES[relation] || relation,
                                    },
                                    {
                                        title: '尾实体',
                                        dataIndex: 'tail',
                                        key: 'tail',
                                    },
                                    {
                                        title: '所属机构',
                                        dataIndex: 'organization',
                                        key: 'organization',
                                    },
                                ]}
                                dataSource={this.state.shareTriples}
                                rowKey={(record, index) => `${record.head}-${record.relation}-${record.tail}-${index}`}
                                pagination={{ pageSize: 10 }}
                                size="small"
                            />
                        </div>
                    )}
                </Modal>

                {/* 查看诊疗知识模态框 */}
                <Modal
                    title="诊疗知识汇总"
                    open={this.state.showOpinionsModal}
                    onCancel={() => this.setState({ showOpinionsModal: false, selectedRequestForOpinions: null, diagnosisOpinions: [] })}
                    footer={[
                        <Button key="close" onClick={() => this.setState({ showOpinionsModal: false, selectedRequestForOpinions: null, diagnosisOpinions: [] })}>
                            关闭
                        </Button>
                    ]}
                    width={900}
                >
                    {this.state.isLoadingOpinions ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Progress type="circle" />
                        </div>
                    ) : this.state.diagnosisOpinions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#86909C' }}>
                            <div style={{ fontSize: '14px' }}>暂无共享知识</div>
                        </div>
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {this.state.diagnosisOpinions.map((opinion, index) => (
                                <Card key={opinion.shareId || index} size="small">
                                    <div style={{ marginBottom: '12px' }}>
                                        <Space>
                                            <Tag color="blue">{opinion.doctorName}</Tag>
                                            <Tag color="green">{opinion.hospitalName}</Tag>
                                            <span style={{ fontSize: '12px', color: '#86909C' }}>
                                                {moment(opinion.createdTime).format('YYYY-MM-DD HH:mm')}
                                            </span>
                                        </Space>
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{ fontSize: '12px', color: '#86909C', marginBottom: '4px' }}>共享的三元组</div>
                                        <Table
                                            columns={[
                                                {
                                                    title: '头实体',
                                                    dataIndex: 'head',
                                                    key: 'head',
                                                },
                                                {
                                                    title: '关系',
                                                    dataIndex: 'relation',
                                                    key: 'relation',
                                                    render: (relation) => RELATION_TYPE_NAMES[relation] || relation,
                                                },
                                                {
                                                    title: '尾实体',
                                                    dataIndex: 'tail',
                                                    key: 'tail',
                                                },
                                            ]}
                                            dataSource={(() => {
                                                // 解析 triples 字段（可能是 JSON 字符串）
                                                try {
                                                    if (typeof opinion.triples === 'string') {
                                                        return JSON.parse(opinion.triples);
                                                    }
                                                    return opinion.triples || [];
                                                } catch (e) {
                                                    console.error('解析 triples 失败:', e);
                                                    return [];
                                                }
                                            })()}
                                            rowKey={(record, idx) => `${record.head}-${record.relation}-${record.tail}-${idx}`}
                                            pagination={false}
                                            size="small"
                                        />
                                    </div>
                                </Card>
                            ))}
                        </Space>
                    )}
                </Modal>
            </div>
        );
    }
}

export default PythonSrKPage;


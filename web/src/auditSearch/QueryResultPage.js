
import React from "react";
import { Table, Typography, Alert, Spin, message } from "antd";
import * as Setting from "../Setting";
import i18next from "i18next";

// 字段常量池和中英文映射
const FIELD_CONFIG = [
    { key: "name", label: "姓名" },
    { key: "admTime", label: "入院时间" },
    { key: "admHosName", label: "入院医院" },
    { key: "admDepartment", label: "入院科室" },
    { key: "admType", label: "入院类型" },
    { key: "Diagnoses", label: "诊断" },
    { key: "hospital", label: "医院" },
];

// 过滤并翻译字段，只保留常量池中且实际存在的字段
function filterAndTranslateFields(dataArr) {
    if (!Array.isArray(dataArr) || dataArr.length === 0) return [];
    // 找出哪些字段实际存在
    const presentFields = FIELD_CONFIG.filter(({ key }) =>
        dataArr.some(item => item[key] !== undefined && item[key] !== null)
    );
    // 只保留这些字段
    const filteredArr = dataArr.map(item => {
        const filtered = {};
        presentFields.forEach(({ key }) => {
            filtered[key] = item[key] ?? "";
        });
        return filtered;
    });
    return { filteredArr, presentFields };
}

const { Title } = Typography;

class QueryResultPage extends React.Component {
    state = {
        loading: true,
        resultMsg: "",
        resultType: "info",
        tableData: [],
        columns: [],
        count: 0,
        error: null,
    };

    componentDidMount() {
        // 兼容react-router v5/v6
        let queryItem = null;
        if (this.props.location && this.props.location.state && this.props.location.state.queryItem) {
            queryItem = this.props.location.state.queryItem;
        } else if (window.history && window.history.state && window.history.state.usr && window.history.state.usr.queryItem) {
            queryItem = window.history.state.usr.queryItem;
        }
        console.log('queryItem', queryItem);
        if (!queryItem) {
            // 没有查询条件，提示并跳转.使用ant-design的message
            message.warning("未检索到查询条件");
            // 休息1s
            setTimeout(() => {
                if (this.props.history && this.props.history.replace) {
                    this.props.history.replace('/ipfs-search');
                } else {
                    window.location.href = '/ipfs-search';
                }
            }, 1000);

            return;
        }
        // 清除缓存
        this.clearQueryResult();
        this.fetchQueryResult(queryItem);
    }

    clearQueryResult = () => {
        this.setState({
            state: {
                queryItem: null,
            },
        });
    }

    fetchQueryResult = async (queryItem) => {
        this.setState({ loading: true });
        try {
            const uId = (this.props.account && this.props.account.name) ? this.props.account.name : 'admin';
            const response = await fetch("https://47.113.204.64:23554/api/query/queryData", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uId,
                    queryItem,
                    apiUrl: {
                        ipfsServiceUrl: "http://47.113.204.64:5001",
                        chainServiceUrl: "http://47.113.204.64:9001/tencent-chainapi/exec",
                        contractName: "tencentChainqaContractV221demo01",
                    },
                }),
            });
            const res = await response.json();
            if (res.code === 0) {
                let dataObj = {};
                let parseError = false;
                try {
                    dataObj = JSON.parse(res.data);
                } catch (e) {
                    // 不是标准json，直接展示data内容
                    parseError = true;
                }
                if (!parseError && typeof dataObj === 'object' && !Array.isArray(dataObj) && Object.keys(dataObj).length === 0) {
                    // 空对象，仅展示msg
                    this.setState({
                        loading: false,
                        resultMsg: res.msg || "查询失败",
                        resultType: "error",
                        error: res.msg,
                        tableData: [],
                        columns: [],
                    });
                } else if (parseError) {
                    // data为字符串，直接展示data内容
                    this.setState({
                        loading: false,
                        resultMsg: res.data || res.msg || "查询失败",
                        resultType: "error",
                        error: res.data,
                        tableData: [],
                        columns: [],
                    });
                } else if (dataObj.data) {
                    // 只展示常量池中实际存在的字段
                    const { filteredArr, presentFields } = filterAndTranslateFields(dataObj.data || []);
                    const columns = presentFields.map(({ key, label }) => ({
                        title: label,
                        dataIndex: key,
                        key,
                    }));
                    this.setState({
                        loading: false,
                        resultMsg: `查询成功，共找到 ${dataObj.counts || filteredArr.length} 条结果。`,
                        resultType: "success",
                        tableData: filteredArr,
                        columns,
                        count: dataObj.counts || filteredArr.length,
                    });
                } else {
                    // 其它情况，展示data内容
                    this.setState({
                        loading: false,
                        resultMsg: res.data || res.msg || "查询失败",
                        resultType: "error",
                        error: res.data,
                        tableData: [],
                        columns: [],
                    });
                }
            } else {
                this.setState({
                    loading: false,
                    resultMsg: res.msg || "查询失败",
                    resultType: "error",
                    error: res.msg,
                });
            }
        } catch (e) {
            this.setState({
                loading: false,
                resultMsg: "请求失败，" + e.toString(),
                resultType: "error",
                error: e.toString(),
            });
        }
    };

    handleBack = () => {
        if (this.props.history && this.props.history.goBack) {
            this.props.history.goBack();
        } else {
            window.history.back();
        }
    };

    render() {
        const { loading, resultMsg, resultType, tableData, columns } = this.state;
        return (
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>查询结果</Title>
                    <button onClick={this.handleBack} style={{ float: 'right', marginLeft: 16, padding: '4px 16px', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>返回</button>
                </div>
                <div style={{ marginBottom: 16, marginTop: 16 }}>
                    <Alert message={resultMsg} type={resultType} showIcon />
                </div>
                {loading ? (
                    <Spin />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        rowKey={(record, idx) => record.id || idx}
                        bordered
                        size="middle"
                        scroll={{ x: 'max-content' }}
                    />
                )}
            </div>
        );
    }
}

export default QueryResultPage;

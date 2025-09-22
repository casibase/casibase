import React, { useState } from "react";
import { Table, Input, Button, Tabs, message, DatePicker, ConfigProvider, Switch } from "antd";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday"
import localeData from "dayjs/plugin/localeData"
import zhCN from 'antd/lib/locale/zh_CN'; // 引入中文语言包
import 'dayjs/locale/zh-cn';

import * as DYCF_UTIL from "../utils/dynamicConfigUtil";
import { DYNAMIC_CONFIG_KEYS } from "../const/DynamicConfigConst";


dayjs.extend(weekday)
dayjs.extend(localeData)

dayjs.locale('zh-cn');



const { RangePicker } = DatePicker;

const { TabPane } = Tabs;




// 解析后端返回的日志数据
const parseData = (raw) => {
    const arr = [];
    try {
        // raw.data 可能是字符串
        const dataObj = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
        if (Array.isArray(dataObj.QueryLogArray)) {
            dataObj.QueryLogArray.forEach((item, idx) => {
                arr.push({
                    id: item.QueryId,
                    user: item.Uid,
                    time: dayjs(Number(item.Timestamp) * 1000).format("YYYY-MM-DD HH:mm:ss"),
                    status: Number(item.QueryStatus),
                    QueryResult: item.QueryResult // 关键字段补充
                });
            });
        }
    } catch (e) { console.error('parseData error', e); }
    return arr;
};

import { Tag } from "antd";
import { useHistory } from "react-router-dom";
const getColumns = (onViewResult) => [
    {
        title: "序号",
        dataIndex: "index",
        key: "index",
        width: 60,
        render: (_, __, idx) => idx + 1,
    },
    {
        title: "查询ID",
        dataIndex: "id",
        key: "id",
        width: 150,
        render: (text) => (
            <div style={{ wordBreak: "break-all", whiteSpace: "pre-line" }}>{text}</div>
        ),
    },
    {
        title: "用户账号",
        dataIndex: "user",
        key: "user",
        width: 100,
    },
    {
        title: "查询时间",
        dataIndex: "time",
        key: "time",
        width: 160,
    },
    {
        title: "查询结果条数",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status) => {
            if (typeof status === 'number' && status > 0) {
                return <span>{status} 条</span>;
            } else if (typeof status === 'number' && status <= 0) {
                return <Tag color="red">失败</Tag>;
            } else {
                return "-";
            }
        }
    },
    {
        title: "操作",
        key: "action",
        width: 100,
        render: (_, record, idx) => (
            <Button type="link" onClick={() => onViewResult(record, idx)}>
                查看结果
            </Button>
        ),
    },
];

const localeZh = {
    "lang": {
        "locale": "zh_CN",
        "placeholder": "选择日期",
        "rangePlaceholder": ["开始日期", "结束日期"],
        "today": "今天",
        "now": "现在",
        "backToToday": "返回今天",
        "ok": "确定",
        "clear": "清空",
        "month": "月",
        "year": "年",
        "timeSelect": "选择时间",
        "dateSelect": "选择日期",
        "monthSelect": "选择月份",
        "yearSelect": "选择年份",
        "decadeSelect": "选择年代",
        "yearFormat": "YYYY",
        "fieldDateFormat": "YYYY-MM-DD",
        "cellDateFormat": "D",
        "fieldDateTimeFormat": "YYYY-MM-DD HH:mm:ss",
        "monthFormat": "MM月",
        "fieldWeekFormat": "YYYY年第wo周",
        "monthBeforeYear": false,
        "previousMonth": "上一月（PageUp）",
        "nextMonth": "下一月（PageDown）",
        "previousYear": "上一年（Ctrl+左箭头）",
        "nextYear": "下一年（Ctrl+右箭头）",
        "previousDecade": "上一个年代",
        "nextDecade": "下一个年代",
        "previousCentury": "上一个世纪",
        "nextCentury": "下一个世纪",
        "shortWeekDays": ["日", "一", "二", "三", "四", "五", "六"],
        "shortMonths": [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月"
        ]
    },
    "timePickerLocale": {
        "placeholder": "选择时间"
    }
}





export default function NewAuditPage() {
    const history = useHistory();
    const [tabKey, setTabKey] = useState("user");
    const [user, setUser] = useState("");
    const [data, setData] = useState([]);
    const [rawLog, setRawLog] = useState(null); // 新增，保存原始日志数据
    const [showSuccessOnly, setShowSuccessOnly] = useState(true); // 过滤失败开关，默认开启
    const [dateRange, setDateRange] = useState([
        dayjs().startOf("day"),
        dayjs().endOf("day")
    ]);
    const [loading, setLoading] = useState(false);

    // 跳转到查询结果页，传递QueryResult
    const handleViewResult = (record) => {
        const queryResult = record.QueryResult;
        if (queryResult) {
            history.push({
                pathname: '/ipfs-search/query-result',
                state: { queryResult }
            });
        } else {
            message.error('未找到对应的查询结果');
        }
    };

    // 查询按钮点击事件
    const handleSearch = async () => {
        if (tabKey === "user") {
            setLoading(true);
            // 获取基本chainqa的动态配置
            const chainServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CHAINSERVICEURL, "");
            const contractName = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CONTRACTNAME, "chainQA");
            const ipfsServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_IPFSSERVERURL, "https://47.113.204.64:5001");
            const serverURL = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_SERVER, "	https://47.113.204.64:23554");

            fetch(serverURL + "/api/log/logByUid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uId: user.trim(),
                    apiUrl: {
                        ipfsServiceUrl: ipfsServiceUrl,
                        chainServiceUrl: chainServiceUrl,
                        contractName: contractName
                    }
                })
            })
                .then(res => res.json())
                .then(res => {
                    setRawLog(res); // 保存原始数据
                    let arr = parseData(res);
                    if (showSuccessOnly) {
                        arr = arr.filter(item => item.status > 0);
                    }
                    setData(arr);
                })
                .catch(() => {
                    setRawLog(null);
                    setData([]);
                })
                .finally(() => setLoading(false));
        } else if (tabKey === "time") {
            if (!dateRange || !dateRange[0] || !dateRange[1]) return;
            setLoading(true);

            // 获取基本chainqa的动态配置
            const chainServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CHAINSERVICEURL, "");
            const contractName = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CONTRACTNAME, "chainQA");
            const ipfsServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_IPFSSERVERURL, "https://47.113.204.64:5001");
            const serverURL = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_SERVER, "	https://47.113.204.64:23554");

            // 转为秒级时间戳
            const startTime = Math.floor(dateRange[0].startOf("day").valueOf() / 1000);
            const endTime = Math.floor(dateRange[1].endOf("day").valueOf() / 1000);
            fetch(serverURL + "/api/log/logByTimeRange", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: String(startTime),
                    endTime: String(endTime),
                    apiUrl: {
                        ipfsServiceUrl: ipfsServiceUrl,
                        chainServiceUrl: chainServiceUrl,
                        contractName: contractName
                    }
                })
            })
                .then(res => res.json())
                .then(res => {
                    setRawLog(res); // 保存原始数据
                    let arr = parseData(res);
                    if (showSuccessOnly) {
                        arr = arr.filter(item => item.status > 0);
                    }
                    setData(arr);
                })
                .catch(() => {
                    setRawLog(null);
                    setData([]);
                })
                .finally(() => setLoading(false));
        }
    };

    // 切换tab时清空表格和原始数据
    const handleTabChange = (key) => {
        setTabKey(key);
        setData([]);
        setRawLog(null);
        setUser("");
        setDateRange([
            dayjs().startOf("day"),
            dayjs().endOf("day")
        ]);
    };

    return (
        <div style={{ background: "#fff", padding: 32, minHeight: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 24, color: "#23408e", marginBottom: 18 }}>
                审计日志
            </div>
            <Tabs
                activeKey={tabKey}
                onChange={handleTabChange}
                style={{ marginBottom: 16 }}
                tabBarGutter={8}
            >
                <TabPane tab="按用户账号查询" key="user" />
                <TabPane tab="按时间范围查询" key="time" />
            </Tabs>
            {tabKey === "user" && (
                <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: "red", marginRight: 8 }}>*</span>
                        用户账号
                        <Input
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            style={{ width: 320, marginLeft: 12 }}
                            placeholder="请输入用户账号"
                            disabled={loading}
                        />
                        <Button
                            type="primary"
                            style={{ marginLeft: 16 }}
                            onClick={handleSearch}
                            disabled={!user.trim() || loading}
                            loading={loading}
                        >
                            查询日志
                        </Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                            checked={showSuccessOnly}
                            size="small"
                            onChange={checked => {
                                setShowSuccessOnly(checked);
                                if (rawLog) {
                                    let arr = parseData(rawLog);
                                    if (checked) {
                                        arr = arr.filter(item => item.status > 0);
                                    }
                                    setData(arr);
                                }
                            }}
                            style={{ marginRight: 4 }}
                        />
                        <span style={{ fontSize: 13, color: '#666' }}>剔除失败记录</span>
                    </div>
                </div>
            )}
            {tabKey === "time" && (
                <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: "red", marginRight: 8 }}>*</span>
                        时间范围
                        <ConfigProvider locale={zhCN}>
                            <RangePicker
                                showTime
                                value={dateRange}
                                onChange={setDateRange}
                                style={{ marginLeft: 12, width: 360 }}
                                format="YYYY-MM-DD HH:mm:ss"
                                locale={localeZh}
                                disabled={loading}
                            />
                        </ConfigProvider>
                        <Button
                            type="primary"
                            style={{ marginLeft: 16 }}
                            onClick={handleSearch}
                            disabled={!(dateRange && dateRange[0] && dateRange[1]) || loading}
                            loading={loading}
                        >
                            查询日志
                        </Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                            checked={showSuccessOnly}
                            size="small"
                            onChange={checked => {
                                setShowSuccessOnly(checked);
                                if (rawLog) {
                                    let arr = parseData(rawLog);
                                    if (checked) {
                                        arr = arr.filter(item => item.status > 0);
                                    }
                                    setData(arr);
                                }
                            }}
                            style={{ marginRight: 4 }}
                        />
                        <span style={{ fontSize: 13, color: '#666' }}>剔除失败记录</span>
                    </div>
                </div>
            )}
            {/* 查询按钮已集成到输入框/时间选择器右侧 */}
            <div style={{ marginBottom: 10, color: "#444" }}>
                共有{data.length}条日志记录
            </div>
            <div style={{ color: "#888", marginBottom: 12 }}>
                说明：由于查询结果的内容较多，需点击“查看”打开新页面展示
            </div>
            <Table
                columns={getColumns(handleViewResult)}
                dataSource={data}
                rowKey="id"
                pagination={false}
                bordered
                size="middle"
                loading={loading}
            />
        </div>
    );
}
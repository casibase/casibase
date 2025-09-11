import React, { useState, useEffect } from "react";
import { Table, Input, Button, Tabs, message, DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday"
import localeData from "dayjs/plugin/localeData"
import zhCN from 'antd/lib/locale/zh_CN'; // 引入中文语言包
import 'dayjs/locale/zh-cn';


dayjs.extend(weekday)
dayjs.extend(localeData)

dayjs.locale('zh-cn');



const { RangePicker } = DatePicker;

const { TabPane } = Tabs;

const mockData = [
    {
        id: "536bb2dfb55ec185c8e39c7c01f22c21",
        user: "admin",
        time: "2025-02-23 16:45:40",
        count: 3,
        status: "3条",
        detail: "3条",
    },
    {
        id: "2fbd865962bb52907d6347f3faa508f",
        user: "admin",
        time: "2025-02-23 17:10:24",
        count: 4,
        status: "4条",
        detail: "4条",
    },
    {
        id: "4ca1c49a90d962efb3bbfa2535aff23",
        user: "admin",
        time: "2025-02-24 00:17:33",
        count: 4,
        status: "4条",
        detail: "4条",
    },
    {
        id: "84f60e02271bd49a9afe46d4d5dbe95fe",
        user: "admin",
        time: "2025-02-26 11:11:41",
        count: 5,
        status: "5条",
        detail: "5条",
    },
];

const columns = [
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
        width: 220,
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
        title: "查询状态",
        dataIndex: "status",
        key: "status",
        width: 80,
    },
    {
        title: "查询条件与结果",
        key: "action",
        width: 120,
        render: (_, record) => (
            <a
                onClick={() => {
                    message.info("弹窗展示详细内容（请根据实际需求实现）");
                }}
            >
                查看
            </a>
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
    const [tabKey, setTabKey] = useState("user");
    const [user, setUser] = useState("admin");
    const [data, setData] = useState(mockData);
    const [dateRange, setDateRange] = useState([
        dayjs().startOf("day"),
        dayjs().endOf("day")
    ]);

    // 查询按钮点击事件
    const handleSearch = () => {
        if (tabKey === "user") {
            setData(mockData.filter((item) => item.user === user));
        } else if (tabKey === "time") {
            setData(
                mockData.filter((item) => {
                    const t = dayjs(item.time);
                    return t.isAfter(dateRange[0].startOf("second")) && t.isBefore(dateRange[1].endOf("second"));
                })
            );
        }
    };

    return (
        <div style={{ background: "#fff", padding: 32, minHeight: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#23408e", marginBottom: 18 }}>
                审计日志
            </div>
            <Tabs
                activeKey={tabKey}
                onChange={setTabKey}
                style={{ marginBottom: 16 }}
                tabBarGutter={8}
            >
                <TabPane tab="按用户账号查询" key="user" />
                <TabPane tab="按时间范围查询" key="time" />
            </Tabs>
            {tabKey === "user" && (
                <div style={{ marginBottom: 18 }}>
                    <span style={{ color: "red", marginRight: 8 }}>*</span>
                    用户账号
                    <Input
                        value={user}
                        onChange={e => setUser(e.target.value)}
                        style={{ width: 320, marginLeft: 12 }}
                        placeholder="请输入用户账号"
                    />
                </div>
            )}
            {tabKey === "time" && (
                <div style={{ marginBottom: 18, display: "flex", alignItems: "center" }}>
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
                        />
                    </ConfigProvider>
                </div>
            )}
            <Button
                type="primary"
                style={{ marginBottom: 24 }}
                onClick={handleSearch}
            >
                查询日志
            </Button>
            <div style={{ marginBottom: 10, color: "#444" }}>
                共有{data.length}条日志记录
            </div>
            <div style={{ color: "#888", marginBottom: 12 }}>
                说明：由于查询条件和查询结果的内容较多，需点击“查看”打开弹窗展示
            </div>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={false}
                bordered
                size="middle"
            />
        </div>
    );
}
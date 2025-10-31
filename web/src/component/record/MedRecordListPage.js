import React from "react";
import { Button, Card, Col, Input, Row, Select, Table, Tag, Tooltip, Popconfirm, message } from "antd";
import moment from "moment";
import * as Setting from "../../Setting";
import * as RecordBackend from "../../backend/RecordBackend";
import { HOSPITAL_OPTIONS, HOSPITAL_UNITS_MAP, DISEASE_CATEGORIES, STATUS_FILTER_OPTIONS } from "./MedRecordConst";

export default function MedRecordListPage({ account, history }) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [current, setCurrent] = React.useState(1);

    const [hospital, setHospital] = React.useState("all");
    const [unit, setUnit] = React.useState("all");
    const [status, setStatus] = React.useState("all");
    const [keyword, setKeyword] = React.useState("");
    const [sorter, setSorter] = React.useState({ field: "createdTime", order: "descend" });

    const unitOptions = React.useMemo(() => {
        if (hospital === "all") return [];
        return (HOSPITAL_UNITS_MAP[hospital] || []).map(u => ({ label: u, value: u }));
    }, [hospital]);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await RecordBackend.getRecords(Setting.getRequestOrganization(account), current, pageSize, "", "", sorter.field, sorter.order);
            if (res.status === "ok") {
                const all = (res.data || []).filter(r => r.requestUri === "/api/add-record" && r.action === "add-store");
                const filtered = all.filter(r => {
                    if (hospital !== "all" && r.section !== hospital) return false;
                    if (unit !== "all" && (r.unit || "") !== unit) return false;
                    if (status === "todo" && !r.needCommit) return false;
                    if (status === "archived" && r.needCommit) return false;
                    if (keyword && !(r.object || "").includes(keyword) && !(r.user || "").includes(keyword)) return false;
                    return true;
                });
                const sorted = [...filtered].sort((a, b) => (moment(a.createdTime).valueOf() - moment(b.createdTime).valueOf()) * (sorter.order === "ascend" ? 1 : -1));
                setData(sorted);
                setTotal(res.data2 || sorted.length);
            } else {
                Setting.showMessage("error", res.msg);
            }
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetch(); }, [current, pageSize, hospital, unit, status, keyword, sorter.field, sorter.order]); // eslint-disable-line

    const onTableChange = (pagination, _filters, sorterArg) => {
        setCurrent(pagination.current);
        setPageSize(pagination.pageSize);
        if (sorterArg?.field) {
            setSorter({ field: sorterArg.field, order: sorterArg.order || "descend" });
        }
    };

    const deleteOne = async (record) => {
        const res = await RecordBackend.deleteRecord(record);
        if (res.status === "ok") {
            message.success("删除成功");
            fetch();
        } else {
            message.error(`删除失败：${res.msg}`);
        }
    };

    const columns = [
        {
            title: "患者姓名", dataIndex: "object", key: "patient", render: (text) => {
                try { return JSON.parse(text || "{}").patient || ""; } catch { return ""; }
            }
        },
        { title: "就诊医院", dataIndex: "section", key: "hospital" },
        { title: "就诊科室", dataIndex: "unit", key: "unit", render: (t) => t || "--" },
        { title: "病种分类", dataIndex: "diseaseCategory", key: "diseaseCategory", render: (t) => t || "--" },
        { title: "操作人", dataIndex: "user", key: "user" },
        { title: "提交时间", dataIndex: "createdTime", key: "createdTime", sorter: true, render: (t) => t ? t.replace("T", " ").slice(0, 16) : "" },
        { title: "提交状态", dataIndex: "needCommit", key: "needCommit", render: (v) => v ? <Tag color="red">待提交</Tag> : <Tag>已归档</Tag> },
        {
            title: "操作", key: "action", render: (_, record) => {
                const isEditable = record.needCommit && record.user === account?.name;
                return (
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button size="small" onClick={() => history.push(`/records/${record.owner}/${record.id}`)}>查看详情</Button>
                        <Tooltip title={isEditable ? "" : "仅待提交且本人可编辑"}>
                            <Button size="small" disabled={!isEditable} onClick={() => history.push(`/records/${record.owner}/${record.id}`)}>编辑</Button>
                        </Tooltip>
                        <Popconfirm title={`确认删除该记录？`} onConfirm={() => deleteOne(record)}>
                            <Button size="small" danger>删除</Button>
                        </Popconfirm>
                    </div>
                );
            }
        }
    ];

    return (
        <Card title="病例数据列表">
            <Row gutter={12} style={{ marginBottom: 12 }}>
                <Col span={6}>
                    <Select style={{ width: "100%" }} value={hospital} onChange={(v) => { setHospital(v); setUnit("all"); }}
                        options={[{ label: "全部医院", value: "all" }, ...HOSPITAL_OPTIONS]} />
                </Col>
                <Col span={6}>
                    <Select style={{ width: "100%" }} value={unit} onChange={setUnit}
                        options={[{ label: "全部科室", value: "all" }, ...(unitOptions || [])]} />
                </Col>
                <Col span={6}>
                    <Select style={{ width: "100%" }} value={status} onChange={setStatus} options={STATUS_FILTER_OPTIONS} />
                </Col>
                <Col span={6}>
                    <Input placeholder="关键词（患者姓名/操作人）" value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
                </Col>
            </Row>

            <Table rowKey={(r) => `${r.owner}/${r.name}`} loading={loading} dataSource={data} columns={columns}
                onChange={onTableChange}
                pagination={{ current, pageSize, total, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: t => `共 ${t} 条` }} />
        </Card>
    );
}




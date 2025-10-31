import React from "react";
import { Button, Card, Col, Row, Select, Table, Upload, message } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import dayjs from "dayjs";
import * as Setting from "../../Setting";
import { HOSPITAL_OPTIONS } from "./MedRecordConst";
import sm3 from "sm-crypto/src/sm3";
import xlsx from "xlsx";

const ACTIONS = [
    { value: "add-outpatient", label: "门诊就诊记录" },
    { value: "add-inpatient", label: "住院诊疗数据" },
    { value: "add-knowledge", label: "专病知识库数据" },
    { value: "add-telemedicine", label: "互联网医院就诊记录" },
];

const REQUIRED_FIELDS = {
    "add-outpatient": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex", "diagnosis"],
    "add-inpatient": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex"],
    "add-knowledge": ["idCard", "section"],
    "add-telemedicine": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex", "diagnosis"],
};

const ACTION_HOSPITALS = {
    "add-outpatient": ["广东省人民医院", "江苏省人民医院", "中国医科大学附属第一医院"],
    "add-inpatient": ["中国医科大学附属第一医院", "江苏省人民医院", "广东省人民医院"],
    "add-knowledge": ["江苏省人民医院"],
    "add-telemedicine": ["中国医科大学附属第一医院"],
};

function ensureSecond(v) {
    const d = dayjs(v);
    if (!d.isValid()) return "";
    const s = d.format("YYYY-MM-DD HH:mm:ss");
    const parts = s.split(":");
    if (parts.length < 3) return d.format("YYYY-MM-DD HH:mm:00");
    return s;
}

function s3HashCorrelationId(id) {
    return sm3((id || "").toString().trim());
}

function buildObjectFromRow(action, row, hash) {
    const section = row.section;
    const unit = row.unit;
    const baseTime = row.consultationTime ? ensureSecond(row.consultationTime) : undefined;
    if (action === "add-knowledge") {
        return { correlationId: hash, section };
    }
    const common = {
        correlationId: hash,
        patientName: row.patientName,
        localDBIndex: row.localDBIndex,
        consultationTime: baseTime,
        section,
        unit,
    };
    if (action === "add-outpatient" || action === "add-telemedicine") {
        return { ...common, diagnosis: row.diagnosis };
    }
    return common;
}

function buildRecord(action, account, obj, section, unit, correlationId, createdTime) {
    return {
        owner: "casibase",
        name: Setting.GenerateId(),
        createdTime,
        organization: "casibase",
        clientIp: "",
        user: account?.name || "admin",
        method: "POST",
        requestUri: "/api/add-record",
        action: action,
        object: JSON.stringify(obj),
        language: "zh-CN",
        response: "",
        isTriggered: true,
        block: "",
        blockHash: "",
        transaction: "",
        userAgent: "",
        needCommit: true,
        section: section,
        unit: unit || undefined,
        correlationId: correlationId,
    };
}

export default function RecordCsvImportPage({ account }) {
    const [action, setAction] = React.useState("add-outpatient");
    const [rows, setRows] = React.useState([]);
    const [errors, setErrors] = React.useState([]);
    const [validatedOk, setValidatedOk] = React.useState(false);
    const [okRecords, setOkRecords] = React.useState([]);

    async function decodeCsvArrayBufferToText(ab) {
        // 尝试 UTF-8 -> GB18030 -> GBK 解码，处理可能的中文乱码
        const tryEncodings = ["utf-8", "gb18030", "gbk"];
        for (const enc of tryEncodings) {
            try {
                const td = new TextDecoder(enc);
                const text = td.decode(ab);
                // 简单启发式：若包含大量 � 则认为失败
                const bad = (text.match(/�/g) || []).length;
                if (bad < 5) return text;
            } catch {
                // ignore
            }
        }
        // 兜底 UTF-8
        return new TextDecoder("utf-8").decode(ab);
    }

    const beforeUpload = async (file) => {
        setErrors([]);
        setValidatedOk(false);
        setOkRecords([]);
        const name = (file.name || "").toLowerCase();
        try {
            if (name.endsWith(".csv")) {
                const ab = await file.arrayBuffer();
                const text = await decodeCsvArrayBufferToText(ab);
                const result = Papa.parse(text, { header: true, skipEmptyLines: true });
                const data = result.data || [];
                const must = REQUIRED_FIELDS[action];
                if (data.length === 0) {
                    message.warning("CSV为空");
                    setRows([]);
                    return false;
                }
                const head = Object.keys(data[0] || {});
                const lack = must.filter(f => !head.includes(f));
                if (lack.length > 0) {
                    message.error(`缺少字段: ${lack.join(", ")}`);
                    setRows([]);
                    return false;
                }
                setRows(data);
                message.success(`已解析 ${data.length} 行`);
                return false;
            }

            if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
                const ab = await file.arrayBuffer();
                const wb = xlsx.read(ab, { type: "array" });
                const first = wb.Sheets[wb.SheetNames[0]];
                const json = xlsx.utils.sheet_to_json(first, { defval: "" });
                const data = json || [];
                const must = REQUIRED_FIELDS[action];
                if (data.length === 0) {
                    message.warning("Excel为空");
                    setRows([]);
                    return false;
                }
                const head = Object.keys(data[0] || {});
                const lack = must.filter(f => !head.includes(f));
                if (lack.length > 0) {
                    message.error(`缺少字段: ${lack.join(", ")}`);
                    setRows([]);
                    return false;
                }
                setRows(data);
                message.success(`已解析 ${data.length} 行`);
                return false;
            }

            message.error("不支持的文件类型，请上传 CSV/XLS/XLSX");
            return false;
        } catch (e) {
            message.error(`解析失败：${e}`);
            return false;
        }
    };

    const columns = React.useMemo(() => {
        const sample = rows[0] || {};
        return Object.keys(sample).map(k => ({ title: k, dataIndex: k }));
    }, [rows]);

    const downloadTemplate = () => {
        const headers = REQUIRED_FIELDS[action];
        const row = headers.map(h => (h === "consultationTime" ? dayjs().format("YYYY-MM-DD HH:mm:ss") : ""));
        const csv = [headers.join(","), row.join(",")].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${action}-模板.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const errorColumns = [
        { title: "行号", dataIndex: "index", width: 90 },
        { title: "错误原因", dataIndex: "reason" },
    ];

    const validateOnly = async () => {
        if (rows.length === 0) {
            message.info("请先上传CSV");
            return;
        }
        const must = REQUIRED_FIELDS[action];
        // 医院检查：三个医院任一即可
        const allowHospitals = (HOSPITAL_OPTIONS || []).map(h => h.value);
        const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");
        const okRecs = [];
        const errorList = [];

        rows.forEach((row, i) => {
            const idx = i + 2; // 头部为第1行
            // 必填非空
            const empties = must.filter(f => !row[f] || `${row[f]}`.trim() === "");
            if (empties.length > 0) {
                errorList.push({ index: idx, reason: `缺少必填值: ${empties.join(", ")}` });
                return;
            }
            // 医院校验
            if (!allowHospitals.includes(row.section)) {
                errorList.push({ index: idx, reason: `医院不在允许范围: ${row.section}` });
                return;
            }
            // 时间格式整理
            const normalizedTime = ensureSecond(row.consultationTime);
            if (must.includes("consultationTime") && !normalizedTime) {
                errorList.push({ index: idx, reason: "就诊时间格式错误" });
                return;
            }
            // 构造对象
            const hash = s3HashCorrelationId(row.idCard);
            const obj = buildObjectFromRow(action, { ...row, consultationTime: normalizedTime }, hash);
            const section = obj.section;
            const unit = obj.unit;
            const record = buildRecord(action, account, obj, section, unit, hash, now);
            okRecs.push(record);
        });

        setErrors(errorList);
        setOkRecords(okRecs);
        const ok = okRecs.length > 0 && errorList.length === 0;
        setValidatedOk(ok);
        if (ok) message.success(`校验通过，可上链：共 ${okRecs.length} 条`);
        else message.error("校验未通过，请根据错误明细修正后重试");
    };

    const submitOnly = async () => {
        if (!validatedOk || okRecords.length === 0) {
            message.info("请先完成且通过校验");
            return;
        }
        try {
            const res = await fetch(`${Setting.ServerUrl}/api/add-records?sync=1`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(okRecords),
            }).then(r => r.json());
            if (res.status === "ok") {
                message.success(`上链完成：成功 ${okRecords.length} 条`);
            } else {
                message.error(`上链失败：${res.msg}`);
            }
        } catch (e) {
            message.error(`上链异常：${e}`);
        }
    };

    return (
        <Card title="CSV导入与预览" headStyle={{ fontWeight: "bold" }} bodyStyle={{ paddingTop: 16 }}>
            <Row gutter={12} style={{ marginBottom: 12 }}>
                <Col span={8}>
                    <Select style={{ width: "100%" }} value={action} onChange={setAction} options={ACTIONS} />
                </Col>
                <Col span={16}>
                    <Upload beforeUpload={beforeUpload} showUploadList={false} accept=".csv,.xls,.xlsx">
                        <Button icon={<UploadOutlined />}>上传CSV</Button>
                    </Upload>
                    <Button style={{ marginLeft: 8 }} icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>
                    <Button type="primary" style={{ marginLeft: 8 }} onClick={validateOnly}>校验</Button>
                    <Button disabled={!validatedOk} style={{ marginLeft: 8 }} onClick={submitOnly}>上链</Button>
                </Col>
            </Row>

            <Table rowKey={(r, i) => i} dataSource={rows} columns={columns} pagination={{ pageSize: 10 }} />
            {errors.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <Table rowKey={(r, i) => `err-${r.index}-${i}`} dataSource={errors} columns={errorColumns} pagination={{ pageSize: 10 }} />
                </div>
            )}
        </Card>
    );
}

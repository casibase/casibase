import React from "react";
import { Button, Card, Progress, Table, Upload, message, Space, Typography } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import * as Setting from "../../Setting";
import * as RecordBackend from "../../backend/RecordBackend";
import { HOSPITAL_OPTIONS } from "./MedRecordConst";
import { v4 as uuidv4 } from "uuid";
import xlsx from "xlsx";
import moment from "moment";

const { Text } = Typography;

const TEMPLATE_HEADERS = ["患者姓名", "就诊医院", "就诊科室", "病种分类", "needCommit（true/false）"];
const HOSPITAL_VALUES = HOSPITAL_OPTIONS.map(o => o.value);

function buildTemplateSheet() {
    const example = [
        {
            "患者姓名": "张三",
            "就诊医院": "广东省人民医院",
            "就诊科室": "眼科",
            "病种分类": "眼病",
            "needCommit（true/false）": "true",
        },
    ];
    return Setting.json2sheet(example);
}

export default function MedRecordImportPage({ account }) {
    const [progress, setProgress] = React.useState(0);
    const [parsing, setParsing] = React.useState(false);
    const [rows, setRows] = React.useState([]);
    const [successRows, setSuccessRows] = React.useState([]);
    const [failedRows, setFailedRows] = React.useState([]);

    const downloadTemplate = () => {
        const sheet = buildTemplateSheet();
        Setting.saveSheetToFile(sheet, "导入模板", "病例导入模板.xlsx");
    };

    const validateRow = (row, index) => {
        const errors = [];
        // 医院校验
        if (!HOSPITAL_VALUES.includes(row["就诊医院"])) {
            errors.push("医院不存在");
        }
        // needCommit
        const needCommitText = `${row["needCommit（true/false）"]}`.trim().toLowerCase();
        if (!(needCommitText === "true" || needCommitText === "false")) {
            errors.push("格式错误: needCommit 只能为 true/false");
        }
        // 患者姓名
        if (!row["患者姓名"]) {
            errors.push("患者姓名缺失");
        }
        return errors;
    };

    const parseFile = async (file) => {
        setParsing(true);
        setProgress(10);
        try {
            const data = await file.arrayBuffer();
            setProgress(25);
            const wb = xlsx.read(data, { type: "array" });
            setProgress(50);
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const json = xlsx.utils.sheet_to_json(firstSheet, { defval: "" });
            setProgress(70);

            // 校验与去重（以: 患者姓名+就诊医院+提交时间(导入瞬时) 作为组合，这里用导入瞬时近似代替就诊时间）
            const nowIso = new Date().toISOString();
            const seen = new Set();
            const success = [];
            const failed = [];

            json.forEach((row, idx) => {
                const errs = validateRow(row, idx);
                const key = `${row["患者姓名"]}|${row["就诊医院"]}|${nowIso}`;
                if (seen.has(key)) {
                    errs.push("数据重复");
                }
                if (errs.length > 0) {
                    failed.push({
                        index: idx + 2, // Excel从第2行开始是数据
                        reason: errs.join("；"), raw: row
                    });
                } else {
                    seen.add(key);
                    success.push(row);
                }
            });

            setRows(json);
            setSuccessRows(success);
            setFailedRows(failed);
            setProgress(100);
            message.success(`解析完成：成功 ${success.length} 条，失败 ${failed.length} 条`);
        } catch (e) {
            message.error(`解析失败：${e}`);
        } finally {
            setParsing(false);
        }
        return false; // 阻止 Upload 默认上传
    };

    const exportErrors = () => {
        if (failedRows.length === 0) {
            message.info("无失败项");
            return;
        }
        const sheet = Setting.json2sheet(failedRows.map(r => ({ 行号: r.index, 错误原因: r.reason, ...r.raw })));
        Setting.saveSheetToFile(sheet, "错误明细", "病例导入错误明细.xlsx");
    };

    const commit = async () => {
        if (successRows.length === 0) {
            message.info("无可导入数据");
            return;
        }
        const now = moment().format("YYYY-MM-DDTHH:mm:ss");
        const records = successRows.map((row) => {
            const needCommit = `${row["needCommit（true/false）"]}`.trim().toLowerCase() === "true";
            const correlationId = uuidv4();
            const object = {
                patient: row["患者姓名"],
                hospital: row["就诊医院"],
                unit: row["就诊科室"] || "",
                correlationId,
            };
            return {
                owner: "casibase",
                name: Setting.GenerateId(),
                createdTime: now,
                organization: "casibase",
                clientIp: "",
                user: account?.name || "admin",
                method: "POST",
                requestUri: "/api/add-record",
                action: "add-store",
                object: JSON.stringify(object),
                language: "zh-CN",
                response: "",
                isTriggered: true,
                block: "",
                blockHash: "",
                transaction: "",
                userAgent: "",
                needCommit,
                section: row["就诊医院"],
                unit: row["就诊科室"] || "",
                correlationId,
                diseaseCategory: row["病种分类"] || "",
            };
        });

        const res = await fetch(`${Setting.ServerUrl}/api/add-records?sync=true`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(records),
        }).then(r => r.json());

        if (res.status === "ok") {
            message.success("导入成功");
        } else {
            message.error(`导入失败：${res.msg}`);
        }
    };

    const errorColumns = [
        { title: "行号", dataIndex: "index", width: 90 },
        { title: "错误原因", dataIndex: "reason" },
    ];

    return (
        <Card title="Excel批量导入">
            <Space style={{ marginBottom: 12 }}>
                <Upload beforeUpload={parseFile} showUploadList={false} accept=".xls,.xlsx">
                    <Button icon={<UploadOutlined />} loading={parsing}>上传Excel</Button>
                </Upload>
                <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>
                <Button type="primary" onClick={commit} disabled={successRows.length === 0}>导入成功数据</Button>
                <Button onClick={exportErrors} disabled={failedRows.length === 0}>下载错误明细</Button>
            </Space>

            <div style={{ maxWidth: 400, marginBottom: 8 }}>
                <Progress percent={progress} />
            </div>

            <div style={{ marginBottom: 8 }}>
                <Text>解析结果：成功 {successRows.length} 条，失败 {failedRows.length} 条</Text>
            </div>

            <Table rowKey={(r) => `${r.index}-${r.reason}`} dataSource={failedRows} columns={errorColumns} pagination={{ pageSize: 10 }} />
        </Card>
    );
}

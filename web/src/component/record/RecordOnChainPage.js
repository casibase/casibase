import React from "react";
import { Button, Card, Col, Form, Input, Row, Select, DatePicker, Space, message, Upload, Typography } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import * as Setting from "../../Setting";
import * as RecordBackend from "../../backend/RecordBackend";
import { HOSPITAL_OPTIONS } from "./MedRecordConst";
import sm3 from "sm-crypto/src/sm3";
import xlsx from "xlsx";

const { Option } = Select;
const { Text } = Typography;

const ACTIONS = [
    { value: "add-outpatient", label: "门诊就诊记录" },
    { value: "add-inpatient", label: "住院诊疗数据" },
    { value: "add-knowledge", label: "专病知识库数据" },
    { value: "add-telemedicine", label: "互联网医院就诊记录" },
];

const ACTION_HOSPITALS = {
    "add-outpatient": ["广东省人民医院", "江苏省人民医院", "中国医科大学附属第一医院"],
    "add-inpatient": ["中国医科大学附属第一医院", "江苏省人民医院", "广东省人民医院"],
    "add-knowledge": ["江苏省人民医院"],
    "add-telemedicine": ["中国医科大学附属第一医院"],
};

const REQUIRED_FIELDS = {
    "add-outpatient": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex", "diagnosis"],
    "add-inpatient": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex"],
    "add-knowledge": ["idCard", "section"],
    "add-telemedicine": ["idCard", "section", "patientName", "unit", "consultationTime", "localDBIndex", "diagnosis"],
};

function ensureSecond(v) {
    const d = dayjs(v);
    if (!d.isValid()) return "";
    const s = d.format("YYYY-MM-DD HH:mm:ss");
    // dayjs已保证秒存在；如果无法获取则置00
    const parts = s.split(":");
    if (parts.length < 3) return d.format("YYYY-MM-DD HH:mm:00");
    return s;
}

function s3HashCorrelationId(id) {
    return sm3(id || "");
}

export default function RecordOnChainPage({ account }) {
    const [form] = Form.useForm();
    const [action, setAction] = React.useState("add-outpatient");
    const [idCard, setIdCard] = React.useState("");
    const [idHash, setIdHash] = React.useState("");

    const hospitals = ACTION_HOSPITALS[action] || [];

    // 默认就诊时间：进入或切换到需要就诊时间的action时，自动填入当前时间（可手动修改）
    React.useEffect(() => {
        const needsTime = ["add-outpatient", "add-inpatient", "add-telemedicine"].includes(action);
        if (needsTime) {
            const cur = form.getFieldValue("consultationTime");
            if (!cur) {
                form.setFieldsValue({ consultationTime: dayjs() });
            }
        } else {
            form.setFieldsValue({ consultationTime: undefined });
        }
    }, [action]);

    const onIdCardChange = (e) => {
        const v = e.target.value?.trim() || "";
        setIdCard(v);
        const hash = s3HashCorrelationId(v);
        setIdHash(hash);
    };

    const exportTemplate = () => {
        const headers = REQUIRED_FIELDS[action];
        const example = [{}];
        headers.forEach(h => {
            if (h === "consultationTime") example[0]["consultationTime"] = dayjs().format("YYYY-MM-DD HH:mm:ss");
            else if (h === "section") example[0]["section"] = hospitals[0];
            else example[0][h] = "";
        });
        const sheet = Setting.json2sheet(example);
        Setting.saveSheetToFile(sheet, `${action}-模板`, `${action}-导入模板.xlsx`);
    };

    const beforeUpload = async (file) => {
        try {
            const data = await file.arrayBuffer();
            const wb = xlsx.read(data, { type: "array" });
            const first = wb.Sheets[wb.SheetNames[0]];
            const json = xlsx.utils.sheet_to_json(first, { defval: "" });

            // 校验字段是否齐全
            const must = REQUIRED_FIELDS[action];
            const lack = must.filter(f => !(json.length === 0 ? true : Object.keys(json[0]).includes(f)));
            if (lack.length > 0) {
                message.error(`缺少字段: ${lack.join(", ")}`);
                return false;
            }

            const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");
            const records = json.map(row => {
                const id = (row.idCard || "").toString().trim();
                const hash = s3HashCorrelationId(id);
                const obj = buildObjectFromRow(action, row, hash);
                const section = obj.section;
                const unit = obj.unit;
                return buildRecord(action, account, obj, section, unit, hash, now);
            });

            const res = await fetch(`${Setting.ServerUrl}/api/add-records?sync=true`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(records),
            }).then(r => r.json());

            if (res.status === "ok") message.success("批量上链成功");
            else message.error(`批量上链失败：${res.msg}`);
        } catch (e) {
            message.error(`解析失败：${e}`);
        }
        return false;
    };

    const onSubmit = async () => {
        try {
            const v = await form.validateFields();
            const hash = idHash; // 由身份证计算得到
            const obj = buildObjectFromForm(action, v);
            const section = obj.section;
            const unit = obj.unit;
            const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");
            // 填充隐藏的 correlationId
            const withCid = { ...obj, correlationId: hash };
            const record = buildRecord(action, account, withCid, section, unit, hash, now);
            const res = await RecordBackend.addRecord(record);
            if (res.status === "ok") message.success("上链成功"); else message.error(`上链失败：${res.msg}`);
        } catch (e) {
            if (e?.errorFields) return;
            message.error(`${e}`);
        }
    };

    const hospitalOptions = hospitals.map(h => ({ label: h, value: h }));

    return (
        <Card title="病例数据上链">
            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="Action类型" required>
                            <Select value={action} onChange={setAction} options={ACTIONS} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="身份证号" name="idCard" rules={[{ required: true, message: "请输入身份证号" }]}>
                            <Input onChange={onIdCardChange} placeholder="仅用于计算SM3，不会明文上链" />
                        </Form.Item>
                    </Col>
                </Row>

                {/* 动态表单区域 */}
                {action !== "add-knowledge" && (
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="患者姓名" name="patientName" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="本地索引信息" name="localDBIndex" rules={[{ required: REQUIRED_FIELDS[action].includes("localDBIndex") }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="就诊科室" name="unit" rules={[{ required: REQUIRED_FIELDS[action].includes("unit") }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="医院" name="section" rules={[{ required: true }]}>
                            <Select options={hospitalOptions} />
                        </Form.Item>
                    </Col>
                    {REQUIRED_FIELDS[action].includes("consultationTime") && (
                        <Col span={8}>
                            <Form.Item label="就诊时间" name="consultationTime" rules={[{ required: true }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    )}
                    {REQUIRED_FIELDS[action].includes("diagnosis") && (
                        <Col span={8}>
                            <Form.Item label="诊断" name="diagnosis" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                {/* 已去除 correlationId 字段显示（仍会自动计算并上链）*/}

                {/* <Space style={{ marginBottom: 12 }}>
          <Upload beforeUpload={beforeUpload} showUploadList={false} accept=".xls,.xlsx">
            <Button icon={<UploadOutlined />}>批量导入Excel</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={exportTemplate}>下载{action}模板</Button>
        </Space> */}

                <div style={{ textAlign: "right" }}>
                    <Button type="primary" onClick={onSubmit}>上链</Button>
                </div>
            </Form>

            <div style={{ marginTop: 8 }}>
                <Text type="secondary">说明：身份证号仅用于本地SM3计算，页面不显示明文到最终上链数据。</Text>
            </div>
        </Card>
    );
}

function buildObjectFromForm(action, v) {
    // correlationId 由调用方传入，不从表单读取隐藏字段
    const section = v.section;
    const unit = v.unit;
    const baseTime = ensureSecond(v.consultationTime || dayjs());
    if (action === "add-knowledge") {
        return {
            correlationId: undefined, // 将在外层填充
            section,
        };
    }
    const common = {
        correlationId: undefined,
        patientName: v.patientName,
        localDBIndex: v.localDBIndex,
        consultationTime: baseTime,
        section,
        unit,
    };
    if (action === "add-outpatient" || action === "add-telemedicine") {
        return {
            ...common,
            diagnosis: v.diagnosis,
        };
    } else if (action === "add-inpatient") {
        return {
            ...common,
            // 预留：额外临床路径内容，需与医院协调；此处不添加重复键
        };
    }
    return common;
}

function buildObjectFromRow(action, row, hash) {
    const section = row.section;
    const unit = row.unit;
    const baseTime = row.consultationTime ? ensureSecond(row.consultationTime) : undefined;
    if (action === "add-knowledge") {
        return {
            correlationId: hash,
            section,
        };
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
        return {
            ...common,
            diagnosis: row.diagnosis,
        };
    } else if (action === "add-inpatient") {
        return {
            ...common,
        };
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

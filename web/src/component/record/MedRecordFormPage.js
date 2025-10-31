import React from "react";
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Switch, Tag, message } from "antd";
import dayjs from "dayjs";
import * as Setting from "../../Setting";
import * as RecordBackend from "../../backend/RecordBackend";
import { HOSPITAL_OPTIONS, HOSPITAL_UNITS_MAP, DISEASE_CATEGORIES } from "./MedRecordConst";
import { v4 as uuidv4 } from "uuid";

const { Option } = Select;

function formatToIso(dt) {
    return dayjs(dt).format("YYYY-MM-DDTHH:mm:ss");
}

export default function MedRecordFormPage({ account, history }) {
    const [form] = Form.useForm();

    const defaultCorrelationId = uuidv4();
    const defaultHospital = HOSPITAL_OPTIONS[0]?.value;
    const defaultUnits = HOSPITAL_UNITS_MAP[defaultHospital] || [];

    React.useEffect(() => {
        const createdTime = dayjs();
        form.setFieldsValue({
            patient: "",
            hospital: defaultHospital,
            section: defaultHospital,
            unit: undefined,
            objectUnit: undefined,
            diseaseCategory: undefined,
            needCommit: true,
            user: account?.name || "admin",
            correlationId: defaultCorrelationId,
            objectCorrelationId: defaultCorrelationId,
            createdTime,
        });
    }, []); // eslint-disable-line

    // 避免条件化调用 hook：稳定地只调用一次 useWatch
    const watchedHospital = Form.useWatch("hospital", form);
    const units = (watchedHospital && HOSPITAL_UNITS_MAP[watchedHospital]) ? HOSPITAL_UNITS_MAP[watchedHospital] : defaultUnits;

    const needCommit = Form.useWatch("needCommit", form);

    const validateConsistency = () => {
        const v = form.getFieldsValue();
        const errors = [];
        if (v.section !== v.hospital) {
            errors.push("就诊医院 与 section 不一致");
        }
        if (v.unit && v.objectUnit && v.unit !== v.objectUnit) {
            errors.push("就诊科室 与 object.unit 不一致");
        }
        if (v.correlationId !== v.objectCorrelationId) {
            errors.push("关联ID 与 object.correlationId 不一致");
        }
        return errors;
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const errs = validateConsistency();
            if (errs.length > 0) {
                message.error(errs.join("；"));
                return;
            }

            const nowIso = formatToIso(new Date());
            const createdTimeIso = values.createdTime ? formatToIso(values.createdTime) : nowIso;
            const objectPayload = {
                patient: values.patient,
                hospital: values.hospital,
                unit: values.objectUnit || values.unit || "",
                correlationId: values.objectCorrelationId,
            };

            const record = {
                owner: "casibase",
                name: Setting.GenerateId(),
                createdTime: createdTimeIso,
                organization: "casibase",
                clientIp: "", // 由后端自动填充
                user: values.user,
                method: "POST",
                requestUri: "/api/add-record",
                action: "add-store",
                object: JSON.stringify(objectPayload),
                language: "zh-CN",
                response: "",
                isTriggered: true,
                block: "",
                blockHash: "",
                transaction: "",
                userAgent: "", // 由后端自动填充
                needCommit: !!values.needCommit,
                section: values.section,
                unit: values.unit || "",
                correlationId: values.correlationId,
                diseaseCategory: values.diseaseCategory || "",
            };

            const res = await RecordBackend.addRecord(record);
            if (res.status === "ok") {
                message.success("提交成功");
                if (res.data) {
                    // 返回链上结果或错误信息
                    Setting.showMessage("success", "记录已保存");
                }
                history.push("/med-records/list");
            } else {
                message.error(`提交失败：${res.msg}`);
            }
        } catch (e) {
            if (e?.errorFields) return; // 校验错误
            message.error(`提交异常：${e}`);
        }
    };

    return (
        <Card title="病例数据录入" extra={<Tag color={needCommit ? "red" : "default"}>{needCommit ? "待提交" : "已归档"}</Tag>}>
            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="患者姓名" name="patient" rules={[{ required: true, message: "请输入患者姓名" }, { max: 50, message: "50字符以内" }]}>
                            <Input placeholder="如：张三" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="就诊医院" name="hospital" rules={[{ required: true, message: "请选择就诊医院" }]}>
                            <Select options={HOSPITAL_OPTIONS} onChange={(val) => form.setFieldsValue({ section: val })} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="section（需与医院一致）" name="section" rules={[{ required: true, message: "section 必填" }]}>
                            <Select options={HOSPITAL_OPTIONS} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="就诊科室" name="unit">
                            <Select allowClear placeholder="可选" options={(units || []).map(u => ({ label: u, value: u }))} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="object.unit（与上面一致）" name="objectUnit">
                            <Select allowClear placeholder="可选" options={(units || []).map(u => ({ label: u, value: u }))} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="病种分类" name="diseaseCategory">
                            <Select allowClear options={DISEASE_CATEGORIES} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="needCommit（默认勾选）" name="needCommit" valuePropName="checked" initialValue={true}>
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="操作人（自动）" name="user">
                            <Input disabled />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="提交时间（自动）" name="createdTime">
                            <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm:ss" onChange={(v) => form.setFieldsValue({ createdTime: v })} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="关联ID（UUID）" name="correlationId" rules={[{ required: true }]}>
                            <Input disabled />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="object.correlationId（保持一致）" name="objectCorrelationId" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row>
                    <Col span={24} style={{ textAlign: "right" }}>
                        <Button type="primary" onClick={handleSubmit}>提交</Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
}


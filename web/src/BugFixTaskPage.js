import React from "react";
import { Button, Card, Descriptions, message, Form, Input, Switch, Space, Progress } from "antd";
import * as BugFixBackend from "./backend/BugFixTaskBackend";

class BugFixTaskPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            task: null,
            loading: false,
            // builtin tasks definitions (extendable)
            builtinTasks: [
                {
                    key: "fixRecordObject",
                    title: "fixRecordObject",
                    taskType: "fixRecordObject",
                    desc: "修复object错误的记录",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                        { name: "section", label: "section", type: "string", required: true },
                        { name: "action", label: "action", type: "string", required: true },
                    ],
                },
                {
                    key: "reUploadRecordObject",
                    title: "reUploadRecordObject",
                    taskType: "reUploadRecordObject",
                    desc: "重新上传记录的 object 到 IPFS",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                        { name: "section", label: "section", type: "string", required: true },
                        { name: "action", label: "action", type: "string", required: true },
                    ],
                },
                {
                    key: "reCommitRecordToChain",
                    title: "reCommitRecordToChain",
                    taskType: "reCommitRecordToChain",
                    desc: "重新提交记录到链上（用于修复提交失败或丢失的记录）",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                        { name: "section", label: "section", type: "string", required: true },
                        { name: "action", label: "action", type: "string", required: true },
                    ],
                },
                {
                    key: "ipfsArchieve_correlationId_fix",
                    title: "ipfsArchieve_correlationId_fix",
                    taskType: "ipfsArchieve_correlationId_fix",
                    desc: "ipfs归档数据correlationId如为空缺进行同步",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                    ],
                },
                {
                    key: "ipfsArchieve_clearUpload",
                    title: "ipfsArchieve_clearUpload",
                    taskType: "ipfsArchieve_clearUpload",
                    desc: "清除全部的归档数据的ipfs数据",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                    ],
                },
                {
                    key: "ipfsArchieve_clearUpload_by_ipfsAddress",
                    title: "ipfsArchieve_clearUpload_by_ipfsAddress",
                    taskType: "ipfsArchieve_clearUpload_by_ipfsAddress",
                    desc: "清除指定ipfsAddress归档数据的ipfs数据",
                    fields: [
                        { name: "isTest", label: "isTest", type: "boolean", required: true },
                        { name: "ipfsAddress", label: "ipfsAddress", type: "string", required: true },
                    ],
                },
            ],
            showFormFor: null,
            formValues: {},
        };
        this.interval = null;
    }

    componentDidMount() {
        this.fetchTask();
        this.interval = setInterval(() => this.fetchTask(), 30000);
    }

    componentWillUnmount() {
        if (this.interval) clearInterval(this.interval);
    }

    fetchTask = async () => {
        this.setState({ loading: true });
        try {
            const res = await BugFixBackend.getCurrentBugFix();
            if (res.status === "ok") {
                this.setState({ task: res.data });
            } else {
                // res may be raw object
                this.setState({ task: res });
            }
        } catch (e) {
            message.error("Failed to fetch task: " + e.toString());
        } finally {
            this.setState({ loading: false });
        }
    };

    handleStop = async () => {
        try {
            const res = await BugFixBackend.stopBugFix();
            if (res.status === "ok") {
                message.success("Stopped");
                this.fetchTask();
            } else {
                message.error(res.msg || "Stop failed");
            }
        } catch (e) {
            message.error("Stop failed: " + e.toString());
        }
    };

    openTaskForm = (taskKey) => {
        // prefill default values: boolean -> false, string -> ""
        const taskDef = this.state.builtinTasks.find((x) => x.key === taskKey);
        const defaults = {};
        if (taskDef) {
            for (const f of taskDef.fields) {
                if (f.type === "boolean") defaults[f.name] = false;
                else defaults[f.name] = "";
            }
        }
        this.setState({ showFormFor: taskKey, formValues: defaults });
    };

    closeTaskForm = () => {
        this.setState({ showFormFor: null, formValues: {} });
    };

    handleFieldChange = (field, value) => {
        const fv = { ...(this.state.formValues || {}) };
        fv[field] = value;
        this.setState({ formValues: fv });
    };

    handleCreateTask = async (taskDef) => {
        const { formValues } = this.state;
        // validate required
        for (const f of taskDef.fields) {
            if (f.required && (formValues[f.name] === undefined || formValues[f.name] === "")) {
                message.error(`${f.label} is required`);
                return;
            }
        }

        // build params as strings (per requirement)
        const params = {};
        for (const f of taskDef.fields) {
            let v = formValues[f.name];
            if (f.type === "boolean") {
                // accept boolean or switch, convert to string
                v = v ? "true" : "false";
            } else if (v === undefined) {
                v = "";
            } else {
                v = String(v);
            }
            params[f.name] = v;
        }

        try {
            const res = await BugFixBackend.createBugFix(taskDef.taskType, params);
            if (res && res.code === 0 || (res && res.status === "ok")) {
                message.success("Task created");
                this.closeTaskForm();
                this.fetchTask();
            } else {
                message.error(res.msg || JSON.stringify(res));
            }
        } catch (e) {
            message.error("Create failed: " + e.toString());
        }
    };

    render() {
        const { task, loading } = this.state;
        return (
            <div>
                <h1>缝缝补补又一年~</h1>
                <Card title="Record Object Bugfix Task">
                    <div style={{ marginBottom: 12 }}>
                        <Button type="primary" onClick={this.fetchTask} loading={loading}>
                            刷新
                        </Button>
                        <Button style={{ marginLeft: 12 }} danger onClick={this.handleStop}>
                            停止
                        </Button>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <h3>内置任务</h3>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            {this.state.builtinTasks.map((t) => (
                                <Card size="small" key={t.key} type="inner" title={t.title} extra={<Button onClick={() => this.openTaskForm(t.key)}>创建</Button>}>
                                    <div>任务详情：{t.desc}</div>
                                </Card>
                            ))}
                        </Space>
                        {/* 内置任务表单区域（按任务展开） */}
                        {this.state.showFormFor && (
                            (() => {
                                const taskDef = this.state.builtinTasks.find((x) => x.key === this.state.showFormFor);
                                if (!taskDef) return null;
                                return (
                                    <Card size="small" style={{ marginTop: 12 }} title={`创建 ${taskDef.title}`}>
                                        <Form layout="vertical">
                                            {taskDef.fields.map((f) => (
                                                <Form.Item key={f.name} label={f.label} required={f.required}>
                                                    {f.type === "boolean" ? (
                                                        <Switch checked={this.state.formValues[f.name] === true} onChange={(v) => this.handleFieldChange(f.name, v)} />
                                                    ) : (
                                                        <Input value={this.state.formValues[f.name] || ""} onChange={(e) => this.handleFieldChange(f.name, e.target.value)} />
                                                    )}
                                                </Form.Item>
                                            ))}
                                            <Form.Item>
                                                <Space>
                                                    <Button type="primary" onClick={() => this.handleCreateTask(taskDef)}>创建并运行</Button>
                                                    <Button onClick={this.closeTaskForm}>取消</Button>
                                                </Space>
                                            </Form.Item>
                                        </Form>
                                    </Card>
                                );
                            })()
                        )}
                    </div>

                    {task ? (
                        <div>
                            {/* progress bar based on nowFinishRecordsCount / allRecords */}
                            {(() => {
                                const all = Number(task.allRecords) || 0;
                                const finished = Number(task.nowFinishRecordsCount) || 0;
                                const percent = all > 0 ? Math.round((finished / all) * 100) : 0;
                                return (
                                    <div style={{ marginBottom: 12 }}>
                                        <Progress percent={percent} status={percent >= 100 ? "success" : "active"} />
                                        <div style={{ textAlign: "right", fontSize: 12 }}>{finished} / {all}</div>
                                    </div>
                                );
                            })()}

                            <Descriptions bordered column={1} size="small">
                                {Object.keys(task).map((k) => (
                                    <Descriptions.Item key={k} label={k}>{String(task[k])}</Descriptions.Item>
                                ))}
                            </Descriptions>
                        </div>
                    ) : (
                        <div>暂无任务</div>
                    )}
                </Card>
            </div>
        );
    }
}

export default BugFixTaskPage;
// 本页面为代码修复页面，如有需要请联系jjq
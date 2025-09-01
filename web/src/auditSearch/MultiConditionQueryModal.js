import React from "react";
import { Modal, Tabs, Button, Input, Select, Space, message } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;
const compareOptions = [
    { value: "eq", label: "等于(eq)" },
    { value: "ne", label: "不等于(ne)" },
    { value: "gt", label: "大于(gt)" },
    { value: "lt", label: "小于(lt)" },
    { value: "ge", label: "大于等于(ge)" },
    { value: "le", label: "小于等于(le)" },
];
const typeOptions = [
    { value: "string", label: "字符串(string)" },
    { value: "int", label: "整数(int)" },
    { value: "float", label: "浮点(float)" },
];

class MultiConditionQueryModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            queryCond: props.defaultQueryCond || [
                [
                    { field: "", compare: "eq", val: "", type: "string" }
                ]
            ],
            activeTab: "0",
        };
    }
    // 你现在可以通过 this.props.selectedRows 访问主页面传递的选中行信息

    show = () => {
        this.setState({ visible: true });
    };

    hide = () => {
        this.setState({ visible: false });
    };

    handleTabChange = (activeKey) => {
        this.setState({ activeTab: activeKey });
    };

    handleFieldChange = (groupIdx, condIdx, key, value) => {
        const queryCond = [...this.state.queryCond];
        queryCond[groupIdx][condIdx][key] = value;
        this.setState({ queryCond });
    };

    addCondition = (groupIdx) => {
        const queryCond = [...this.state.queryCond];
        queryCond[groupIdx].push({ field: "", compare: "eq", val: "", type: "string" });
        this.setState({ queryCond });
    };

    removeCondition = (groupIdx, condIdx) => {
        const queryCond = [...this.state.queryCond];
        if (queryCond[groupIdx].length > 1) {
            queryCond[groupIdx].splice(condIdx, 1);
            this.setState({ queryCond });
        } else {
            message.warning("每组至少保留一个条件");
        }
    };

    addGroup = () => {
        const queryCond = [...this.state.queryCond, [{ field: "", compare: "eq", val: "", type: "string" }]];
        this.setState({ queryCond, activeTab: String(queryCond.length - 1) });
    };

    removeGroup = (groupIdx) => {
        const queryCond = [...this.state.queryCond];
        if (queryCond.length > 1) {
            queryCond.splice(groupIdx, 1);
            this.setState({ queryCond, activeTab: "0" });
        } else {
            message.warning("至少保留一个条件组");
        }
    };

    handleOk = () => {
        const { queryCond } = this.state;
        for (let groupIdx = 0; groupIdx < queryCond.length; groupIdx++) {
            const group = queryCond[groupIdx];
            for (let condIdx = 0; condIdx < group.length; condIdx++) {
                const cond = group[condIdx];
                if (!cond.field || cond.field.trim() === "") {
                    message.error(`第${groupIdx + 1}组第${condIdx + 1}个条件的字段不能为空`);
                    return;
                }
                if (!cond.val || cond.val.toString().trim() === "") {
                    message.error(`第${groupIdx + 1}组第${condIdx + 1}个条件的值不能为空`);
                    return;
                }
            }
        }
        this.props.onOk && this.props.onOk(queryCond);
        this.hide();
    };

    render() {
        const { visible, queryCond, activeTab } = this.state;
        return (
            <Modal
                title="多条件查询"
                visible={visible}
                onCancel={this.hide}
                onOk={this.handleOk}
                width={800}
                destroyOnClose
                maskClosable={false}
                okText={window.i18next ? i18next.t("general:OK", "确定") : "确定"}
                cancelText={window.i18next ? i18next.t("general:Cancel", "取消") : "取消"}
            >
                <div style={{ marginBottom: 12, color: '#888' }}>
                    <b>提示：</b>条件组之间为<span style={{ color: '#1890ff' }}>或</span>关系，组内为<span style={{ color: '#1890ff' }}>与</span>关系
                </div>
                <Tabs
                    activeKey={activeTab}
                    onChange={this.handleTabChange}
                    type="editable-card"
                    hideAdd={false}
                    onEdit={(targetKey, action) => {
                        if (action === "add") this.addGroup();
                        if (action === "remove" && queryCond.length > 1) this.removeGroup(Number(targetKey));
                    }}
                >
                    {queryCond.map((group, groupIdx) => (
                        <TabPane tab={`条件组${groupIdx + 1}`} key={String(groupIdx)} closable={queryCond.length > 1}>
                            <div>
                                {group.map((cond, condIdx) => (
                                    <Space key={condIdx} style={{ marginBottom: 8 }} align="start">
                                        <Input
                                            placeholder="field"
                                            value={cond.field}
                                            style={{ width: 160 }}
                                            onChange={e => this.handleFieldChange(groupIdx, condIdx, "field", e.target.value)}
                                        />
                                        <Select
                                            value={cond.compare}
                                            style={{ width: 120 }}
                                            onChange={v => this.handleFieldChange(groupIdx, condIdx, "compare", v)}
                                        >
                                            {compareOptions.map(opt => (
                                                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                            ))}
                                        </Select>
                                        <Input
                                            placeholder="val"
                                            value={cond.val}
                                            style={{ width: 180 }}
                                            onChange={e => this.handleFieldChange(groupIdx, condIdx, "val", e.target.value)}
                                        />
                                        <Select
                                            value={cond.type}
                                            style={{ width: 120 }}
                                            onChange={v => this.handleFieldChange(groupIdx, condIdx, "type", v)}
                                        >
                                            {typeOptions.map(opt => (
                                                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                            ))}
                                        </Select>
                                        {/* pos 列已移除 */}
                                        <Button
                                            icon={<MinusCircleOutlined />}
                                            danger
                                            onClick={() => this.removeCondition(groupIdx, condIdx)}
                                            disabled={group.length === 1}
                                        />
                                    </Space>
                                ))}
                                <div style={{ marginTop: 8, textAlign: 'left' }}>
                                    <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        onClick={() => this.addCondition(groupIdx)}
                                    >
                                        添加条件
                                    </Button>
                                </div>
                            </div>
                        </TabPane>
                    ))}
                </Tabs>
                {/* 添加条件组按钮已移除，仅允许通过Tabs的加号添加 */}
            </Modal>
        );
    }
}

export default MultiConditionQueryModal;

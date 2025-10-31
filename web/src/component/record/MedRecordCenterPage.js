import React from "react";
import { Card, Tabs } from "antd";
import RecordCsvImportPage from "./RecordCsvImportPage";
import RecordOnChainPage from "./RecordOnChainPage";

export default function MedRecordCenterPage(props) {
    const { account, history } = props;
    return (
        <Card title="病例数据中心">
            <Tabs
                defaultActiveKey="onchain"
                items={[
                    { key: "onchain", label: "病例录入", children: <RecordOnChainPage account={account} /> },
                    { key: "import", label: "CSV导入", children: <RecordCsvImportPage account={account} /> },
                ]}
            />
        </Card>
    );
}

// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import i18next from "i18next";
import dayjs from "dayjs";
import * as ProviderBackend from "@/backend/ProviderBackend";
import {Badge} from "@/components/ui/badge";
import {ProviderTypeLabel} from "@/components/common/ProviderLogo";
import {CrudListPage} from "@/components/crud/CrudListPage";
import {boolColumn, dateColumn, linkColumn, textColumn, valueFilters} from "@/components/crud/columns";
import type {ColumnDef} from "@/components/crud/types";
import {useAccount} from "@/hooks/use-account";
import {useRequestStore} from "@/hooks/use-request-store";
import * as ProviderSetting from "@/lib/provider-setting";
import * as Setting from "@/lib/setting";

export const ProviderCategories = ["Model", "Embedding", "Storage", "Agent", "Blockchain", "Video", "Text-to-Speech", "Speech-to-Text"];

function newProvider() {
  const randomName = Setting.getRandomName();
  return {
    owner: "admin",
    name: `provider_${randomName}`,
    createdTime: dayjs().format(),
    displayName: `New Provider - ${randomName}`,
    displayName2: "",
    category: "Model",
    type: "OpenAI",
    subType: ProviderSetting.getModelProviderMetadata("OpenAI").defaultSubType,
    clientId: "",
    clientSecret: "",
    mcpTools: [],
    enableThinking: false,
    temperature: 1,
    topP: 1,
    topK: 4,
    frequencyPenalty: 0,
    presencePenalty: 0,
    inputPricePerThousandTokens: 0.0,
    outputPricePerThousandTokens: 0.0,
    currency: "USD",
    providerUrl: "",
    apiVersion: "",
    apiKey: "",
    network: "",
    userKey: "",
    userCert: "",
    signKey: "",
    signCert: "",
    compatibleProvider: "",
    contractName: "",
    contractMethod: "",
    testContent: "",
    state: "Active",
    isRemote: false,
  };
}

export default function ProviderListPage() {
  const {account} = useAccount();
  const store = useRequestStore();

  const columns: ColumnDef<any>[] = [
    linkColumn({dataIndex: "name", to: (r) => `/providers/${r.name}`, width: 180}),
    {
      dataIndex: "displayName",
      title: i18next.t("general:Display name"),
      width: 220,
      sortable: true,
      searchable: true,
      render: (_value, record) => ProviderSetting.getProviderDisplayName(record),
    },
    {
      dataIndex: "category",
      title: i18next.t("general:Category"),
      width: 130,
      sortable: true,
      filters: valueFilters(ProviderCategories),
      render: (value) => (value ? <Badge variant="secondary">{value}</Badge> : null),
    },
    {
      dataIndex: "type",
      title: i18next.t("general:Type"),
      width: 170,
      sortable: true,
      filters: ProviderCategories.map((category) => ({
        label: category,
        value: category,
        children: ProviderSetting.getProviderTypeOptions(category).map((option: any) => ({label: option.name, value: option.name})),
      })),
      render: (value, record) => (value ? <ProviderTypeLabel category={record.category} type={value} /> : null),
    },
    textColumn({dataIndex: "subType", title: i18next.t("provider:Sub type"), width: 180, searchable: true}),
    textColumn({dataIndex: "clientId", title: i18next.t("provider:Client ID"), width: 200, searchable: true}),
    boolColumn({dataIndex: "isDefault", title: i18next.t("store:Is default")}),
    boolColumn({dataIndex: "isRemote", title: i18next.t("provider:Is remote")}),
    {
      dataIndex: "state",
      title: i18next.t("general:State"),
      width: 100,
      sortable: true,
      render: (value) => <Badge variant={value === "Active" ? "success" : "secondary"}>{value}</Badge>,
    },
    // not a column of the antd list, so it starts in the column menu
    {...dateColumn(), defaultHidden: true},
  ];

  return (
    <CrudListPage
      title={i18next.t("general:Providers")}
      columns={columns}
      deps={[account?.name, store]}
      fetch={(q) => ProviderBackend.getProviders(account?.name ?? "", store, q.page, q.pageSize, q.searchedColumn, q.searchText, q.sortField, q.sortOrder)}
      newRecord={newProvider}
      editUrl={(r) => `/providers/${r.name}`}
      remove={(r) => ProviderBackend.deleteProvider(r)}
      readOnly={!Setting.isAdminUser(account)}
      rowReadOnly={(r) => Boolean(r.isRemote)}
    />
  );
}

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

import * as React from "react";
import i18next from "i18next";
import FileSaver from "file-saver";
import {Copy, Download, RefreshCw} from "lucide-react";
import {useNavigate, useParams} from "react-router-dom";
import * as ProviderBackend from "@/backend/ProviderBackend";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {OpenAiCompatibleConfig} from "@/components/common/OpenAiCompatibleConfig";
import {getProviderSubTypeSelectOptions, getProviderTypeSelectOptions} from "@/components/common/ProviderLogo";
import {ProviderTestWidget, hasProviderTest} from "@/components/common/ProviderTestWidget";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import {FormRow} from "@/components/crud/FormRow";
import {SimpleEditPage, type EditField} from "@/components/crud/SimpleEditPage";
import {useAccount} from "@/hooks/use-account";
import type {EditMode} from "@/lib/crud";
import * as ProviderSetting from "@/lib/provider-setting";
import * as Setting from "@/lib/setting";

const CATEGORIES = ["Storage", "Model", "Embedding", "Blockchain", "Video", "Text-to-Speech", "Speech-to-Text"];
const CURRENCIES = ["USD", "CNY", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "HKD", "SGD"];

// the types whose API lists its models, so the sub type can be picked from the live list
const FETCHABLE_MODEL_TYPES = ["OpenAI", "OpenRouter", "Local", "OpenAI Compatible", "Ollama", "DeepSeek", "Moonshot", "Grok", "Silicon Flow", "Mistral", "StepFun"];
const SELF_PRICED_TYPES = ["Local", "Ollama", "OpenAI Compatible"];

const CATEGORY_DEFAULTS: Record<string, {type: string; subType?: string}> = {
  "Storage": {type: "Local File System"},
  "Model": {type: "OpenAI", subType: ProviderSetting.getModelProviderMetadata("OpenAI").defaultSubType},
  "Embedding": {type: "OpenAI", subType: "text-embedding-ada-002"},
  "Video": {type: "AWS"},
  "Text-to-Speech": {type: "Alibaba Cloud", subType: "cosyvoice-v2"},
  "Speech-to-Text": {type: "Alibaba Cloud", subType: "fun-asr-realtime"},
};

const EMBEDDING_DEFAULT_SUB_TYPES: Record<string, string> = {
  "OpenAI": "text-embedding-ada-002",
  "Gemini": "embedding-001",
  "Hugging Face": "sentence-transformers/all-MiniLM-L6-v2",
  "Cohere": "embed-english-v2.0",
  "Baidu Cloud": "Embedding-V1",
  "Local": "custom-embedding",
  "Azure": "text-embedding-ada-002",
};

const TEMPERATURE_TYPES = ["OpenRouter", "iFlytek", "Hugging Face", "Baidu Cloud", "MiniMax", "Gemini", "Alibaba Cloud", "Baichuan", "Volcano Engine", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Silicon Flow", "Ollama", "Writer"];
const TOP_P_TYPES = ["OpenRouter", "Baidu Cloud", "Gemini", "Alibaba Cloud", "Baichuan", "Volcano Engine", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Silicon Flow", "Ollama", "Writer"];
// the APIs that take a temperature up to 2 instead of 1
const WIDE_TEMPERATURE_TYPES = ["Alibaba Cloud", "Gemini", "OpenAI", "OpenRouter", "Baichuan", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Ollama", "Writer"];

// OpenAI's reasoning models reject the sampling parameters
function isOpenAiReasoningModel(subType: string) {
  return ["o1", "o3", "o4"].some((prefix) => (subType ?? "").includes(prefix));
}

function isTemperatureEnabled(p: any) {
  return p.category === "Model" && (TEMPERATURE_TYPES.includes(p.type) || (p.type === "OpenAI" && !isOpenAiReasoningModel(p.subType)));
}

function isTopPEnabled(p: any) {
  return p.category === "Model" && (TOP_P_TYPES.includes(p.type) || (p.type === "OpenAI" && !isOpenAiReasoningModel(p.subType)));
}

function getClientIdLabelKey(p: any) {
  if (["Model", "Embedding"].includes(p.category)) {
    const byType: Record<string, string> = {
      "Tencent Cloud": "general:Secret ID",
      "Baidu Cloud": "general:API key",
      "Azure": "provider:Deployment name",
      "MiniMax": "provider:Group ID",
    };
    if (byType[p.type]) {
      return byType[p.type];
    }
  }
  if (p.category === "Storage") {
    return p.type === "Alibaba Cloud OSS" ? "provider:Client ID" : "store:Storage subpath";
  }
  return "provider:Client ID";
}

function getClientSecretLabelKey(p: any) {
  if (["Storage", "Embedding", "Text-to-Speech", "Speech-to-Text"].includes(p.category)) {
    return p.type === "Baidu Cloud" ? "general:Access secret" : "general:Secret key";
  }
  if (p.category === "Model") {
    return "general:API key";
  }
  if (p.category === "Blockchain" && p.type === "Ethereum") {
    return "provider:Private key";
  }
  return "provider:Client secret";
}

function getProviderUrlLabelKey(p: any) {
  if (p.category === "Storage" && p.type === "Alibaba Cloud OSS") {
    return "provider:Endpoint";
  }
  if (p.category === "Model") {
    if (p.type === "Volcano Engine") {
      return "provider:Endpoint ID";
    }
    if (p.type === "OpenAI Compatible") {
      return "provider:Endpoint";
    }
  }
  return "general:Provider URL";
}

function showsClientId(p: any) {
  return (p.category === "Embedding" && ["Baidu Cloud", "Tencent Cloud"].includes(p.type)) ||
    p.category === "Storage" ||
    (p.category === "Blockchain" && !["ChainMaker", "Ethereum"].includes(p.type)) ||
    (["Model", "Embedding"].includes(p.category) && p.type === "Azure") ||
    !["Storage", "Model", "Embedding", "Text-to-Speech", "Speech-to-Text", "Blockchain"].includes(p.category);
}

function showsClientSecret(p: any) {
  return !((p.category === "Storage" && p.type !== "Alibaba Cloud OSS") ||
    (p.category === "Blockchain" && p.type === "ChainMaker") ||
    p.type === "Ollama");
}

function showsProviderUrl(p: any) {
  if (p.category === "Blockchain" || (p.category === "Storage" && p.type === "Alibaba Cloud OSS")) {
    return true;
  }
  if (p.category === "Model") {
    return ["Local", "Ollama", "Azure", "Volcano Engine", "Tencent Cloud", "OpenCode", "OpenAI Compatible"].includes(p.type);
  }
  return true;
}

function showsRegion(p: any) {
  if (p.category === "Storage") {
    return p.type === "Alibaba Cloud OSS";
  }
  return !["Model", "Embedding", "Text-to-Speech", "Speech-to-Text"].includes(p.category) && !(p.category === "Blockchain" && p.type === "Ethereum");
}

const isOss = (p: any) => p.category === "Storage" && p.type === "Alibaba Cloud OSS";
const isChainMaker = (p: any) => p.category === "Blockchain" && p.type === "ChainMaker";
const showsThinking = (p: any) => p.category === "Model" && p.type === "Claude" && ProviderSetting.getThinkingModelMaxTokens(p.subType ?? "") !== 0;

function isEnglish() {
  const lang = Setting.getLanguage();
  return !lang || lang === "null" || lang === "en" || lang.startsWith("en-");
}

/** a free-text input that also suggests values, antd's AutoComplete */
function SuggestInput({id, value, options, disabled, placeholder, onChange}: {
  id: string;
  value: string;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Input list={id} value={value ?? ""} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <datalist id={id}>
        {options.filter((option) => option !== "").map((option) => <option key={option} value={option} />)}
      </datalist>
    </>
  );
}

function SubTypeInput({record, mode, update}: {record: any; mode: EditMode; update: (field: string, value: any) => void}) {
  const [models, setModels] = React.useState<string[]>([]);
  const [fetching, setFetching] = React.useState(false);

  // a list fetched for one type means nothing for the next
  React.useEffect(() => setModels([]), [record.type]);

  const fetchModels = () => {
    setFetching(true);
    ProviderBackend.getProviderModels(record).then((res: any) => {
      if (res.status === "ok") {
        setModels(res.data ?? []);
        Setting.showMessage("success", i18next.t("provider:Successfully fetched models"));
      } else {
        Setting.showMessage("error", `${i18next.t("provider:Failed to fetch models")}: ${res.msg}`);
      }
    }).catch((error: any) => {
      Setting.showMessage("error", `${i18next.t("provider:Failed to fetch models")}: ${error?.message ?? error}`);
    }).finally(() => setFetching(false));
  };

  const disabled = mode === "view";
  const options = models.length > 0
    ? models.map((model) => ({value: model, label: model}))
    : getProviderSubTypeSelectOptions(record.category, record.type);

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        {record.type === "Ollama" ? (
          <SuggestInput
            id="provider-sub-types"
            value={record.subType}
            options={options.map((option) => option.value)}
            disabled={disabled}
            placeholder={i18next.t("provider:Please select or enter the model name")}
            onChange={(value) => update("subType", value)}
          />
        ) : (
          <SearchableSelect
            value={record.subType}
            options={options}
            disabled={disabled || record.type === "OpenCode"}
            onChange={(value) => update("subType", value)}
          />
        )}
      </div>
      {record.category === "Model" && FETCHABLE_MODEL_TYPES.includes(record.type) ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={disabled || fetching}
          title={i18next.t("provider:Fetch models")}
          aria-label={i18next.t("provider:Fetch models")}
          onClick={fetchModels}
        >
          <RefreshCw className={fetching ? "animate-spin" : undefined} />
        </Button>
      ) : null}
    </div>
  );
}

/** a certificate or key in PEM, with the copy and download buttons the antd page had */
function PemInput({value, fileName, disabled, onChange}: {value: string; fileName: string; disabled?: boolean; onChange: (value: string) => void}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!value} onClick={() => Setting.copyToClipboard(value)}>
          <Copy />
          {i18next.t("general:Copy")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!value}
          onClick={() => FileSaver.saveAs(new Blob([value], {type: "text/plain;charset=utf-8"}), fileName)}
        >
          <Download />
          {i18next.t("general:Download")}
        </Button>
      </div>
      <Textarea rows={10} className="font-mono text-xs" value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function pemField(name: string, labelKey: string, fileName: string): EditField {
  return {
    type: "custom",
    name,
    labelKey,
    when: (ctx) => isChainMaker(ctx.record),
    render: (ctx, update) => (
      <PemInput value={ctx.record[name]} fileName={fileName} disabled={ctx.mode === "view"} onChange={(value) => update(name, value)} />
    ),
  };
}

/** a slider with its number next to it, for the sampling parameters */
function SliderInput({value, min, max, step, disabled, onChange}: {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const current = Number.isFinite(Number(value)) ? Number(value) : 0;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="h-2 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <Input
        type="number"
        className="w-24"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(Setting.myParseFloat(e.target.value))}
      />
    </div>
  );
}

function ModelParametersCard({record, mode, update}: {record: any; mode: EditMode; update: (field: string, value: any) => void}) {
  const temperature = isTemperatureEnabled(record);
  const topP = isTopPEnabled(record);
  const topK = record.type === "Gemini";
  if (!temperature && !topP && !topK) {
    return null;
  }
  const disabled = mode === "view";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{i18next.t("provider:Advanced Model Parameters")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-10 gap-y-4 xl:grid-cols-2">
        {temperature ? (
          <FormRow labelKey="provider:Temperature">
            <SliderInput min={0} max={WIDE_TEMPERATURE_TYPES.includes(record.type) ? 2 : 1} step={0.01} value={record.temperature} disabled={disabled} onChange={(v) => update("temperature", v)} />
          </FormRow>
        ) : null}
        {topP ? (
          <FormRow labelKey="provider:Top P">
            <SliderInput min={0} max={1} step={0.01} value={record.topP} disabled={disabled} onChange={(v) => update("topP", v)} />
          </FormRow>
        ) : null}
        {temperature ? (
          <FormRow labelKey="provider:Presence penalty">
            <SliderInput min={record.type === "OpenAI" ? -2 : 1} max={2} step={0.01} value={record.presencePenalty ?? 0} disabled={disabled} onChange={(v) => update("presencePenalty", v)} />
          </FormRow>
        ) : null}
        {topP ? (
          <FormRow labelKey="provider:Frequency penalty">
            <SliderInput min={-2} max={2} step={0.01} value={record.frequencyPenalty ?? 0} disabled={disabled} onChange={(v) => update("frequencyPenalty", v)} />
          </FormRow>
        ) : null}
        {topK ? (
          <FormRow labelKey="provider:Top K">
            <SliderInput min={1} max={6} step={1} value={record.topK} disabled={disabled} onChange={(v) => update("topK", Math.round(v))} />
          </FormRow>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProviderTestCard({record, mode, providerName, update}: {record: any; mode: EditMode; providerName: string; update: (field: string, value: any) => void}) {
  const navigate = useNavigate();
  // what the server holds; a test runs against the saved provider, so edits are saved first
  const saved = React.useRef(JSON.stringify(record));

  const ensureSaved = async() => {
    const current = JSON.stringify(record);
    if (mode === "view" || current === saved.current) {
      return true;
    }
    const res = await ProviderBackend.updateProvider(record.owner, providerName, record);
    if (res.status !== "ok") {
      Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
      return false;
    }
    saved.current = current;
    if (record.name !== providerName) {
      // the provider now lives under its new name; the page follows it there
      navigate(`/providers/${record.name}`, {replace: true});
      return false;
    }
    return true;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{i18next.t("provider:Provider Test")}</CardTitle>
        <CardDescription>{i18next.t("provider:Provider test - Tooltip")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProviderTestWidget provider={record} onUpdateProvider={update} ensureSaved={ensureSaved} />
      </CardContent>
    </Card>
  );
}

export default function ProviderEditPage() {
  const {providerName = ""} = useParams();
  const {account} = useAccount();

  const fields: EditField[] = [
    {type: "text", name: "name", labelKey: "general:Name", required: true},
    {type: "text", name: "displayName", labelKey: "general:Display name"},
    {type: "text", name: "displayName2", labelKey: "general:Display name 2", when: () => !isEnglish()},
    {
      type: "select",
      name: "category",
      labelKey: "general:Category",
      options: () => CATEGORIES.map((value) => ({value, label: value})),
      onChange: (value, _ctx, updateFields) => {
        const defaults = CATEGORY_DEFAULTS[value] ?? {type: ProviderSetting.getProviderTypeOptions(value)[0]?.name ?? ""};
        updateFields({category: value, ...defaults});
      },
    },
    {
      type: "select",
      name: "type",
      labelKey: "general:Type",
      options: (ctx) => getProviderTypeSelectOptions(ctx.record.category),
      onChange: (value, ctx, updateFields) => {
        const category = ctx.record.category;
        let subType: string | undefined;
        if (category === "Model") {
          subType = value === "OpenAI Compatible" ? "gpt-image-2" : ProviderSetting.getModelProviderMetadata(value).defaultSubType;
        } else if (category === "Embedding") {
          subType = EMBEDDING_DEFAULT_SUB_TYPES[value];
        } else if (category === "Text-to-Speech" && value === "Alibaba Cloud") {
          subType = "cosyvoice-v2";
        } else if (category === "Speech-to-Text" && value === "Alibaba Cloud") {
          subType = "fun-asr-realtime";
        }
        updateFields(subType === undefined ? {type: value} : {type: value, subType});
      },
    },
    {
      type: "custom",
      name: "subType",
      labelKey: "provider:Sub type",
      when: (ctx) => ["Model", "Embedding", "Text-to-Speech", "Speech-to-Text"].includes(ctx.record.category),
      render: (ctx, update) => <SubTypeInput record={ctx.record} mode={ctx.mode} update={update} />,
    },
    {
      type: "select",
      name: "flavor",
      labelKey: "provider:Flavor",
      when: (ctx) => ctx.record.category === "Text-to-Speech" && ctx.record.type === "Alibaba Cloud" && ctx.record.subType === "cosyvoice-v2",
      options: (ctx) => ProviderSetting.getTtsFlavorOptions(ctx.record.type, ctx.record.subType).map((item: any) => ({value: item.id, label: item.name})),
    },
    {
      type: "url",
      name: "providerUrl",
      labelKey: (ctx) => getProviderUrlLabelKey(ctx.record),
      when: (ctx) => showsProviderUrl(ctx.record),
    },
    {
      type: "custom",
      name: "apiVersion",
      labelKey: "provider:API version",
      when: (ctx) => ["Model", "Embedding"].includes(ctx.record.category) && ctx.record.type === "Azure",
      render: (ctx, update) => (
        <SuggestInput
          id="provider-api-versions"
          value={ctx.record.apiVersion}
          options={ProviderSetting.getProviderAzureApiVersionOptions().map((item: any) => item.id)}
          disabled={ctx.mode === "view"}
          onChange={(value) => update("apiVersion", value)}
        />
      ),
    },
    {
      // Cohere embeddings keep their input type in the client ID column
      type: "custom",
      name: "cohereInputType",
      labelKey: "provider:Input type",
      when: (ctx) => ctx.record.category === "Embedding" && ctx.record.type === "Cohere",
      render: (ctx, update) => (
        <SearchableSelect
          value={ctx.record.clientId}
          disabled={ctx.mode === "view"}
          options={["search_document", "search_query"].map((value) => ({value, label: value}))}
          onChange={(value) => update("clientId", value)}
        />
      ),
    },
    {
      type: "text",
      name: "clientId",
      labelKey: (ctx) => getClientIdLabelKey(ctx.record),
      when: (ctx) => showsClientId(ctx.record),
    },
    {
      type: "custom",
      name: "compatibleProvider",
      labelKey: "provider:Compatible provider",
      when: (ctx) => ctx.record.type === "Local",
      render: (ctx, update) => (
        <SuggestInput
          id="provider-compatible-providers"
          value={ctx.record.compatibleProvider}
          options={ProviderSetting.getCompatibleProviderOptions(ctx.record.category).map((item: any) => item.id)}
          disabled={ctx.mode === "view"}
          placeholder="Please select or enter the compatible provider"
          onChange={(value) => update("compatibleProvider", value)}
        />
      ),
    },
    {
      type: "password",
      name: "clientSecret",
      labelKey: (ctx) => getClientSecretLabelKey(ctx.record),
      when: (ctx) => showsClientSecret(ctx.record),
    },
    {
      type: "number",
      name: "inputPricePerThousandTokens",
      labelKey: "provider:Input price / 1k tokens",
      step: "0.0001",
      min: 0,
      when: (ctx) => ["Model", "Embedding"].includes(ctx.record.category) && SELF_PRICED_TYPES.includes(ctx.record.type) &&
        !(ctx.record.category === "Embedding" && ctx.record.type === "OpenAI Compatible"),
    },
    {
      type: "number",
      name: "outputPricePerThousandTokens",
      labelKey: "provider:Output price / 1k tokens",
      step: "0.0001",
      min: 0,
      when: (ctx) => ctx.record.category === "Model" && SELF_PRICED_TYPES.includes(ctx.record.type),
    },
    {
      type: "select",
      name: "currency",
      labelKey: "provider:Currency",
      when: (ctx) => SELF_PRICED_TYPES.includes(ctx.record.type),
      options: () => CURRENCIES.map((value) => ({value, label: value})),
    },
    {type: "switch", name: "enableThinking", labelKey: "provider:Enable thinking", when: (ctx) => showsThinking(ctx.record)},
    {
      type: "number",
      name: "topK",
      labelKey: "provider:Thinking tokens",
      min: 1024,
      when: (ctx) => showsThinking(ctx.record) && Boolean(ctx.record.enableThinking),
      validate: (value, ctx) => {
        const max = ProviderSetting.getThinkingModelMaxTokens(ctx.record.subType ?? "") - 1;
        return value < 1024 || value > max ? `1024 - ${max}` : undefined;
      },
    },
    {
      type: "text",
      name: "region",
      labelKey: (ctx) => (isChainMaker(ctx.record) ? "general:Org ID" : "general:Region"),
      when: (ctx) => showsRegion(ctx.record),
    },
    {type: "text", name: "domain", labelKey: "provider:Bucket", when: (ctx) => isOss(ctx.record)},
    {type: "text", name: "cdnDomain", labelKey: "provider:CDN domain", when: (ctx) => isOss(ctx.record)},
    {type: "text", name: "chain", labelKey: "provider:Chain", when: (ctx) => ctx.record.category === "Blockchain" && ctx.record.type !== "Ethereum"},
    {
      type: "text",
      name: "network",
      labelKey: (ctx) => (isChainMaker(ctx.record) ? "general:Node address" : "general:Network"),
      when: (ctx) => ctx.record.category === "Blockchain" && ctx.record.type !== "Ethereum",
    },
    {
      type: "select",
      name: "text",
      labelKey: "provider:Auth type",
      when: (ctx) => isChainMaker(ctx.record),
      options: () => ["permissionedwithcert", "permissionedwithkey", "public"].map((value) => ({value, label: value})),
    },
    pemField("userCert", "cert:User cert", "user_cert.pem"),
    pemField("userKey", "cert:User key", "user_key.key"),
    pemField("signCert", "cert:Sign cert", "sign_cert.pem"),
    pemField("signKey", "cert:Sign key", "sign_key.key"),
    {
      type: "text",
      name: "contractName",
      labelKey: (ctx) => (ctx.record.type === "Ethereum" ? "provider:Contract address" : "provider:Contract name"),
      when: (ctx) => ctx.record.category === "Blockchain" && ["Ethereum", "ChainMaker"].includes(ctx.record.type),
    },
    {
      type: "text",
      name: "contractMethod",
      labelKey: "provider:Invoke method",
      when: (ctx) => ctx.record.category === "Blockchain" && ["Ethereum", "ChainMaker"].includes(ctx.record.type),
    },
    {
      type: "custom",
      name: "browserUrl",
      labelKey: "provider:Browser URL",
      when: (ctx) => ctx.record.category === "Blockchain",
      render: (ctx, update) => (
        <Input
          value={ctx.record.browserUrl ?? ""}
          disabled={ctx.mode === "view"}
          placeholder={ctx.record.type === "ChainMaker" ? "https://explorer-testnet.chainmaker.org.cn/chainmaker_testnet_chain/block/{bh}" : ""}
          onChange={(e) => update("browserUrl", e.target.value)}
        />
      ),
    },
    {type: "switch", name: "isDefault", labelKey: "store:Is default"},
    {type: "switch", name: "isRemote", labelKey: "provider:Is remote", disabled: () => true},
    {
      type: "select",
      name: "state",
      labelKey: "general:State",
      options: () => [
        {value: "Active", label: i18next.t("general:Active")},
        {value: "Inactive", label: i18next.t("general:Inactive")},
      ],
    },
  ];

  return (
    <SimpleEditPage
      titleKey="provider:Edit Provider"
      backTo="/providers"
      deps={[providerName]}
      fields={fields}
      fetch={() => ProviderBackend.getProvider("admin", providerName)}
      add={(record) => ProviderBackend.addProvider(record)}
      update={(record) => ProviderBackend.updateProvider("admin", providerName, record)}
      editUrl={(record) => `/providers/${record.name}`}
      readOnly={(record) => Boolean(record.isRemote)}
    >
      {(ctx, update) => (
        <div className="mt-6 space-y-4">
          {ctx.record.category === "Model" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{i18next.t("general:OpenAI compatible API")}</CardTitle>
                <CardDescription>{i18next.t("general:API integration hint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <OpenAiCompatibleConfig
                  apiKey={ctx.record.externalApiKey}
                  disabled={ctx.mode === "view" || !Setting.isAdminUser(account)}
                  onChange={(value) => update("externalApiKey", value)}
                />
              </CardContent>
            </Card>
          ) : null}
          {ctx.record.category === "Model" ? <ModelParametersCard record={ctx.record} mode={ctx.mode} update={update} /> : null}
          {ctx.mode !== "add" && hasProviderTest(ctx.record.category) ? (
            <ProviderTestCard record={ctx.record} mode={ctx.mode} providerName={providerName} update={update} />
          ) : null}
        </div>
      )}
    </SimpleEditPage>
  );
}

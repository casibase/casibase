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
import {CheckCircle2, XCircle} from "lucide-react";
import {Link, useNavigate, useParams} from "react-router-dom";
import * as ProviderBackend from "@/backend/ProviderBackend";
import * as ResourceBackend from "@/backend/ResourceBackend";
import * as ServerBackend from "@/backend/ServerBackend";
import * as SkillBackend from "@/backend/SkillBackend";
import * as StorageProviderBackend from "@/backend/StorageProviderBackend";
import * as StoreBackend from "@/backend/StoreBackend";
import * as ToolBackend from "@/backend/ToolBackend";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmButton} from "@/components/common/ConfirmButton";
import {ImageUrlInput} from "@/components/common/ImageUrlInput";
import {Loading} from "@/components/common/Loading";
import {MultiSelect} from "@/components/common/MultiSelect";
import {OpenAiCompatibleConfig} from "@/components/common/OpenAiCompatibleConfig";
import {ProviderTypeLabel} from "@/components/common/ProviderLogo";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import {TagsInput} from "@/components/common/TagsInput";
import {UnauthorizedPage} from "@/components/common/UnauthorizedPage";
import {EditPageShell} from "@/components/crud/EditPageShell";
import {FileTree} from "@/components/store/FileTree";
import {EditableTable} from "@/components/crud/EditableTable";
import {FormRow, FormSection} from "@/components/crud/FormRow";
import {useAccount} from "@/hooks/use-account";
import {useEditRecord} from "@/hooks/use-edit-record";
import {getModeTitleKey, submitEdit} from "@/lib/crud";
import * as ProviderSetting from "@/lib/provider-setting";
import * as Setting from "@/lib/setting";
import {PublishStateBadge, useOrganizationUsers, userOptions} from "@/pages/StoreListPage";
import * as Conf from "@/Conf";

const GRADES = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"];
const SUBJECTS = ["语文", "数学", "英语", "道德与法治", "科学", "物理", "化学", "生物学", "历史", "地理", "体育与健康", "音乐", "美术"];
const BROWSER_BUILT_IN = "Browser Built-In";

function useList(load: () => Promise<any>, deps: React.DependencyList) {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    load().then((res: any) => {
      if (res.status === "ok") {
        setItems(res.data ?? []);
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return items;
}

function providerOptions(providers: any[]) {
  return providers.map((provider) => ({
    value: provider.name,
    keywords: `${provider.name} ${provider.displayName ?? ""} ${provider.type ?? ""}`,
    label: <ProviderTypeLabel category={provider.category} type={provider.type} text={`${ProviderSetting.getProviderDisplayName(provider)} (${provider.name})`} />,
  }));
}

const emptyOption = () => ({value: "", label: <span className="text-muted-foreground">{i18next.t("general:empty")}</span>, keywords: "empty"});

function getPublishChecks(store: any) {
  const isDefaultDisplayName = !store.displayName || store.displayName.includes("New Store");
  const isDefaultAvatar = !store.avatar || store.avatar.includes("openagent.png") || store.avatar.includes("casibase.png");
  return [
    {passed: !isDefaultDisplayName, text: i18next.t("store:Set a custom display name (not the default \"New Store\" name)")},
    {passed: !isDefaultAvatar, text: i18next.t("store:Upload a custom avatar (not the default avatar)")},
    {passed: (store.messageCount || 0) >= 200, text: `${i18next.t("store:Have at least 200 messages")} (${store.messageCount || 0}/200)`},
    {passed: (store.vectorCount || 0) >= 100, text: `${i18next.t("store:Have at least 100 vectors")} (${store.vectorCount || 0}/100)`},
  ];
}

function PublishingSection({store, account, onPublish}: {store: any; account: any; onPublish: (state: string) => void}) {
  const checks = getPublishChecks(store);
  const eligible = checks.every((check) => check.passed);
  const pending = {value: "Pending", label: i18next.t("store:Pending Review"), disabled: !eligible};
  const privateOption = {value: "", label: i18next.t("store:Private")};
  const rejected = {value: "Rejected", label: i18next.t("store:Rejected")};

  // a global admin decides; an organization admin and the owner may only ask
  let options: {value: string; label: string; disabled?: boolean}[] | null = null;
  if (Setting.isGlobalAdminUser(account)) {
    options = [privateOption, {...pending, disabled: false}, {value: "Published", label: i18next.t("store:Published")}, rejected];
  } else if (Setting.isAdminUser(account)) {
    options = [privateOption, pending, rejected];
  } else if (store.owner === account?.name) {
    options = [privateOption, pending];
  }

  return (
    <FormRow labelKey="store:Publish State" block>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <PublishStateBadge state={store.publishState} />
          {options ? (
            <div className="w-48">
              <SearchableSelect value={store.publishState || ""} allowUnknownValue={false} options={options} onChange={onPublish} />
            </div>
          ) : null}
          {store.publishState === "Published" ? <Link to="/hub" className="text-sm underline-offset-4 hover:underline">{i18next.t("store:View in Hub")}</Link> : null}
        </div>
        {options ? (
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">{i18next.t("store:Requirements to submit for review")}:</div>
            {checks.map((check) => (
              <div key={check.text} className={check.passed ? "flex items-center gap-1.5 text-success" : "flex items-center gap-1.5 text-muted-foreground"}>
                {check.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                {check.text}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </FormRow>
  );
}

/** The store's settings; on an agent's page `basePath` is "/agents", so saving stays among the agent pages. */
export default function StoreEditPage({basePath = "/stores"}: {basePath?: string} = {}) {
  const {owner = "", storeName = ""} = useParams();
  const navigate = useNavigate();
  const {account} = useAccount();
  const [saving, setSaving] = React.useState(false);
  const {record: store, updateField, loading, denied, mode, setMode} = useEditRecord<any>({
    fetch: () => StoreBackend.getStore(owner, storeName),
    deps: [owner, storeName],
  });

  const accountName = account?.name ?? "";
  const providers = useList(() => ProviderBackend.getProviders(accountName), [accountName]);
  const casdoorStorageProviders = useList(() => StorageProviderBackend.getStorageProviders(accountName), [accountName]);
  const servers = useList(() => ServerBackend.getServers(accountName), [accountName]);
  const skills = useList(() => SkillBackend.getSkills(accountName), [accountName]);
  const tools = useList(() => ToolBackend.getTools(accountName), [accountName]);
  const stores = useList(() => StoreBackend.getStores(accountName), [accountName]);
  const isAdmin = Setting.isAdminUser(account);
  const users = useOrganizationUsers(isAdmin);

  // the store may be addressed under another owner's name; the page moves to where it lives
  React.useEffect(() => {
    if (store && mode !== "add" && store.owner && store.owner !== owner) {
      navigate(`${basePath}/${store.owner}/${store.name}`, {replace: true});
    }
  }, [store, mode, owner, navigate, basePath]);

  if (denied) {
    return <UnauthorizedPage />;
  }
  if (loading || store === null) {
    return <Loading />;
  }

  const byCategory = (category: string) => providers.filter((provider) => provider.category === category);
  const extra = Boolean(store.enableExtraOptions);
  const otherStores = stores.filter((item) => item.name !== store.name).map((item) => ({value: item.name, label: `${item.displayName} (${item.name})`}));

  const persist = (record: any) => {
    const payload = Setting.deepCopy(record);
    payload.fileTree = undefined;
    return payload;
  };

  const save = async(exitAfterSave: boolean) => {
    if (!store.name || store.name.trim() === "") {
      Setting.showMessage("error", i18next.t("store:Name cannot be empty"));
      return;
    }
    setSaving(true);
    await submitEdit({
      mode,
      record: persist(store),
      add: StoreBackend.addStore,
      update: (record) => StoreBackend.updateStore(owner, storeName, record),
      onSaved: (saved) => {
        window.dispatchEvent(new Event("storesChanged"));
        setMode("edit");
        if (exitAfterSave) {
          navigate(basePath === "/stores" ? "/stores" : `${basePath}/${saved.owner}/${saved.name}`);
        } else if (saved.owner !== owner || saved.name !== storeName) {
          navigate(`${basePath}/${saved.owner}/${saved.name}`, {replace: true});
        }
      },
    });
    setSaving(false);
  };

  // publishing takes effect at once, like the antd page, rather than waiting for Save
  const publish = async(state: string) => {
    const res: any = await StoreBackend.updateStore(owner, storeName, {...persist(store), publishState: state});
    if (res.status === "ok") {
      Setting.showMessage("success", i18next.t("general:Successfully saved"));
      updateField("publishState", state);
    } else {
      Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
    }
  };

  const claim = async() => {
    const res: any = await StoreBackend.claimStore(store.owner, store.name);
    if (res.status === "ok") {
      Setting.showMessage("success", i18next.t("general:Successfully saved"));
      window.dispatchEvent(new Event("storesChanged"));
      navigate(`${basePath}/${res.data.owner}/${res.data.name}`, {replace: true});
    } else {
      Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
    }
  };

  // only the tree is taken from the reload, so unsaved edits in the form survive an upload
  const refreshFileTree = async() => {
    const res: any = await StoreBackend.getStore(store.owner, store.name);
    if (res.status === "ok" && res.data) {
      updateField("fileTree", res.data.fileTree);
    }
  };

  const uploadAvatar = async(file: File) => {
    const res: any = await ResourceBackend.uploadResource(store.owner, "avatar", "store", store.name, file);
    // the same object name is reused, so the browser would keep showing the old picture
    if (res.status === "ok" && typeof res.data === "string" && res.data !== "") {
      return {...res, data: `${res.data}${res.data.includes("?") ? "&" : "?"}t=${Date.now()}`};
    }
    return res;
  };

  const text = (name: string, labelKey: string, options?: {disabled?: boolean; placeholder?: string}) => (
    <FormRow labelKey={labelKey}>
      <Input value={store[name] ?? ""} disabled={options?.disabled} placeholder={options?.placeholder} onChange={(e) => updateField(name, e.target.value)} />
    </FormRow>
  );

  const textarea = (name: string, labelKey: string, rows: number) => (
    <FormRow labelKey={labelKey} block>
      <Textarea rows={rows} value={store[name] ?? ""} onChange={(e) => updateField(name, e.target.value)} />
    </FormRow>
  );

  const number = (name: string, labelKey: string, options?: {min?: number; max?: number; step?: number}) => (
    <FormRow labelKey={labelKey}>
      <Input
        type="number"
        min={options?.min ?? 0}
        max={options?.max}
        step={options?.step}
        value={store[name] ?? 0}
        onChange={(e) => updateField(name, options?.step ? Setting.myParseFloat(e.target.value) : Setting.myParseInt(e.target.value))}
      />
    </FormRow>
  );

  const toggle = (name: string, labelKey: string, checked?: boolean) => (
    <FormRow labelKey={labelKey}>
      <Switch checked={checked ?? Boolean(store[name])} onCheckedChange={(value) => updateField(name, value)} />
    </FormRow>
  );

  const select = (name: string, labelKey: string, options: {value: string; label: React.ReactNode; keywords?: string}[], placeholder?: string) => (
    <FormRow labelKey={labelKey}>
      <SearchableSelect value={store[name] ?? ""} placeholder={placeholder} options={options} onChange={(value) => updateField(name, value)} />
    </FormRow>
  );

  const values = (items: string[]) => items.map((value) => ({value, label: value}));
  const speechOptions = (category: string) => [emptyOption(), {value: BROWSER_BUILT_IN, label: BROWSER_BUILT_IN}, ...providerOptions(byCategory(category))];
  const showClaim = store.owner === "admin" && Setting.isChatAdminUser(account) && !isAdmin && mode !== "add";

  return (
    <EditPageShell
      title={`${i18next.t(getModeTitleKey("store:Edit Store", mode))} - ${store.displayName || store.name}`}
      mode={mode}
      backTo={basePath === "/stores" ? "/stores" : `${basePath}/${store.owner}/${store.name}`}
      onSave={save}
      saving={saving}
      extraActions={showClaim ? <ConfirmButton variant="outline" title={i18next.t("store:Claim")} onConfirm={claim}>{i18next.t("store:Claim")}</ConfirmButton> : null}
    >
      <div className="space-y-8">
        <FormSection title={i18next.t("general:General Settings")} description={i18next.t("general:General Settings desc")}>
          <FormRow labelKey="general:Owner">
            {isAdmin ? (
              <SearchableSelect value={store.owner} options={userOptions(users)} onChange={(value) => updateField("owner", value)} />
            ) : (
              <Input value={store.owner} disabled />
            )}
          </FormRow>
          {store.sharedBy ? text("sharedBy", "store:Shared by", {disabled: true}) : null}
          {text("name", "general:Name", {disabled: Setting.isUserBoundToStore(account)})}
          {text("displayName", "general:Display name")}
          {text("title", "general:Title")}
          {select("state", "general:State", [
            {value: "Active", label: i18next.t("general:Active")},
            {value: "Inactive", label: i18next.t("general:Inactive")},
          ])}
          <FormRow labelKey="general:Avatar">
            <ImageUrlInput value={store.avatar} upload={uploadAvatar} onChange={(value) => updateField("avatar", value)} />
          </FormRow>
          {toggle("isDefault", "store:Is default")}
          {toggle("enableExtraOptions", "store:Enable extra options")}
        </FormSection>

        {mode !== "add" ? (
          <FormSection title={i18next.t("store:Publishing")} description={i18next.t("store:Publishing desc")}>
            <PublishingSection store={store} account={account} onPublish={publish} />
          </FormSection>
        ) : null}

        <FormSection title={i18next.t("store:Agent Profile")} description={i18next.t("store:Agent Profile desc")}>
          {text("author", "general:Author")}
          {text("affiliation", "store:Affiliation")}
          {text("tutor", "store:Tutor")}
          {select("subject", "store:Subject", [emptyOption(), ...values(SUBJECTS)])}
          {select("grade", "store:Grade", [emptyOption(), ...values(GRADES)])}
          {text("topic", "store:Topic")}
          {textarea("brief", "store:Brief", 2)}
          {textarea("description", "general:Description", 4)}
        </FormSection>

        {extra ? (
          <FormSection title={i18next.t("general:OpenAI compatible API")} description={i18next.t("general:API integration hint")}>
            <FormRow block>
              <OpenAiCompatibleConfig apiKey={store.externalApiKey} onChange={(value) => updateField("externalApiKey", value)} />
            </FormRow>
          </FormSection>
        ) : null}

        <FormSection title={i18next.t("general:Providers")} description={i18next.t("general:Providers desc")}>
          {extra ? (
            <>
              {select("storageProvider", "store:Storage provider", [emptyOption(), ...providerOptions([...byCategory("Storage"), ...casdoorStorageProviders])])}
              {select("imageProvider", "store:Image provider", [emptyOption(), ...providerOptions([...byCategory("Storage"), ...casdoorStorageProviders])])}
              {text("storageSubpath", "store:Storage subpath")}
              {select("splitProvider", "store:Split provider", values(["Default", "Basic", "QA", "Markdown"]))}
              {select("searchProvider", "store:Search provider", values(["Default", "Hierarchy"]))}
            </>
          ) : null}
          {select("modelProvider", "provider:Model provider", [emptyOption(), ...providerOptions(byCategory("Model"))])}
          {extra ? (
            <>
              {select("embeddingProvider", "store:Embedding provider", [emptyOption(), ...providerOptions(byCategory("Embedding"))])}
              {select("mcpServer", "store:MCP server", [emptyOption(), ...servers.map((server) => ({value: server.name, label: server.displayName || server.name}))])}
              <FormRow labelKey="general:Skills">
                <MultiSelect
                  value={store.skills ?? []}
                  placeholder={i18next.t("store:Select skills")}
                  options={[
                    {value: "All", label: i18next.t("store:All")},
                    ...skills.filter((skill) => skill.state === "Active").map((skill) => ({value: skill.name, label: skill.displayName ? `${skill.displayName} (${skill.name})` : skill.name})),
                  ]}
                  onChange={(value) => updateField("skills", value)}
                />
              </FormRow>
              <FormRow labelKey="general:Tools">
                <MultiSelect
                  value={store.tools ?? []}
                  placeholder={i18next.t("store:Select tools")}
                  options={[
                    {value: "All", label: i18next.t("store:All")},
                    ...tools.map((tool) => ({value: tool.name, label: <ProviderTypeLabel category="Tool" type={tool.type} text={tool.name} />, keywords: tool.name})),
                  ]}
                  onChange={(value) => updateField("tools", value)}
                />
              </FormRow>
            </>
          ) : null}
          {select("textToSpeechProvider", "store:Text-to-Speech provider", speechOptions("Text-to-Speech"))}
          {extra ? (
            <>
              {select("speechToTextProvider", "store:Speech-to-Text provider", speechOptions("Speech-to-Text"))}
              {toggle("enableTtsStreaming", "store:Enable TTS streaming")}
            </>
          ) : null}
        </FormSection>

        <FormSection title={i18next.t("general:Chat")} description={i18next.t("general:Chat desc")}>
          {text("welcome", "store:Welcome")}
          {text("welcomeTitle", "store:Welcome title")}
          {text("welcomeText", "store:Welcome text")}
          {textarea("prompt", "store:Prompt", 6)}
          <FormRow labelKey="store:Example questions" block>
            <EditableTable
              rows={store.exampleQuestions}
              onChange={(rows) => updateField("exampleQuestions", rows)}
              newRow={() => ({title: "Example Question", text: "What can you help me with?", image: ""})}
              columns={[
                {key: "title", title: i18next.t("general:Title"), render: (row: any, _i, update) => <Input value={row.title ?? ""} onChange={(e) => update({title: e.target.value})} />},
                {key: "text", title: i18next.t("general:Text"), render: (row: any, _i, update) => <Input value={row.text ?? ""} onChange={(e) => update({text: e.target.value})} />},
                {
                  key: "image",
                  title: i18next.t("general:Icon"),
                  render: (row: any, _i, update) => <Input value={row.image ?? ""} placeholder={i18next.t("general:Icon URL (optional)")} onChange={(e) => update({image: e.target.value})} />,
                },
              ]}
            />
          </FormRow>
        </FormSection>

        <FormSection title={i18next.t("figure:Virtual Figure")} description={i18next.t("figure:Virtual figure desc")}>
          {toggle("figureEnabled", "figure:Enable virtual figure", store.figureEnabled !== false)}
          {text("figureUrl", "figure:Virtual figure URL", {placeholder: `${Conf.StaticBaseUrl}/img/openagent-figure.png`})}
          {select("figureMode", "figure:Default mode", [
            {value: "Expanded", label: i18next.t("figure:Expanded")},
            {value: "Collapsed", label: i18next.t("figure:Collapsed")},
          ])}
        </FormSection>

        <FormSection title={i18next.t("general:Options")} description={i18next.t("general:Options desc")}>
          {number("knowledgeCount", "store:Knowledge count", {max: 100})}
          {number("suggestionCount", "store:Suggestion count", {max: 10})}
          {number("memoryLimit", "store:Memory limit")}
          {extra ? (
            <>
              {number("frequency", "store:Frequency")}
              {number("limitMinutes", "store:Limit minutes")}
              <FormRow labelKey="store:Vector stores">
                <MultiSelect creatable value={store.vectorStores ?? []} options={otherStores} onChange={(value) => updateField("vectorStores", value)} />
              </FormRow>
              <FormRow labelKey="store:Child stores">
                <MultiSelect creatable value={store.childStores ?? []} options={otherStores} onChange={(value) => updateField("childStores", value)} />
              </FormRow>
            </>
          ) : null}
          <FormRow labelKey="store:Child model providers">
            <MultiSelect creatable value={store.childModelProviders ?? []} options={providerOptions(byCategory("Model"))} onChange={(value) => updateField("childModelProviders", value)} />
          </FormRow>
          <FormRow labelKey="store:Forbidden words">
            <TagsInput value={store.forbiddenWords ?? []} onChange={(value) => updateField("forbiddenWords", value)} />
          </FormRow>
          {toggle("showAutoRead", "store:Show auto read")}
          {toggle("disableFileUpload", "store:Disable file upload")}
          {toggle("hideThinking", "store:Hide thinking")}
          {toggle("enableExperienceReview", "store:Enable experience review")}
          {toggle("enableExperienceLibrary", "store:Enable experience library")}
          {store.enableExperienceLibrary ? (
            <>
              {number("experienceCount", "store:Experience count", {max: 20})}
              {number("experienceThreshold", "store:Experience threshold", {max: 1, step: 0.05})}
            </>
          ) : null}
        </FormSection>

        {mode !== "add" && store.fileTree ? (
          <section className="space-y-2">
            <header className="space-y-0.5">
              <h3 className="text-sm font-semibold tracking-tight">{i18next.t("store:File tree")}</h3>
              <p className="text-sm text-muted-foreground">{i18next.t("store:File tree desc")}</p>
            </header>
            <FileTree store={store} account={account} onRefresh={refreshFileTree} />
          </section>
        ) : null}
      </div>
    </EditPageShell>
  );
}

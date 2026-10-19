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
import dayjs from "dayjs";
import {BarChart3, Copy, ExternalLink, MoreHorizontal, QrCode, RefreshCw, Share2} from "lucide-react";
import {Link, useNavigate} from "react-router-dom";
import * as OrganizationUserBackend from "@/backend/OrganizationUserBackend";
import * as StoreBackend from "@/backend/StoreBackend";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Switch} from "@/components/ui/switch";
import {ConfirmButton} from "@/components/common/ConfirmButton";
import {ProviderTypeLabel} from "@/components/common/ProviderLogo";
import {useProviderMap} from "@/components/common/ProviderLogoLink";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import {UserLabel} from "@/components/common/UserLabel";
import {getChatUrl} from "@/components/store/StoreHubDrawer";
import {StoreQrCodeDialog} from "@/components/store/StoreQrCodeDialog";
import {CrudListPage} from "@/components/crud/CrudListPage";
import {boolColumn, dateColumn, textColumn} from "@/components/crud/columns";
import type {ColumnDef} from "@/components/crud/types";
import * as Conf from "@/Conf";
import {useAccount} from "@/hooks/use-account";
import {useRequestStore} from "@/hooks/use-request-store";
import * as Setting from "@/lib/setting";

const DEFAULT_PROMPT = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems.";

// the columns and actions that only matter to a site that chats; "Hide chat" drops them
const CHAT_COLUMNS = new Set(["chatCount", "messageCount", "vectorCount", "modelProvider"]);

export function newStore(owner: string) {
  const randomName = Setting.getRandomName();
  return {
    owner,
    name: `store_${randomName}`,
    displayName: `New Store - ${randomName}`,
    createdTime: dayjs().format(),
    title: `Title - ${randomName}`,
    avatar: Setting.getDefaultAiAvatar(),
    htmlTitle: "",
    faviconUrl: "",
    logoUrl: "",
    footerHtml: "",
    storageProvider: "provider-storage-built-in",
    storageSubpath: `store_${randomName}`,
    imageProvider: "",
    splitProvider: "Default",
    searchProvider: "Default",
    modelProvider: "",
    embeddingProvider: "",
    textToSpeechProvider: "Browser Built-In",
    speechToTextProvider: "Browser Built-In",
    mcpServer: "",
    memoryLimit: 5,
    frequency: 10000,
    limitMinutes: 10,
    welcome: "Hello",
    welcomeTitle: i18next.t("chat:Hello, I'm OpenAgent AI Assistant"),
    welcomeText: i18next.t("chat:I'm here to help answer your questions"),
    figureEnabled: true,
    figureUrl: "",
    figureMode: "Expanded",
    prompt: DEFAULT_PROMPT,
    themeColor: Conf.ThemeDefault.colorPrimary,
    propertiesMap: {},
    knowledgeCount: 5,
    suggestionCount: 3,
    skills: ["All"],
    tools: ["All"],
    isDefault: false,
    state: "Active",
    enableExperienceReview: false,
    enableExtraOptions: false,
  };
}

export const PUBLISH_STATES: Record<string, {labelKey: string; variant: "secondary" | "outline" | "success" | "destructive"}> = {
  "": {labelKey: "store:Private", variant: "secondary"},
  "Pending": {labelKey: "store:Pending Review", variant: "outline"},
  "Published": {labelKey: "store:Published", variant: "success"},
  "Rejected": {labelKey: "store:Rejected", variant: "destructive"},
};

export function PublishStateBadge({state}: {state?: string}) {
  const item = PUBLISH_STATES[state || ""] ?? PUBLISH_STATES[""];
  return <Badge variant={item.variant}>{i18next.t(item.labelKey)}</Badge>;
}

/** The organization's users, for picking a store's owner or whom to share it with. */
export function useOrganizationUsers(enabled: boolean) {
  const [users, setUsers] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    OrganizationUserBackend.getOrganizationUsers().then((res: any) => {
      if (res.status === "ok") {
        setUsers(res.data ?? []);
      } else {
        Setting.showMessage("error", res.msg || i18next.t("general:Failed to load"));
      }
    }).catch((error: any) => Setting.showMessage("error", `${i18next.t("general:Failed to load")}: ${error}`));
  }, [enabled]);
  return users;
}

export function userOptions(users: any[]) {
  return users.map((user) => {
    const displayName = user.displayName || user.name;
    return {
      value: user.name,
      keywords: `${user.name} ${user.displayName ?? ""}`,
      label: (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-[10px]">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{displayName} ({user.name})</span>
        </span>
      ),
    };
  });
}

function ShareStoreDialog({store, onOpenChange, onShared}: {store: any; onOpenChange: (open: boolean) => void; onShared: () => void}) {
  const users = useOrganizationUsers(store !== null);
  const [target, setTarget] = React.useState("");

  React.useEffect(() => setTarget(""), [store]);

  const share = async() => {
    const res: any = await StoreBackend.addSharedStore(store.owner, store.name, target);
    if (res.status === "ok") {
      Setting.showMessage("success", i18next.t("store:Store shared successfully"));
      window.dispatchEvent(new Event("storesChanged"));
      onShared();
      onOpenChange(false);
    } else {
      Setting.showMessage("error", res.msg || i18next.t("general:Failed to save"));
    }
  };

  return (
    <Dialog open={store !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{i18next.t("store:Share store")}</DialogTitle>
          <DialogDescription>{store?.displayName || store?.name}</DialogDescription>
        </DialogHeader>
        <SearchableSelect
          value={target}
          placeholder={i18next.t("store:Select user to share with")}
          allowUnknownValue={false}
          options={userOptions(users.filter((user) => user?.name && user.name !== store?.owner))}
          onChange={setTarget}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{i18next.t("general:Cancel")}</Button>
          <ConfirmButton disabled={!target} title={i18next.t("store:Confirm share store")} confirmText={i18next.t("general:OK")} onConfirm={share}>
            {i18next.t("store:Share")}
          </ConfirmButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getHideChat() {
  try {
    return JSON.parse(localStorage.getItem("hideChat") ?? "false") === true;
  } catch {
    return false;
  }
}

export default function StoreListPage() {
  const navigate = useNavigate();
  const {account} = useAccount();
  const requestStore = useRequestStore();
  const providerMap = useProviderMap(account?.name);
  const [hideChat, setHideChat] = React.useState(getHideChat);
  const [shareStore, setShareStore] = React.useState<any>(null);
  const [qrCodeStore, setQrCodeStore] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState<Set<string>>(new Set());

  const isLocalAdmin = Setting.isLocalAdminUser(account);
  const isBound = Setting.isUserBoundToStore(account);

  const toggleHideChat = (value: boolean) => {
    setHideChat(value);
    localStorage.setItem("hideChat", JSON.stringify(value));
  };

  const refreshVectors = async(store: any) => {
    const key = `${store.owner}/${store.name}`;
    setRefreshing((prev) => new Set(prev).add(key));
    try {
      const res: any = await StoreBackend.refreshStoreVectors(store);
      if (res.status === "ok") {
        Setting.showMessage("success", i18next.t("general:Vectors generated successfully"));
      } else {
        Setting.showMessage("error", `${i18next.t("general:Vectors failed to generate")}: ${res.msg}`);
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Vectors failed to generate")}: ${error}`);
    } finally {
      setRefreshing((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const renderMoreMenu = (store: any) => {
    const chatUrl = `${window.location.origin}/${store.owner}/${store.name}/chat`;
    const busy = refreshing.has(`${store.owner}/${store.name}`);
    if (hideChat && !isLocalAdmin) {
      return null;
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="iconSm" aria-label={i18next.t("general:Action")}>
            {busy ? <RefreshCw className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!hideChat ? (
            <>
              <DropdownMenuItem onSelect={() => Setting.copyToClipboard(chatUrl)}>
                <Copy />
                {i18next.t("general:Copy Link")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setQrCodeStore(store)}>
                <QrCode />
                {i18next.t("store:QR Code")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  Setting.setStore(store.name);
                  window.open(chatUrl, "_blank");
                }}
              >
                <ExternalLink />
                {i18next.t("store:Open Chat")}
              </DropdownMenuItem>
            </>
          ) : null}
          {isLocalAdmin ? (
            <DropdownMenuItem onSelect={() => setShareStore(store)}>
              <Share2 />
              {i18next.t("store:Share")}
            </DropdownMenuItem>
          ) : null}
          {isLocalAdmin && !hideChat ? (
            <DropdownMenuItem disabled={busy} onSelect={() => refreshVectors(store)}>
              <RefreshCw />
              {i18next.t("general:Refresh Vectors")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const countColumn = (dataIndex: string, titleKey: string, suffix: string): ColumnDef<any> => ({
    dataIndex,
    title: i18next.t(titleKey),
    width: 120,
    sortable: true,
    align: "right",
    render: (value, record) => (
      <Link to={`/stores/${record.owner}/${record.name}/${suffix}`} className="tabular-nums underline-offset-4 hover:underline">{value ?? 0}</Link>
    ),
  });

  const allColumns: ColumnDef<any>[] = [
    {
      dataIndex: "owner",
      title: i18next.t("general:Owner"),
      width: 130,
      sortable: true,
      searchable: true,
      render: (value) => <UserLabel user={value} />,
    },
    {
      dataIndex: "name",
      title: i18next.t("general:Name"),
      width: 200,
      sortable: true,
      searchable: true,
      render: (value, record) => (
        <Link to={`/stores/${record.owner}/${value}`} className="font-medium underline-offset-4 hover:underline">{value}</Link>
      ),
    },
    textColumn({dataIndex: "displayName", title: i18next.t("general:Display name"), width: 200, searchable: true}),
    {
      dataIndex: "avatar",
      title: i18next.t("general:Avatar"),
      width: 72,
      align: "center",
      render: (_value, record) => <img src={Setting.getStoreIconUrl(record)} alt="" className="mx-auto h-10 w-10 rounded-full object-cover" />,
    },
    boolColumn({dataIndex: "isDefault", title: i18next.t("store:Is default")}),
    countColumn("chatCount", "store:Chat count", "chats"),
    countColumn("messageCount", "chat:Message count", "messages"),
    countColumn("vectorCount", "store:Vector count", "vectors"),
    {
      dataIndex: "modelProvider",
      title: i18next.t("provider:Model provider"),
      width: 240,
      sortable: true,
      searchable: true,
      render: (value) => {
        const provider = providerMap[value];
        if (!value) {
          return null;
        }
        return (
          <Link to={`/providers/${value}`} className="underline-offset-4 hover:underline">
            {provider ? <ProviderTypeLabel category={provider.category} type={provider.type} text={provider.name} /> : value}
          </Link>
        );
      },
    },
    {
      dataIndex: "state",
      title: i18next.t("general:State"),
      width: 100,
      sortable: true,
      render: (value) => <Badge variant={value === "Active" ? "success" : "secondary"}>{i18next.t(value === "Active" ? "general:Active" : "general:Inactive")}</Badge>,
    },
    {
      dataIndex: "publishState",
      title: i18next.t("store:Publish State"),
      width: 140,
      sortable: true,
      render: (value) => <PublishStateBadge state={value} />,
    },
    // not a column of the antd list, so it starts in the column menu
    {...dateColumn(), defaultHidden: true},
  ];
  const columns = allColumns.filter((column) => !(hideChat && CHAT_COLUMNS.has(column.dataIndex)));

  return (
    <>
      <CrudListPage
        title={i18next.t("general:Stores")}
        columns={columns}
        deps={[requestStore]}
        fetch={(q) => StoreBackend.getGlobalStores(requestStore, q.page, q.pageSize, q.searchedColumn, q.searchText, q.sortField, q.sortOrder)}
        newRecord={isLocalAdmin && !isBound ? () => newStore(account?.name ?? "admin") : undefined}
        editUrl={(r) => `/stores/${r.owner}/${r.name}`}
        remove={async(r) => {
          const res = await StoreBackend.deleteStore(r);
          if (res.status === "ok") {
            window.dispatchEvent(new Event("storesChanged"));
          }
          return res;
        }}
        readOnly={!isLocalAdmin}
        deleteDisabled={(r) => r.isDefault || isBound}
        toolbar={
          <>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {i18next.t("store:Hide chat")}
              <Switch checked={hideChat} onCheckedChange={toggleHideChat} />
            </label>
            <Button variant="outline" asChild>
              <Link to="/analysis">
                <BarChart3 />
                {i18next.t("store:Analysis")}
              </Link>
            </Button>
          </>
        }
        actionColumnWidth={340}
        rowMenu={renderMoreMenu}
        rowActions={(record) => [
          {key: "files", label: i18next.t("general:Files"), onSelect: () => navigate(`/stores/${record.owner}/${record.name}/view`)},
          {key: "analysis", label: i18next.t("store:Analysis"), disabled: !record.messageCount, onSelect: () => navigate(`/analysis/${record.owner}/${record.name}`)},
        ]}
      />
      <ShareStoreDialog store={shareStore} onOpenChange={(open) => !open && setShareStore(null)} onShared={() => undefined} />
      <StoreQrCodeDialog store={qrCodeStore} url={qrCodeStore ? getChatUrl(qrCodeStore) : ""} onOpenChange={(open) => !open && setQrCodeStore(null)} />
    </>
  );
}

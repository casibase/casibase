// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
import {AlertCircle, BarChart3, Bug, Eye, FolderOpen, GitFork, LayoutGrid, MessageSquare, QrCode, Settings, ShieldCheck, Star} from "lucide-react";
import {useNavigate, useParams} from "react-router-dom";
import * as StoreBackend from "@/backend/StoreBackend";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {MessageText} from "@/components/chat/MessageText";
import {CommentArea} from "@/components/comment/CommentArea";
import {Loading} from "@/components/common/Loading";
import {UserLabel} from "@/components/common/UserLabel";
import {FileTree} from "@/components/store/FileTree";
import {StoreAvatar, getChatUrl} from "@/components/store/StoreHubDrawer";
import {InsightsSubs, type InsightsSub, StoreInsights} from "@/components/store/StoreInsights";
import {StoreIssues} from "@/components/store/StoreIssues";
import {StoreQrCodeDialog} from "@/components/store/StoreQrCodeDialog";
import {StoreSecurity} from "@/components/store/StoreSecurity";
import {useAccount} from "@/hooks/use-account";
import * as Setting from "@/lib/setting";
import {cn} from "@/lib/utils";

const ChatPage = React.lazy(() => import("@/pages/ChatPage"));
const StoreEditPage = React.lazy(() => import("@/pages/StoreEditPage"));

const Tabs = ["overview", "chat", "files", "issues", "security", "insights", "settings"] as const;
type Tab = typeof Tabs[number];

function tabUrl(owner: string, storeName: string, tab: Tab, sub?: InsightsSub) {
  const base = `/agents/${owner}/${storeName}`;
  if (tab === "insights") {
    return `${base}/insights/${sub ?? "pulse"}`;
  }
  return tab === "overview" ? base : `${base}/${tab}`;
}

const emptyFavorite = {starCount: 0, watchCount: 0, forkCount: 0, starred: false, watched: false, hasForked: false, isOwner: false};

function AgentHeader({store, favorite, starLoading, watchLoading, forking, onToggleFavorite, onFork, onStartChat}: {
  store: any;
  favorite: typeof emptyFavorite;
  starLoading: boolean;
  watchLoading: boolean;
  forking: boolean;
  onToggleFavorite: (type: "star" | "watch") => void;
  onFork: () => void;
  onStartChat: () => void;
}) {
  const isForked = Boolean(store.forkedFromOwner && store.forkedFromName);
  const forkDisabledReason = favorite.isOwner
    ? i18next.t("store:You cannot fork your own agent")
    : favorite.hasForked ? i18next.t("store:You have already forked this agent") : "";
  const count = (n: number) => (n > 0 ? ` (${n})` : "");
  const tags = [store.subject, store.grade, store.topic].filter(Boolean);
  const [qrCodeOpen, setQrCodeOpen] = React.useState(false);

  const forkButton = (
    <Button variant="outline" loading={forking} disabled={Boolean(forkDisabledReason)} onClick={onFork}>
      {forking ? null : <GitFork />}{i18next.t("store:Fork")}{count(favorite.forkCount)}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-start gap-5">
      <StoreAvatar store={store} className="h-[72px] w-[72px] shrink-0 text-3xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h1 className="flex flex-wrap items-center gap-x-2 break-words text-2xl font-semibold">
              <UserLabel user={store.owner} className="text-xl font-normal text-muted-foreground" />
              <span className="text-xl font-normal text-muted-foreground">/</span>
              <span className="min-w-0">{store.displayName || store.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {i18next.t("store:By")} {store.author ? <strong className="text-foreground">{store.author}</strong> : <UserLabel user={store.owner} className="font-medium text-foreground" />}
              </span>
              {store.affiliation ? <span className="text-xs">{store.affiliation}</span> : null}
              {tags.length > 0 || isForked ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                  {isForked ? (
                    <Badge variant="info" className="font-normal"><GitFork className="h-3 w-3" />{i18next.t("store:Forked from")} {store.forkedFromOwner}/{store.forkedFromName}</Badge>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={starLoading} onClick={() => onToggleFavorite("star")}>
              {starLoading ? null : <Star className={cn(favorite.starred && "fill-amber-400 text-amber-400")} />}
              {favorite.starred ? i18next.t("store:Starred") : i18next.t("store:Star")}{count(favorite.starCount)}
            </Button>
            <Button variant="outline" loading={watchLoading} onClick={() => onToggleFavorite("watch")}>
              {watchLoading ? null : <Eye className={cn(favorite.watched && "text-primary")} />}
              {favorite.watched ? i18next.t("store:Watching") : i18next.t("store:Watch")}{count(favorite.watchCount)}
            </Button>
            {forkDisabledReason ? (
              <Tooltip>
                {/* a disabled button fires no pointer events, so the tooltip hangs on a wrapper */}
                <TooltipTrigger asChild><span tabIndex={0}>{forkButton}</span></TooltipTrigger>
                <TooltipContent>{forkDisabledReason}</TooltipContent>
              </Tooltip>
            ) : forkButton}
            <Button variant="outline" onClick={() => setQrCodeOpen(true)}><QrCode />{i18next.t("store:QR Code")}</Button>
            <Button onClick={onStartChat}><MessageSquare />{i18next.t("store:Start Chat")}</Button>
            <StoreQrCodeDialog store={qrCodeOpen ? store : null} url={getChatUrl(store)} onOpenChange={setQrCodeOpen} />
          </div>
        </div>
        {store.brief ? <p className="mt-2 text-sm text-muted-foreground">{store.brief}</p> : null}
      </div>
    </div>
  );
}

function AboutCard({store}: {store: any}) {
  const rows: [string, React.ReactNode][] = [
    [i18next.t("general:Owner"), store.owner ? <UserLabel user={store.owner} /> : null],
    [i18next.t("store:Forked from"), store.forkedFromOwner && store.forkedFromName ? `${store.forkedFromOwner}/${store.forkedFromName}` : null],
    [i18next.t("general:Author"), store.author],
    [i18next.t("store:Affiliation"), store.affiliation],
    [i18next.t("store:Tutor"), store.tutor],
    [i18next.t("store:Subject"), store.subject],
    [i18next.t("store:Grade"), store.grade],
    [i18next.t("store:Topic"), store.topic],
  ];
  const stats: [string, number | undefined][] = [
    [i18next.t("general:Chats"), store.chatCount],
    [i18next.t("general:Messages"), store.messageCount],
    [i18next.t("general:Vectors"), store.vectorCount],
  ];
  const shownStats = stats.filter(([, value]) => value !== undefined && value !== null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{i18next.t("store:About")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {store.brief ? <p className="text-sm leading-relaxed">{store.brief}</p> : null}
        <dl className="space-y-2 text-sm">
          {rows.filter(([, value]) => value).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words text-right">{value}</dd>
            </div>
          ))}
        </dl>
        {shownStats.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {shownStats.map(([label, value]) => (
              <div key={label} className="rounded-md border px-1.5 py-2 text-center">
                <div className="font-semibold tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StoreFiles({store, account, onRefresh}: {store: any; account: any; onRefresh: () => void}) {
  if (store.fileTree) {
    return <FileTree store={store} account={account} onRefresh={onRefresh} />;
  }
  if (store.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{i18next.t("general:Failed to get")}</AlertTitle>
        <AlertDescription>{store.error}</AlertDescription>
      </Alert>
    );
  }
  return <p className="py-10 text-center text-sm text-muted-foreground">{i18next.t("general:No data")}</p>;
}

function Overview({store, account, onRefresh}: {store: any; account: any; onRefresh: () => void}) {
  const readme = store.description || store.prompt || store.welcomeText || "";
  const isExternal = Boolean(store.endpoint || store.hubDbName);
  const commentsUnavailable = isExternal || store.publishState !== "Published";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <StoreFiles store={store} account={account} onRefresh={onRefresh} />
        {readme ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><FolderOpen className="h-4 w-4" />{i18next.t("store:README")}</CardTitle>
            </CardHeader>
            <CardContent><MessageText text={readme} /></CardContent>
          </Card>
        ) : null}
        <CommentArea
          account={account}
          targetType="agenthub"
          targetKey={`${store.owner}/${store.name}`}
          targetOwner={store.owner}
          disabled={commentsUnavailable}
          unavailableText={isExternal ? i18next.t("store:Comments are unavailable for external agents") : i18next.t("store:Comments are unavailable")}
        />
      </div>
      <div><AboutCard store={store} /></div>
    </div>
  );
}

/** A published agent's page at /agents/:owner/:storeName, with its tabs in the URL. */
export default function StoreViewPage() {
  const {owner = "", storeName = "", tab: tabParam, sub: subParam, issueName} = useParams();
  const navigate = useNavigate();
  const {account} = useAccount();
  const [store, setStore] = React.useState<any>(undefined);
  const [favorite, setFavorite] = React.useState(emptyFavorite);
  const [starLoading, setStarLoading] = React.useState(false);
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [forking, setForking] = React.useState(false);

  const sub: InsightsSub = InsightsSubs.includes(subParam as InsightsSub) ? subParam as InsightsSub : "pulse";
  const tab: Tab = subParam && InsightsSubs.includes(subParam as InsightsSub)
    ? "insights"
    : issueName ? "issues" : Tabs.includes(tabParam as Tab) ? tabParam as Tab : "overview";

  // a reply for an agent left behind must not replace the one now shown
  const latestLoad = React.useRef(0);
  // the visit is logged by the backend when the store is fetched, so there is no separate call
  const loadStore = React.useCallback(() => {
    const load = ++latestLoad.current;
    StoreBackend.getStore(owner, storeName).then((res: any) => {
      if (load !== latestLoad.current) {
        return;
      }
      if (res.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        setStore(null);
        return;
      }
      const loaded = res.data;
      if (loaded && typeof res.data2 === "string" && res.data2 !== "") {
        loaded.error = res.data2;
      }
      setStore(loaded ?? null);
      if (loaded) {
        StoreBackend.getStoreFavoriteStatus(owner, storeName, loaded.hubDbName).then((status: any) => {
          if (load === latestLoad.current && status.status === "ok" && status.data) {
            setFavorite({...emptyFavorite, ...status.data});
          }
        });
      }
    });
  }, [owner, storeName]);

  React.useEffect(() => {
    setStore(undefined);
    setFavorite(emptyFavorite);
    loadStore();
  }, [loadStore]);

  if (store === undefined) {
    return <Loading className="py-24" />;
  }
  if (store === null) {
    return <p className="py-24 text-center text-sm text-muted-foreground">{i18next.t("general:No data")}</p>;
  }

  const canManage = account && (account.name === store.owner || Setting.isAdminUser(account));

  const toggleFavorite = async(type: "star" | "watch") => {
    if (!account || Setting.isAnonymousUser(account)) {
      Setting.showMessage("info", i18next.t("store:Please sign in to continue"));
      return;
    }
    const setLoading = type === "star" ? setStarLoading : setWatchLoading;
    setLoading(true);
    try {
      const res: any = await StoreBackend.toggleStoreFavorite(type, store.owner, store.name);
      if (res.status === "ok" && res.data) {
        const {favorited, count} = res.data;
        setFavorite((prev) => (type === "star" ? {...prev, starred: favorited, starCount: count} : {...prev, watched: favorited, watchCount: count}));
      } else {
        Setting.showMessage("error", res.msg);
      }
    } catch (error: any) {
      Setting.showMessage("error", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const fork = async() => {
    if (forking) {
      return;
    }
    setForking(true);
    // the spinner stays at least a moment so the fork is seen to happen
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const [res]: any[] = await Promise.all([StoreBackend.forkStore(store.owner, store.name), minDelay]);
      if (res.status === "ok") {
        Setting.showMessage("success", i18next.t("store:Forked successfully"));
        navigate(`/agents/${res.data.owner}/${res.data.name}`);
      } else {
        Setting.showMessage("error", `${i18next.t("store:Fork failed")}: ${res.msg}`);
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("store:Fork failed")}: ${error}`);
    } finally {
      setForking(false);
    }
  };

  const startChat = () => {
    if (store.endpoint) {
      window.open(getChatUrl(store), "_blank", "noopener,noreferrer");
    } else {
      navigate(`/stores/${store.owner}/${store.name}/chat`);
    }
  };

  const tabItems: {key: Tab; icon: React.ReactNode; label: string}[] = [
    {key: "overview", icon: <LayoutGrid />, label: i18next.t("store:Overview")},
    {key: "chat", icon: <MessageSquare />, label: i18next.t("general:Chat")},
    {key: "files", icon: <FolderOpen />, label: i18next.t("general:Files")},
    {key: "issues", icon: <Bug />, label: i18next.t("store:Issues")},
    {key: "security", icon: <ShieldCheck />, label: i18next.t("store:Security")},
    {key: "insights", icon: <BarChart3 />, label: i18next.t("store:Insights")},
    ...(canManage ? [{key: "settings" as Tab, icon: <Settings />, label: i18next.t("general:Settings")}] : []),
  ];

  let content: React.ReactNode;
  switch (tab) {
  case "chat":
    content = (
      <div className="h-[calc(100vh-19rem)] min-h-[480px] overflow-hidden rounded-lg border">
        <ChatPage key={store.name} embeddedStore={store.name} />
      </div>
    );
    break;
  case "files":
    content = <StoreFiles store={store} account={account} onRefresh={loadStore} />;
    break;
  case "issues":
    content = <StoreIssues account={account} store={store} activeIssueName={issueName ?? null} onIssueChange={(name) => navigate(name ? `/agents/${store.owner}/${store.name}/issues/${name}` : `/agents/${store.owner}/${store.name}/issues`)} />;
    break;
  case "security":
    content = <StoreSecurity account={account} owner={store.owner} storeName={store.name} />;
    break;
  case "insights":
    content = <StoreInsights account={account} owner={store.owner} storeName={store.name} activeSub={sub} onSubTabChange={(next) => navigate(tabUrl(store.owner, store.name, "insights", next))} />;
    break;
  case "settings":
    // the settings bar pulls itself up over the page padding; this gives it room under the tabs
    content = canManage ? <div className="pt-4 md:pt-6"><StoreEditPage basePath="/agents" /></div> : null;
    break;
  default:
    content = <Overview store={store} account={account} onRefresh={loadStore} />;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <AgentHeader
        store={store}
        favorite={favorite}
        starLoading={starLoading}
        watchLoading={watchLoading}
        forking={forking}
        onToggleFavorite={toggleFavorite}
        onFork={fork}
        onStartChat={startChat}
      />
      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1">
        {tabItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(tabUrl(store.owner, store.name, item.key))}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors [&_svg]:h-4 [&_svg]:w-4",
              tab === item.key ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <React.Suspense fallback={<Loading />}>{content}</React.Suspense>
    </div>
  );
}

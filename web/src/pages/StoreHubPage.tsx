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
import {ArrowDownWideNarrow, ArrowUpNarrowWide, Bot, Copy, Eye, GitFork, Info, Link2, MessageSquare, MessagesSquare, QrCode, Search, Star} from "lucide-react";
import {useNavigate} from "react-router-dom";
import * as StoreBackend from "@/backend/StoreBackend";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Loading} from "@/components/common/Loading";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import {StoreAuthor, StoreAvatar, StoreHubDrawer, StoreTags, getChatUrl} from "@/components/store/StoreHubDrawer";
import {StoreQrCodeDialog} from "@/components/store/StoreQrCodeDialog";
import {useAccount} from "@/hooks/use-account";
import {useSite} from "@/hooks/use-site";
import * as Setting from "@/lib/setting";

type View = "all" | "star" | "watch";
const NUMERIC_SORTS = ["starCount", "watchCount", "forkCount"];
const DEFAULT_SORT = "starCount";

function sortValue(store: any, field: string) {
  if (field === "displayName") {
    return (store.displayName || store.name || "").toLowerCase();
  }
  if (field === "author") {
    return (store.author || store.owner || "").toLowerCase();
  }
  return (store[field] || "").toLowerCase();
}

function Stat({icon: Icon, labelKey, value}: {icon: React.ElementType; labelKey: string; value: number}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 tabular-nums"><Icon className="h-3.5 w-3.5" />{value || 0}</span>
      </TooltipTrigger>
      <TooltipContent>{i18next.t(labelKey)}</TooltipContent>
    </Tooltip>
  );
}

/** The published agents of this site and the hubs it is linked to, to browse and start chatting with. */
export default function StoreHubPage() {
  const navigate = useNavigate();
  const {account} = useAccount();
  const {site} = useSite();
  const [stores, setStores] = React.useState<any[] | null>(null);
  const [view, setView] = React.useState<View>("all");
  const [favored, setFavored] = React.useState<any[] | null>(null);
  const [selected, setSelected] = React.useState<any>(null);
  const [qrCodeStore, setQrCodeStore] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({subject: "", grade: "", topic: ""});
  const [sortField, setSortField] = React.useState(DEFAULT_SORT);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const signedIn = Boolean(account) && !Setting.isAnonymousUser(account);

  React.useEffect(() => {
    StoreBackend.getHubStores().then((res: any) => {
      if (res.status === "ok") {
        setStores(res.data ?? []);
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        setStores([]);
      }
    }).catch(() => setStores([]));
  }, []);

  React.useEffect(() => {
    if (view === "all") {
      return;
    }
    setFavored(null);
    StoreBackend.getFavoredStores(view).then((res: any) => {
      if (res.status === "ok") {
        setFavored(res.data ?? []);
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        setFavored([]);
      }
    }).catch(() => setFavored([]));
  }, [view]);

  const active = React.useMemo(() => (view === "all" ? stores : favored) ?? [], [view, stores, favored]);
  const values = (field: string) => [...new Set(active.map((store) => store[field]).filter(Boolean))].sort() as string[];

  const shown = React.useMemo(() => {
    const q = search.toLowerCase();
    const result = active.filter((store) =>
      (!q || [store.displayName || store.name, store.author || store.owner, store.affiliation].some((text) => (text || "").toLowerCase().includes(q))) &&
      (!filters.subject || store.subject === filters.subject) &&
      (!filters.grade || store.grade === filters.grade) &&
      (!filters.topic || store.topic === filters.topic));
    const sign = sortOrder === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      if (NUMERIC_SORTS.includes(sortField)) {
        return sign * ((a[sortField] || 0) - (b[sortField] || 0));
      }
      return sign * sortValue(a, sortField).localeCompare(sortValue(b, sortField));
    });
  }, [active, search, filters, sortField, sortOrder]);

  // the default "most starred" order is not a filter worth resetting
  const filtered = Boolean(search || filters.subject || filters.grade || filters.topic) || sortField !== DEFAULT_SORT || sortOrder !== "desc";

  const reset = () => {
    setSearch("");
    setFilters({subject: "", grade: "", topic: ""});
    setSortField(DEFAULT_SORT);
    setSortOrder("desc");
  };

  // an agent from a linked hub lives on that hub's site
  const startChat = (store: any) => {
    if (store.endpoint) {
      window.open(getChatUrl(store), "_blank", "noopener,noreferrer");
    } else {
      navigate(`/stores/${store.owner}/${store.name}/chat`);
    }
  };

  const viewAgent = (store: any) => {
    const path = `/agents/${store.owner}/${store.name}`;
    if (store.endpoint) {
      window.open(`${store.endpoint}${path}`, "_blank", "noopener,noreferrer");
    } else {
      navigate(path);
    }
  };

  const filterSelect = (field: "subject" | "grade" | "topic", labelKey: string) => {
    const options = values(field);
    if (options.length === 0) {
      return null;
    }
    const all = `${i18next.t(labelKey)}: ${i18next.t("store:All")}`;
    return (
      <div className="w-44">
        <SearchableSelect
          value={filters[field]}
          allowUnknownValue={false}
          options={[{value: "", label: all}, ...options.map((value) => ({value, label: value}))]}
          onChange={(value) => setFilters((prev) => ({...prev, [field]: value}))}
        />
      </div>
    );
  };

  const emptyText = view === "star" ? "store:No starred agents yet" : view === "watch" ? "store:No watched agents yet" : "general:No published agents yet";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{i18next.t("general:Hub")}</h1>
        <p className="text-muted-foreground">{site?.hubDesc || i18next.t("general:Hub desc")}</p>
      </div>

      {stores === null ? <Loading /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {signedIn ? (
              <Tabs value={view} onValueChange={(value) => setView(value as View)}>
                <TabsList>
                  <TabsTrigger value="all">{i18next.t("store:All agents")}</TabsTrigger>
                  <TabsTrigger value="star">{i18next.t("store:Starred")}</TabsTrigger>
                  <TabsTrigger value="watch">{i18next.t("store:Watching")}</TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder={i18next.t("store:Please search here")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {filterSelect("subject", "store:Subject")}
            {filterSelect("grade", "store:Grade")}
            {filterSelect("topic", "store:Topic")}
            <div className="w-40">
              <SearchableSelect
                value={sortField}
                allowUnknownValue={false}
                options={[
                  {value: "starCount", label: i18next.t("store:Stars")},
                  {value: "watchCount", label: i18next.t("store:Watchers")},
                  {value: "forkCount", label: i18next.t("store:Forks")},
                  {value: "displayName", label: i18next.t("general:Display name")},
                  {value: "author", label: i18next.t("general:Author")},
                  {value: "affiliation", label: i18next.t("store:Affiliation")},
                  {value: "subject", label: i18next.t("store:Subject")},
                  {value: "grade", label: i18next.t("store:Grade")},
                  {value: "topic", label: i18next.t("store:Topic")},
                ]}
                onChange={setSortField}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{i18next.t(sortOrder === "asc" ? "general:Click to sort descending" : "general:Click to sort ascending")}</TooltipContent>
            </Tooltip>
            {filtered ? <Button variant="ghost" onClick={reset}>{i18next.t("general:Reset")}</Button> : null}
            <span className="text-sm text-muted-foreground">
              {filtered ? `${shown.length} / ${active.length}` : active.length} {i18next.t("general:Agents")}
            </span>
          </div>

          {view !== "all" && favored === null ? <Loading /> : active.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{i18next.t(emptyText)}</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{i18next.t("general:No data")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {shown.map((store) => {
                const chatUrl = getChatUrl(store);
                const description = store.brief || store.welcomeText || store.prompt || "";
                return (
                  <Card
                    key={`${store.owner}/${store.name}/${store.hubDbName ?? ""}`}
                    role="link"
                    tabIndex={0}
                    className="flex cursor-pointer flex-col gap-3 p-5 transition-shadow hover:shadow-md"
                    onClick={() => viewAgent(store)}
                    onKeyDown={(e) => e.key === "Enter" && viewAgent(store)}
                  >
                    <div className="flex items-start gap-3">
                      <StoreAvatar store={store} className="h-[52px] w-[52px] text-lg" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1 truncate font-semibold">{store.displayName || store.name}</div>
                          {store.hubDbName ? (
                            <Tooltip>
                              <TooltipTrigger asChild><Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[11px]">{i18next.t("store:External")}</Badge></TooltipTrigger>
                              <TooltipContent>{i18next.t("store:External store from")}: {store.hubDbName}</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}><StoreAuthor store={store} /></div>
                        {store.affiliation ? <div className="truncate text-[11px] text-muted-foreground">{store.affiliation}</div> : null}
                        <div className="pt-1"><StoreTags store={store} /></div>
                      </div>
                    </div>
                    <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">{description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <Stat icon={Star} labelKey="store:Stars" value={store.starCount} />
                        <Stat icon={Eye} labelKey="store:Watchers" value={store.watchCount} />
                        <Stat icon={GitFork} labelKey="store:Forks" value={store.forkCount} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Stat icon={MessagesSquare} labelKey="general:Chats" value={store.chatCount} />
                        <Stat icon={MessageSquare} labelKey="general:Messages" value={store.messageCount} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1" onClick={(e) => e.stopPropagation()}>
                      <Link2 className="h-3 w-3 shrink-0 text-primary" />
                      <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[11px] underline-offset-4 hover:underline">{chatUrl}</a>
                      <Button variant="ghost" size="iconSm" className="h-5 w-5" aria-label={i18next.t("general:Copy")} onClick={() => Setting.copyToClipboard(chatUrl)}>
                        <Copy className="!h-3 !w-3" />
                      </Button>
                      <Button variant="ghost" size="iconSm" className="h-5 w-5" aria-label={i18next.t("store:QR Code")} onClick={() => setQrCodeStore(store)}>
                        <QrCode className="!h-3 !w-3" />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(store);
                        }}
                      >
                        <Info className="h-4 w-4" />{i18next.t("store:View Details")}
                      </button>
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Bot className="h-4 w-4" />{i18next.t("store:Enter Agent")}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <StoreHubDrawer
        store={selected}
        onClose={() => setSelected(null)}
        onStartChat={(store) => {
          setSelected(null);
          startChat(store);
        }}
        onViewAgent={(store) => {
          setSelected(null);
          viewAgent(store);
        }}
      />
      <StoreQrCodeDialog store={qrCodeStore} url={qrCodeStore ? getChatUrl(qrCodeStore) : ""} onOpenChange={(open) => !open && setQrCodeStore(null)} />
    </div>
  );
}

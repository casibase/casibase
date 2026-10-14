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
import {useLocation} from "react-router-dom";
import * as StoreBackend from "@/backend/StoreBackend";
import {SearchableSelect} from "@/components/common/SearchableSelect";
import * as Setting from "@/lib/setting";

/** The pages whose lists follow the picked store; elsewhere the picker is shown but locked. */
const ScopedPrefixes = ["/stores", "/providers", "/vectors", "/chats", "/messages", "/usages", "/files"];

function isScopedPath(pathname: string) {
  return pathname.includes("/chat") || pathname === "/" || pathname === "/home" || ScopedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function StoreLabel({store}: {store: any}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={Setting.getStoreIconUrl(store)} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />
      <span className="truncate">{store.displayName || store.name}</span>
    </span>
  );
}

/** The header's store picker, for local admins: which store the scoped lists show. */
export function StoreSelect({account}: {account: any}) {
  const location = useLocation();
  const [stores, setStores] = React.useState<any[] | null>(null);
  const [value, setValue] = React.useState(Setting.getStore());

  const change = React.useCallback((next: string) => {
    setValue(next);
    Setting.setStore(next);
  }, []);

  React.useEffect(() => {
    const load = () => {
      StoreBackend.getStoreNames("admin").then((res: any) => {
        if (res.status !== "ok") {
          return;
        }
        // a nameless store row can't be picked, and would match an empty homepage
        const list = (res.data ?? []).filter((store: any) => store.name);
        setStores(list);
        // a saved choice, even "All", is the user's and is never overridden;
        // the first visit starts on the store bound to the user, else the first one
        // ("" was saved by an older picker that bound everyone to a nameless store)
        const saved = localStorage.getItem("store");
        if (saved !== null && saved !== "") {
          setValue(saved);
        } else {
          const bound = account?.homepage ? list.find((store: any) => store.name === account.homepage) : undefined;
          change(bound ? bound.name : (list[0]?.name ?? ""));
        }
      }).catch(() => undefined);
    };
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "store") {
        setValue(Setting.getStore());
      }
    };
    // a page can pick the store too, e.g. a chat opened at /admin/:storeName/chat
    const onStoreChanged = () => setValue(Setting.getStore());
    window.addEventListener("storesChanged", load);
    window.addEventListener("storage", onStorage);
    window.addEventListener("storeChanged", onStoreChanged);
    return () => {
      window.removeEventListener("storesChanged", load);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storeChanged", onStoreChanged);
    };
  }, [account?.homepage, change]);

  if (stores === null) {
    return <div className="hidden h-9 w-48 md:block" />;
  }

  // a user whose homepage names a store is pinned to it
  const isBound = !!account?.homepage && stores.some((store) => store.name === account.homepage);
  const options = [
    {value: "All", label: i18next.t("store:All"), keywords: i18next.t("store:All")},
    ...stores.map((store) => ({value: store.name, label: <StoreLabel store={store} />, keywords: `${store.displayName ?? ""} ${store.name}`})),
  ];

  return (
    <SearchableSelect
      className="hidden w-48 md:flex"
      value={value}
      onChange={change}
      options={options}
      disabled={isBound || !isScopedPath(location.pathname)}
    />
  );
}

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
import {
  Cable,
  Clapperboard,
  Database,
  Lock,
  MessageSquare,
  Rocket,
  ScrollText,
  Settings,
  Store,
  type LucideIcon,
} from "lucide-react";
import * as Setting from "@/lib/setting";
import type {Account} from "@/hooks/use-account";

export interface NavItem {
  key: string;
  label: string;
  /** rendered as an external link instead of a router link */
  href?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  /** where the group header itself navigates to */
  to: string;
  items: NavItem[];
}

const MaxItemsForFlatMenu = 7;

/** The console navigation, mirroring the antd ManagementPage menu. */
export function getNavGroups(account: Account | null | undefined, site?: any, forms: any[] = []): NavGroup[] {
  if (!account) {
    return [];
  }

  if (Setting.isTaskUser(account)) {
    const items: NavItem[] = [{key: "/tasks", label: i18next.t("general:Tasks")}];
    if (Setting.isAdminUser(account)) {
      items.push({key: "/scales", label: i18next.t("general:Scales")});
    }
    // task users reach each form's data straight from the menu, in the forms' own order
    [...forms].sort((a, b) => String(a.position ?? "").localeCompare(String(b.position ?? ""))).forEach((form) => {
      items.push({key: `/forms/${form.name}/data`, label: form.displayName || form.name});
    });
    return [{key: "/multimedia", label: i18next.t("general:Tasks"), icon: Clapperboard, to: "/tasks", items}];
  }

  const groups: NavGroup[] = [];

  groups.push({
    key: "/chat-group",
    label: i18next.t("general:Chat"),
    icon: MessageSquare,
    to: "/chat",
    items: [{key: "/chat", label: i18next.t("general:Chat")}],
  });

  // plain users only get the chat
  if (!Setting.isAdminUser(account) && !Setting.isChatAdminUser(account)) {
    return groups;
  }

  groups.push({
    key: "/start",
    label: i18next.t("general:Quick Setup"),
    icon: Rocket,
    to: "/quick-setup",
    items: [
      {key: "/quick-setup", label: i18next.t("general:Quick Setup")},
      {key: "/hub", label: i18next.t("general:Hub")},
    ],
  });

  groups.push({
    key: "/basic",
    label: i18next.t("general:Basic"),
    icon: Store,
    to: "/stores",
    items: [
      {key: "/stores", label: i18next.t("general:Stores")},
      {key: "/chats", label: i18next.t("general:Chats")},
      {key: "/messages", label: i18next.t("general:Messages")},
    ],
  });

  groups.push({
    key: "/knowledge-base",
    label: i18next.t("general:Knowledge Base"),
    icon: Database,
    to: "/files",
    items: [
      {key: "/files", label: i18next.t("general:Files")},
      {key: "/vectors", label: i18next.t("general:Vectors")},
      {key: "/experiences", label: i18next.t("general:Experiences")},
    ],
  });

  groups.push({
    key: "/connectors",
    label: i18next.t("general:Connectors"),
    icon: Cable,
    to: "/providers",
    items: [
      {key: "/providers", label: i18next.t("general:Providers")},
      {key: "/pipes", label: i18next.t("general:Pipes")},
      {key: "/skills", label: i18next.t("general:Skills")},
      {key: "/tools", label: i18next.t("general:Tools")},
      {key: "/tool-policies", label: i18next.t("toolPolicy:Tool Permissions")},
      {key: "/servers", label: i18next.t("general:MCP Servers")},
    ],
  });

  groups.push({
    key: "/multimedia",
    label: i18next.t("general:Multimedia"),
    icon: Clapperboard,
    to: "/tasks",
    items: [
      {key: "/tasks", label: i18next.t("general:Tasks")},
      {key: "/scales", label: i18next.t("general:Scales")},
      {key: "/forms", label: i18next.t("general:Forms")},
    ],
  });

  groups.push({
    key: "/logs",
    label: i18next.t("general:Auditing Logs"),
    icon: ScrollText,
    to: Setting.isAdminUser(account) ? "/records" : "/notifications",
    items: Setting.isAdminUser(account) ? [
      {key: "/records", label: i18next.t("general:Logs")},
      {key: "/notifications", label: i18next.t("general:Notifications")},
      {key: "/sessions", label: i18next.t("general:Sessions")},
      {key: "/snapshots", label: i18next.t("general:Snapshots")},
    ] : [
      {key: "/notifications", label: i18next.t("general:Notifications")},
    ],
  });

  // users, resources and permissions live in Casdoor; built-in login has no Casdoor to link to
  const profileUrl = Setting.getMyProfileUrl(account);
  if (!Setting.isBasicLoginMode(account) && profileUrl) {
    groups.push({
      key: "/identity",
      label: i18next.t("general:Identity"),
      icon: Lock,
      to: "/identity",
      items: [
        {key: "/users", label: i18next.t("general:Users"), href: profileUrl.replace("/account", "/users")},
        {key: "/casdoor-resources", label: i18next.t("general:Casdoor Resources"), href: profileUrl.replace("/account", "/resources")},
        {key: "/permissions", label: i18next.t("general:Permissions"), href: profileUrl.replace("/account", "/permissions")},
        ...(Setting.isLocalAdminUser(account) ? [{key: "/student-accounts", label: i18next.t("account:Student Accounts")}] : []),
      ],
    });
  }

  if (Setting.isAdminUser(account) && !Setting.isChatAdminUser(account)) {
    groups.push({
      key: "/admin",
      label: i18next.t("general:Admin"),
      icon: Settings,
      to: "/sites/site-built-in",
      items: [
        {key: "/sites", label: i18next.t("general:Sites")},
        {key: "/comments", label: i18next.t("general:Comments")},
        {key: "/resources", label: i18next.t("general:Resources")},
        {key: "/usages", label: i18next.t("general:Usages")},
        {key: "/visitors", label: i18next.t("general:Visitors")},
        {key: "/sysinfo", label: i18next.t("general:System Info")},
        {key: "/migration", label: i18next.t("general:Migration")},
        {key: "/swagger", label: i18next.t("general:Swagger"), href: "/swagger/index.html"},
      ],
    });
  }

  return applyNavItems(groups, site);
}

/**
 * The built-in site can hide menu entries through `navItems`; absent, empty or
 * containing "all" means "show everything".
 */
function getNavItemFilter(site: any): string[] | null {
  const navItems = site?.navItems;
  if (!Array.isArray(navItems) || navItems.length === 0 || navItems.includes("all")) {
    return null;
  }
  return navItems;
}

function applyNavItems(groups: NavGroup[], site: any): NavGroup[] {
  const navItems = getNavItemFilter(site);
  if (navItems === null) {
    return groups;
  }

  return groups
    .map((group) => ({...group, items: group.items.filter((item) => navItems.includes(item.key))}))
    .filter((group) => group.items.length > 0)
    .map((group) => {
      if (group.items.some((item) => item.key === group.to && !item.href)) {
        return group;
      }
      const target = group.items.find((item) => !item.href);
      return target ? {...group, to: target.key} : group;
    });
}

/** With only a handful of entries left, show one flat list instead of groups. */
export function shouldFlattenNav(groups: NavGroup[]): boolean {
  return groups.reduce((count, group) => count + group.items.length, 0) <= MaxItemsForFlatMenu;
}

export function isWidgetVisible(_account: Account | null | undefined, _key: string): boolean {
  return true;
}


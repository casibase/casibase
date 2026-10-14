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
import {ChevronRight} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {cn} from "@/lib/utils";

interface NavNode {
  key: string;
  title: string;
  /** the entry needs Casdoor, which this instance may not have */
  casdoor?: boolean;
  /** always on: the Sites page is where the menu is configured, so it cannot be hidden */
  locked?: boolean;
  children?: NavNode[];
}

export const IdentityNavKeys = ["/identity", "/users", "/casdoor-resources", "/permissions", "/student-accounts"];

function getNavTree(): NavNode {
  const leaf = (key: string, title: string, extra?: Partial<NavNode>): NavNode => ({key, title, ...extra});
  return {
    key: "all",
    title: i18next.t("store:All"),
    children: [
      leaf("/chat", i18next.t("general:Chat")),
      leaf("/quick-setup", i18next.t("general:Quick Setup")),
      leaf("/hub", i18next.t("general:Hub")),
      {key: "/basic", title: i18next.t("general:Basic"), children: [
        leaf("/stores", i18next.t("general:Stores")),
        leaf("/chats", i18next.t("general:Chats")),
        leaf("/messages", i18next.t("general:Messages")),
      ]},
      {key: "/knowledge-base", title: i18next.t("general:Knowledge Base"), children: [
        leaf("/files", i18next.t("general:Files")),
        leaf("/vectors", i18next.t("general:Vectors")),
        leaf("/experiences", i18next.t("general:Experiences")),
      ]},
      {key: "/connectors", title: i18next.t("general:Connectors"), children: [
        leaf("/providers", i18next.t("general:Providers")),
        leaf("/pipes", i18next.t("general:Pipes")),
        leaf("/skills", i18next.t("general:Skills")),
        leaf("/tools", i18next.t("general:Tools")),
        leaf("/tool-policies", i18next.t("toolPolicy:Tool Permissions")),
        leaf("/servers", i18next.t("general:MCP Servers")),
      ]},
      {key: "/multimedia", title: i18next.t("general:Multimedia"), children: [
        leaf("/tasks", i18next.t("general:Tasks")),
        leaf("/scales", i18next.t("general:Scales")),
        leaf("/forms", i18next.t("general:Forms")),
      ]},
      {key: "/logs", title: i18next.t("general:Auditing Logs"), children: [
        leaf("/records", i18next.t("general:Logs")),
        leaf("/sessions", i18next.t("general:Sessions")),
        leaf("/snapshots", i18next.t("general:Snapshots")),
      ]},
      {key: "/identity", title: i18next.t("general:Identity"), casdoor: true, children: [
        leaf("/users", i18next.t("general:Users"), {casdoor: true}),
        leaf("/casdoor-resources", i18next.t("general:Resources"), {casdoor: true}),
        leaf("/permissions", i18next.t("general:Permissions"), {casdoor: true}),
        leaf("/student-accounts", i18next.t("account:Student Accounts"), {casdoor: true}),
      ]},
      {key: "/admin", title: i18next.t("general:Admin"), children: [
        leaf("/sites", i18next.t("general:Sites"), {locked: true}),
        leaf("/comments", i18next.t("general:Comments")),
        leaf("/resources", i18next.t("general:Resources")),
        leaf("/usages", i18next.t("general:Usages")),
        leaf("/visitors", i18next.t("general:Visitors")),
        leaf("/sysinfo", i18next.t("general:System Info")),
        leaf("/migration", i18next.t("general:Migration")),
        leaf("/swagger", i18next.t("general:Swagger")),
      ]},
    ],
  };
}

/** The leaves a click on this node toggles; the locked Sites entry is not one of them. */
function getLeaves(node: NavNode): NavNode[] {
  if (!node.children) {
    return node.locked ? [] : [node];
  }
  return node.children.flatMap(getLeaves);
}

/**
 * The leaves the saved keys switch on. A saved group or "all" switches on
 * everything under it, which is how the antd tree read the same list.
 */
function getCheckedLeaves(root: NavNode, keys: string[]): Set<string> {
  const saved = new Set(keys);
  const result = new Set<string>();
  const visit = (node: NavNode, inherited: boolean) => {
    const on = inherited || saved.has(node.key);
    if (!node.children) {
      if (node.locked ? saved.has(node.key) : on) {
        result.add(node.key);
      }
      return;
    }
    node.children.forEach((child) => visit(child, on));
  };
  visit(root, false);
  return result;
}

/** Turns checked leaves back into the saved list: every fully checked group, and the leaves. */
function toKeys(root: NavNode, leaves: Set<string>): string[] {
  const keys: string[] = [];
  const visit = (node: NavNode) => {
    if (!node.children) {
      if (leaves.has(node.key)) {
        keys.push(node.key);
      }
      return;
    }
    const nodeLeaves = getLeaves(node);
    if (nodeLeaves.length > 0 && nodeLeaves.every((leaf) => leaves.has(leaf.key))) {
      keys.push(node.key);
    }
    node.children.forEach(visit);
  };
  visit(root);
  return keys;
}

interface NavItemTreeProps {
  value: string[] | undefined | null;
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  casdoorAvailable: boolean;
  /** asked before an Identity entry is switched on; return false to refuse */
  onEnableIdentity?: () => boolean;
}

/** Which console menu entries the site shows, as a checkbox tree. */
export function NavItemTree({value, onChange, disabled, casdoorAvailable, onEnableIdentity}: NavItemTreeProps) {
  const root = React.useMemo(getNavTree, []);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["all"]));
  const checked = getCheckedLeaves(root, value ?? ["all"]);

  const toggle = (node: NavNode, on: boolean) => {
    const leaves = getLeaves(node);
    if (on && leaves.some((leaf) => IdentityNavKeys.includes(leaf.key) && !checked.has(leaf.key)) && onEnableIdentity?.() === false) {
      return;
    }
    const next = new Set(checked);
    leaves.forEach((leaf) => (on ? next.add(leaf.key) : next.delete(leaf.key)));
    onChange(toKeys(root, next));
  };

  const renderNode = (node: NavNode, depth: number): React.ReactNode => {
    const leaves = getLeaves(node);
    const count = leaves.filter((leaf) => checked.has(leaf.key)).length;
    const state: boolean | "indeterminate" = node.locked
      ? checked.has(node.key)
      : count === 0 ? false : count === leaves.length ? true : "indeterminate";
    const isOpen = expanded.has(node.key);

    let title: React.ReactNode = <span>{node.title}</span>;
    if (node.casdoor && !casdoorAvailable) {
      title = (
        <Tooltip>
          <TooltipTrigger asChild>{title}</TooltipTrigger>
          <TooltipContent>{i18next.t("general:Requires Casdoor to be installed")}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <li key={node.key}>
        <div className="flex items-center gap-1.5 py-1" style={{paddingLeft: depth * 20}}>
          {node.children ? (
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent"
              aria-label={node.title}
              onClick={() => setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(node.key)) {
                  next.delete(node.key);
                } else {
                  next.add(node.key);
                }
                return next;
              })}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
          ) : <span className="w-5" />}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={state}
              disabled={disabled || node.locked}
              onCheckedChange={() => toggle(node, state !== true)}
            />
            {title}
          </label>
        </div>
        {node.children && isOpen ? <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul> : null}
      </li>
    );
  };

  return <ul className="rounded-md border p-2">{renderNode(root, 0)}</ul>;
}

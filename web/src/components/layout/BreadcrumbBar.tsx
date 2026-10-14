import i18next from "i18next";
import {ChevronRight} from "lucide-react";
import {Link, useLocation} from "react-router-dom";

/**
 * Console breadcrumbs, ported from `web-old/src/common/BreadcrumbBar.js`. Only the
 * routes listed here get a trail; anything else renders nothing, exactly as the
 * antd version does.
 */
const RESOURCE_LABELS: Record<string, string> = {
  "account": "account:My Account",
  "quick-setup": "general:Quick Setup",
  "hub": "general:Hub",
  "stores": "general:Stores",
  "chats": "general:Chats",
  "messages": "general:Messages",
  "files": "general:Files",
  "vectors": "general:Vectors",
  "experiences": "general:Experiences",
  "providers": "general:Providers",
  "pipes": "general:Pipes",
  "skills": "general:Skills",
  "tools": "general:Tools",
  "tool-policies": "toolPolicy:Tool Permissions",
  "servers": "general:MCP Servers",
  "server-store": "general:MCP Store",
  "tasks": "general:Tasks",
  "scales": "general:Scales",
  "forms": "general:Forms",
  "records": "general:Logs",
  "notifications": "general:Notifications",
  "user-notifications": "general:Notifications",
  "sessions": "general:Sessions",
  "snapshots": "general:Snapshots",
  "student-accounts": "account:Student Accounts",
  "sites": "general:Sites",
  "comments": "general:Comments",
  "resources": "general:Resources",
  "usages": "general:Usages",
  "visitors": "general:Visitors",
  "sysinfo": "general:System Info",
  "migration": "general:Migration",
  "analysis": "store:Analysis",
  // the last segment of /stores/:owner/:name/view and /forms/:name/data
  "view": "general:Files",
  "data": "general:Data",
};

interface Crumb {
  label: string;
  to?: string;
}

export function buildBreadcrumbItems(pathname: string): Crumb[] | null {
  const pathSegments = (pathname || "").split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return null;
  }

  const rootSegment = pathSegments[0];
  const listLabelKey = RESOURCE_LABELS[rootSegment];
  if (!listLabelKey) {
    return null;
  }

  const home: Crumb = {label: i18next.t("general:Home"), to: "/"};
  if (pathSegments.length === 1) {
    return [home, {label: i18next.t(listLabelKey)}];
  }

  const lastSegment = pathSegments[pathSegments.length - 1];
  const lastLabelKey = RESOURCE_LABELS[lastSegment];
  return [
    home,
    {label: i18next.t(listLabelKey), to: `/${rootSegment}`},
    {label: lastLabelKey ? i18next.t(lastLabelKey) : lastSegment},
  ];
}

export function BreadcrumbBar() {
  const location = useLocation();
  const items = buildBreadcrumbItems(location.pathname);
  if (!items) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden /> : null}
            {item.to ? (
              <Link to={item.to} className="truncate underline-offset-4 hover:text-foreground hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbBar;

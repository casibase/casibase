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
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import {Loading} from "@/components/common/Loading";
import {AppLayout} from "@/components/layout/AppLayout";
import {useAccount} from "@/hooks/use-account";
import * as Setting from "@/lib/setting";

// Every page is its own chunk, so the chat page does not download the BPMN editor,
// the file previews or the charts of the admin pages.
const pageModules = import.meta.glob("./pages/*.tsx");
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();

function page(name: string) {
  let component = lazyCache.get(name);
  if (!component) {
    const loader = pageModules[`./pages/${name}.tsx`];
    component = loader
      ? React.lazy(loader as () => Promise<{default: React.ComponentType<any>}>)
      : React.lazy(() => import("@/pages/auth/PendingPage").then((m) => ({default: () => <m.default name={name} />})));
    lazyCache.set(name, component);
  }
  const Component = component;
  return <Component />;
}

const AuthCallback = React.lazy(() => import("@/pages/auth/AuthCallback"));
const SigninPage = React.lazy(() => import("@/pages/auth/SigninPage"));

/** Sends anonymous visitors to Casdoor (or the built-in sign-in page) and back. */
function RequireAuth({children}: {children: React.ReactNode}) {
  const {account, loading} = useAccount();
  const location = useLocation();

  if (loading || account === undefined) {
    return <Loading className="min-h-screen" />;
  }
  if (account === null) {
    sessionStorage.setItem("from", location.pathname + location.search);
    const signinUrl = Setting.getSigninUrl();
    if (signinUrl) {
      window.location.replace(signinUrl);
      return <Loading className="min-h-screen" />;
    }
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
}

function RedirectIfSignedIn({children}: {children: React.ReactNode}) {
  const {account} = useAccount();
  if (account) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/** "/" lands on the chat for most users and on the task list for task users. */
function HomeRedirect() {
  const {account} = useAccount();
  const {search} = useLocation();
  if (Setting.isTaskUser(account)) {
    return <Navigate to={`/tasks${search}`} replace />;
  }
  // keeps ?isRaw, so a site that frames "/?isRaw=1" still gets the bare chat
  return <Navigate to={`/chat${search}`} replace />;
}

export default function App() {
  return (
    <React.Suspense fallback={<Loading className="min-h-screen" />}>
      <Routes>
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/signin" element={<RedirectIfSignedIn><SigninPage /></RedirectIfSignedIn>} />

        {/* the chat takes the whole pane, without the console padding and footer */}
        <Route element={<RequireAuth><AppLayout fullBleed /></RequireAuth>}>
          <Route path="/chat" element={page("ChatPage")} />
          <Route path="/chat/:chatName" element={page("ChatPage")} />
          <Route path="/stores/:owner/:storeName/chat" element={page("ChatPage")} />
          <Route path="/:owner/:storeName/chat" element={page("ChatPage")} />
          <Route path="/:owner/:storeName/chat/:chatName" element={page("ChatPage")} />
        </Route>

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/home" element={<HomeRedirect />} />
          <Route path="/account" element={page("AccountPage")} />
          <Route path="/quick-setup" element={page("QuickSetupPage")} />
          <Route path="/hub" element={page("StoreHubPage")} />

          <Route path="/stores" element={page("StoreListPage")} />
          <Route path="/stores/:owner/:storeName" element={page("StoreEditPage")} />
          <Route path="/stores/:owner/:storeName/view" element={page("FileTreePage")} />
          <Route path="/stores/:owner/:storeName/chats" element={page("ChatListPage")} />
          <Route path="/stores/:owner/:storeName/messages" element={page("MessageListPage")} />
          <Route path="/stores/:owner/:storeName/vectors" element={page("VectorListPage")} />
          <Route path="/agents/:owner/:storeName" element={page("StoreViewPage")} />
          <Route path="/agents/:owner/:storeName/insights/:sub" element={page("StoreViewPage")} />
          <Route path="/agents/:owner/:storeName/issues/:issueName" element={page("StoreViewPage")} />
          <Route path="/agents/:owner/:storeName/:tab" element={page("StoreViewPage")} />
          <Route path="/chats" element={page("ChatListPage")} />
          <Route path="/chats/:chatName" element={page("ChatEditPage")} />
          <Route path="/messages" element={page("MessageListPage")} />
          <Route path="/messages/:messageName" element={page("MessageEditPage")} />

          <Route path="/files" element={page("FileListPage")} />
          <Route path="/vectors" element={page("VectorListPage")} />
          <Route path="/vectors/:vectorName" element={page("VectorEditPage")} />
          <Route path="/experiences" element={page("ExperienceListPage")} />
          <Route path="/experiences/:experienceName" element={page("ExperienceEditPage")} />

          <Route path="/providers" element={page("ProviderListPage")} />
          <Route path="/providers/:providerName" element={page("ProviderEditPage")} />
          <Route path="/pipes" element={page("PipeListPage")} />
          <Route path="/pipes/:pipeName" element={page("PipeEditPage")} />
          <Route path="/skills" element={page("SkillListPage")} />
          <Route path="/skills/:skillName" element={page("SkillEditPage")} />
          <Route path="/tools" element={page("ToolListPage")} />
          <Route path="/tools/:toolName" element={page("ToolEditPage")} />
          <Route path="/tool-policies" element={page("ToolPolicyListPage")} />
          <Route path="/tool-policies/:toolPolicyName" element={page("ToolPolicyEditPage")} />
          <Route path="/servers" element={page("ServerListPage")} />
          <Route path="/servers/:serverName" element={page("ServerEditPage")} />
          <Route path="/server-store" element={page("ServerStorePage")} />

          <Route path="/tasks" element={page("TaskListPage")} />
          <Route path="/tasks/:owner/:taskName" element={page("TaskEditPage")} />
          <Route path="/scales" element={page("ScaleListPage")} />
          <Route path="/scales/:owner/:scaleName" element={page("ScaleEditPage")} />
          <Route path="/forms" element={page("FormListPage")} />
          <Route path="/forms/:formName" element={page("FormEditPage")} />
          <Route path="/forms/:formName/data" element={page("FormDataPage")} />

          <Route path="/records" element={page("RecordListPage")} />
          <Route path="/records/:organizationName/:recordName" element={page("RecordEditPage")} />
          <Route path="/notifications" element={page("NotificationListPage")} />
          <Route path="/user-notifications" element={page("UserNotificationsPage")} />
          <Route path="/sessions" element={page("SessionListPage")} />
          <Route path="/snapshots" element={page("SnapshotListPage")} />

          <Route path="/student-accounts" element={page("StudentAccountPage")} />

          <Route path="/analysis" element={page("AnalysisListPage")} />
          <Route path="/analysis/:owner/:storeName" element={page("AnalysisEditPage")} />
          <Route path="/sites" element={page("SiteListPage")} />
          <Route path="/sites/:siteName" element={page("SiteEditPage")} />
          <Route path="/comments" element={page("CommentListPage")} />
          <Route path="/comments/:commentOwner/:commentName" element={page("CommentEditPage")} />
          <Route path="/resources" element={page("ResourceListPage")} />
          <Route path="/usages" element={page("UsagePage")} />
          <Route path="/visitors" element={page("VisitorPage")} />
          <Route path="/sysinfo" element={page("SystemInfoPage")} />
          <Route path="/migration" element={page("MigrationPage")} />

          <Route path="*" element={page("NotFoundPage")} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

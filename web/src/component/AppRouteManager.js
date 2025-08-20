// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

import React, {useEffect, useState} from "react";
import {Spin} from "antd";

class AppRouteManager {
  constructor() {
    this.routes = new Map();
    this.defaultIcons = [
      "default-1.svg",
      "default-2.svg",
      "default-3.svg",
      "default-4.svg",
      "default-5.svg",
      "default-6.svg",
    ];
  }

  registerApp(appType, config) {
    this.routes.set(appType, config);
  }

  getRouteComponent(appType, pathname) {
    const app = this.routes.get(appType);
    for (const route of app.routes) {
      if (this.pathMatches(route.path, pathname)) {
        return route.component;
      }
    }
    return null;
  }

  pathMatches(routePath, actualPath) {
    const routeParts = routePath.split("/");
    const actualParts = actualPath.split("/");

    if (routeParts.length !== actualParts.length) {
      return false;
    }

    for (let i = 0; i < routeParts.length; i++) {
      if (!routeParts[i].startsWith(":") && routeParts[i] !== actualParts[i]) {
        return false;
      }
    }
    return true;
  }

  getAppConfig(appType) {
    return this.routes.get(appType);
  }

  getRegisteredApps() {
    return Array.from(this.routes.keys());
  }

  getAllAppConfigs() {
    return Array.from(this.routes.entries()).map(([appType, config]) => ({
      appType,
      ...config,
    }));
  }

  getHashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getDefaultIcon(appType) {
    const app = this.getHashCode(appType) + 3;
    const index = app % this.defaultIcons.length;
    return this.defaultIcons[index];
  }
}

const routeManager = new AppRouteManager();

routeManager.registerApp("chat", {
  title: "Chat",
  gradient: "linear-gradient(135deg, #ffdc6f, #ffffff)",
  routes: [
    {
      path: "/chat",
      component: () => import("../ChatPage"),
    },
    {
      path: "/chat/:chatName",
      component: () => import("../ChatPage"),
    },
  ],
});

routeManager.registerApp("usages", {
  title: "Usages",
  gradient: "linear-gradient(135deg, #52abde 0%, #fbf5f1 100%)",
  routes: [
    {
      path: "/usage",
      component: () => import("../UsagePage"),
    },
  ],
});

routeManager.registerApp("activities", {
  title: "Activities",
  gradient: "linear-gradient(135deg, #ade4a4 0%, #f1faff 100%)",
  routes: [
    {
      path: "/activity",
      component: () => import("../ActivityPage"),
    },
  ],
});

routeManager.registerApp("chats", {
  title: "Chats",
  gradient: "linear-gradient(135deg, #f8d187 0%, #fff8ea 100%)",
  routes: [
    {
      path: "/chats",
      component: () => import("../ChatListPage"),
    },
    {
      path: "/chats/:chatName",
      component: () => import("../ChatEditPage"),
    },
  ],
});

routeManager.registerApp("messages", {
  title: "Messages",
  gradient: "linear-gradient(135deg, #7db6d8 0%, #47a6dc 100%)",
  routes: [
    {
      path: "/messages",
      component: () => import("../MessageListPage"),
    },
    {
      path: "/messages/:messageName",
      component: () => import("../MessageEditPage"),
    },
  ],
});

routeManager.registerApp("stores", {
  title: "Stores",
  gradient: "linear-gradient(135deg, #ade4a4 0%, #f1faff 100%)",
  routes: [
    {
      path: "/stores",
      component: () => import("../StoreListPage"),
    },
    {
      path: "/stores/:owner/:storeName",
      component: () => import("../StoreEditPage"),
    },
    {
      path: "/stores/:owner/:storeName/view",
      component: () => import("../FileTreePage"),
    },
    {
      path: "/stores/:owner/:storeName/chats",
      component: () => import("../ChatListPage"),
    },
    {
      path: "/stores/:owner/:storeName/messages",
      component: () => import("../MessageListPage"),
    },
  ],
});

routeManager.registerApp("providers", {
  title: "Providers",
  gradient: "linear-gradient(135deg, #6e91da 0%, #c0e8ff 100%)",
  routes: [
    {
      path: "/providers",
      component: () => import("../ProviderListPage"),
    },
    {
      path: "/providers/:providerName",
      component: () => import("../ProviderEditPage"),
    },
  ],
});

routeManager.registerApp("vectors", {
  title: "Vectors",
  gradient: "linear-gradient(135deg, #a0bafa 0%, #f5ffe4 100%)",
  routes: [
    {
      path: "/vectors",
      component: () => import("../VectorListPage"),
    },
    {
      path: "/vectors/:vectorName",
      component: () => import("../VectorEditPage"),
    },
  ],
});

routeManager.registerApp("nodes", {
  title: "Nodes",
  gradient: "linear-gradient(135deg, rgb(100 152 255) 0%, rgb(220 232 255) 100%)",
  routes: [
    {
      path: "/nodes",
      component: () => import("../NodeListPage"),
    },
    {
      path: "/nodes/:nodeName",
      component: () => import("../NodeEditPage"),
    },
  ],
});

routeManager.registerApp("templates", {
  title: "Templates",
  gradient: "linear-gradient(135deg, #31b4ff 0%, #fbf5f1 100%)",
  routes: [
    {
      path: "/templates",
      component: () => import("../TemplateListPage"),
    },
    {
      path: "/templates/:templateName",
      component: () => import("../TemplateEditPage"),
    },
  ],
});

routeManager.registerApp("applications", {
  title: "Applications",
  gradient: "linear-gradient(135deg, #ffffff 0%, #aec0ff 100%)",
  routes: [
    {
      path: "/applications",
      component: () => import("../ApplicationListPage"),
    },
    {
      path: "/applications/:applicationName",
      component: () => import("../ApplicationEditPage"),
    },
  ],
});

routeManager.registerApp("application-store", {
  title: "Application Store",
  gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
  routes: [
    {
      path: "/application-store",
      component: () => import("../ApplicationStorePage"),
    },
    {
      path: "/application-store/:applicationName",
      component: () => import("../ApplicationStorePage"),
    },
  ],
});

routeManager.registerApp("machines", {
  title: "Machines",
  gradient: "linear-gradient(135deg, rgb(81 167 200) 0%, rgb(245 251 255) 100%)",
  routes: [
    {
      path: "/machines",
      component: () => import("../MachineListPage"),
    },
    {
      path: "/machines/:organizationName/:machineName",
      component: () => import("../MachineEditPage"),
    },
  ],
});

routeManager.registerApp("images", {
  title: "Images",
  gradient: "linear-gradient(135deg,rgb(156, 176, 230) 90%,rgb(151, 151, 151) 100%)",
  routes: [
    {
      path: "/images",
      component: () => import("../ImageListPage"),
    },
    {
      path: "/images/:organizationName/:imageName",
      component: () => import("../ImageEditPage"),
    },
  ],
});

routeManager.registerApp("containers", {
  title: "Containers",
  gradient: "linear-gradient(135deg,rgb(66, 194, 236) 0%,rgb(20, 148, 190) 100%)",
  routes: [
    {
      path: "/containers",
      component: () => import("../ContainerListPage"),
    },
    {
      path: "/containers/:organizationName/:containerName",
      component: () => import("../ContainerEditPage"),
    },
  ],
});

routeManager.registerApp("pods", {
  title: "Pods",
  gradient: "linear-gradient(135deg,rgb(77, 131, 240) 0%,rgb(255, 255, 255) 100%)",
  routes: [
    {
      path: "/pods",
      component: () => import("../PodListPage"),
    },
    {
      path: "/pods/:organizationName/:podName",
      component: () => import("../PodEditPage"),
    },
  ],
});

routeManager.registerApp("workbench", {
  title: "Workbench",
  gradient: "linear-gradient(135deg, #ACCBFB 0%, #71DF9E 100%)",
  routes: [
    {
      path: "/workbench",
      component: () => import("../NodeWorkbench"),
    },
  ],
});

routeManager.registerApp("videos", {
  title: "Videos",
  gradient: "linear-gradient(135deg, #4E82E4 0%,rgb(255, 255, 255) 100%)",
  routes: [
    {
      path: "/videos",
      component: () => import("../VideoListPage"),
    },
    {
      path: "/videos/:owner/:videoName",
      component: () => import("../VideoEditPage"),
    },
  ],
});

routeManager.registerApp("public-videos", {
  title: "Public Videos",
  gradient: "linear-gradient(135deg, #2D4479 0%, #A5C5F6 100%)",
  routes: [
    {
      path: "/public-videos",
      component: () => import("../basic/PublicVideoListPage"),
    },
    {
      path: "/public-videos/:owner/:videoName",
      component: () => import("../VideoPage"),
    },
  ],
});

routeManager.registerApp("tasks", {
  title: "Tasks",
  gradient: "linear-gradient(135deg, rgb(239 246 255) 0%, #4393f6 100%)",
  routes: [
    {
      path: "/tasks",
      component: () => import("../TaskListPage"),
    },
    {
      path: "/tasks/:taskName",
      component: () => import("../TaskEditPage"),
    },
  ],
});

routeManager.registerApp("workflows", {
  title: "Workflows",
  gradient: "linear-gradient(135deg, #f8d187 0%, #fff8ea 100%)",
  routes: [
    {
      path: "/workflows",
      component: () => import("../WorkflowListPage"),
    },
    {
      path: "/workflows/:workflowName",
      component: () => import("../WorkflowEditPage"),
    },
  ],
});

routeManager.registerApp("forms", {
  title: "Forms",
  gradient: "linear-gradient(135deg, #f6e3b7 0%, #ffeaba 100%)",
  routes: [
    {
      path: "/forms",
      component: () => import("../FormListPage"),
    },
    {
      path: "/forms/:formName",
      component: () => import("../FormEditPage"),
    },
    {
      path: "/forms/:formName/data",
      component: () => import("../FormDataPage"),
    },
  ],
});

routeManager.registerApp("audit", {
  title: "Audit",
  gradient: "linear-gradient(135deg, #ffffff 0%, #aec0ff 100%)",
  i18nNamespace: "med",
  routes: [
    {
      path: "/audit",
      component: () => import("../frame/AuditPage"),
    },
  ],
});

routeManager.registerApp("medical", {
  title: "Medical Image Analysis",
  gradient: "linear-gradient(135deg,rgb(151, 185, 219) 0%, #42579B 100%)",
  i18nNamespace: "med",
  routes: [
    {
      path: "/yolov8mi",
      component: () => import("../frame/PythonYolov8miPage"),
    },
  ],
});

routeManager.registerApp("articles", {
  title: "Articles",
  gradient: "linear-gradient(135deg, rgb(156, 176, 230) 0%, rgb(214 214 214) 100%)",
  routes: [
    {
      path: "/articles",
      component: () => import("../ArticleListPage"),
    },
    {
      path: "/articles/:articleName",
      component: () => import("../ArticleEditPage"),
    },
  ],
});

routeManager.registerApp("super-resolution", {
  title: "Super Resolution",
  gradient: "linear-gradient(135deg, #303B68 0%, #65C37C 100%)",
  i18nNamespace: "med",
  routes: [
    {
      path: "/sr",
      component: () => import("../frame/PythonSrPage"),
    },
  ],
});

routeManager.registerApp("sessions", {
  title: "Sessions",
  gradient: "linear-gradient(135deg, #f16abbff 0%, #b88da7ff 100%)",
  routes: [
    {
      path: "/sessions",
      component: () => import("../SessionListPage"),
    },
  ],
});

routeManager.registerApp("connections", {
  title: "Connections",
  gradient: "linear-gradient(135deg, #f16a7d 0%, #c7c7c7 100%)",
  routes: [
    {
      path: "/connections",
      component: () => import("../ConnectionListPage"),
    },
  ],
});

routeManager.registerApp("records", {
  title: "Records",
  gradient: "linear-gradient(135deg, #fae190 0%, #bca762 100%)",
  routes: [
    {
      path: "/records",
      component: () => import("../RecordListPage"),
    },
    {
      path: "/records/:organizationName/:recordName",
      component: () => import("../RecordEditPage"),
    },
  ],
});

export const DynamicRouteComponent = ({appType, match, location, ...props}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const componentLoader = routeManager.getRouteComponent(appType, location.pathname);

    componentLoader()
      .then(module => {
        setComponent(() => module.default);
        setLoading(false);
      });
  }, [appType, location.pathname]);

  if (loading) {
    return (
      <div style={{padding: "20px", textAlign: "center"}}>
        <Spin size="large" />
      </div>
    );
  }

  return <Component {...props} match={match} location={location} />;
};

export default routeManager;

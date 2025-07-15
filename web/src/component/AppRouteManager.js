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
}

const routeManager = new AppRouteManager();

routeManager.registerApp("chat", {
  title: "Chat",
  iconPath: "/chat.svg",
  gradient: "linear-gradient(135deg, #427FF8 0%, #FCBE00 100%)",
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

routeManager.registerApp("usage", {
  title: "Usage",
  iconPath: "/usage.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
  routes: [
    {
      path: "/usage",
      component: () => import("../UsagePage"),
    },
  ],
});

routeManager.registerApp("chats", {
  title: "Chats",
  iconPath: "/chat.svg",
  gradient: "linear-gradient(135deg, #427FF8 0%, #FCBE00 100%)",
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
  iconPath: "/message.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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
  iconPath: "/store.svg",
  gradient: "linear-gradient(135deg, #427FF8 0%, #FCBE00 100%)",
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
  iconPath: "/provider.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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
  iconPath: "/vector.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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

routeManager.registerApp("node", {
  title: "Nodes",
  iconPath: "/node.svg",
  gradient: "linear-gradient(135deg,rgb(36, 93, 207) 0%,rgb(82, 136, 244) 100%)",
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

routeManager.registerApp("machine", {
  title: "Machines",
  iconPath: "/machine.svg",
  gradient: "linear-gradient(135deg, #58B4D9 0%,rgb(50, 161, 241) 100%)",
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

routeManager.registerApp("image", {
  title: "Images",
  iconPath: "/image.svg",
  gradient: "linear-gradient(135deg,rgb(156, 176, 230) 0%,rgb(151, 151, 151) 100%)",
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

routeManager.registerApp("container", {
  title: "Containers",
  iconPath: "/container.svg",
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

routeManager.registerApp("pod", {
  title: "Pods",
  iconPath: "/pod.svg",
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

routeManager.registerApp("workflow", {
  title: "Workflows",
  iconPath: "/workflow.svg",
  gradient: "linear-gradient(135deg,rgb(255, 228, 177) 0%, #71DF9E 100%)",
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

routeManager.registerApp("videos", {
  title: "Videos",
  iconPath: "/video.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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
  iconPath: "/public_video.svg", // 完全自定义路径
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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

routeManager.registerApp("forms", {
  title: "Forms",
  iconPath: "/form.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
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
  iconPath: "/audit.svg",
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
  routes: [
    {
      path: "/audit",
      component: () => import("../frame/AuditPage"),
    },
  ],
});

routeManager.registerApp("yolov8mi", {
  title: "Medical Image Analysis",
  iconPath: "/medical.svg", // 医疗相关的专用图标目录
  gradient: "linear-gradient(135deg, #E25232 0%, #59BCF4 100%)",
  routes: [
    {
      path: "/yolov8mi",
      component: () => import("../frame/PythonYolov8miPage"),
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

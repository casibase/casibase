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
}

const routeManager = new AppRouteManager();

routeManager.registerApp("node", {
  title: "Nodes",
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

routeManager.registerApp("application-template", {
  title: "Application Templates",
  routes: [
    {
      path: "/application-templates",
      component: () => import("../ApplicationTemplateListPage"),
    },
    {
      path: "/application-templates/:applicationTemplateName",
      component: () => import("../ApplicationTemplateEditPage"),
    },
  ],
});

routeManager.registerApp("machine", {
  title: "Machines",
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

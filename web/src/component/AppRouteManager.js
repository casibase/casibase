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

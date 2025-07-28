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

import React, {useEffect, useRef, useState} from "react";
import {useHistory} from "react-router-dom";
import {Button} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import {DndContext, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors} from "@dnd-kit/core";
import i18next from "i18next";
import "./OsDesktop.css";
import routeManager, {DynamicRouteComponent} from "./component/AppRouteManager";
import {StaticBaseUrl} from "./Conf";
import {Draggable} from "./component/DragDrop/Draggable";
import {Droppable} from "./component/DragDrop/Droppable";

const getIconUrl = (appType) => {
  return `${StaticBaseUrl}/apps/${appType}.svg`;
};

const getDefaultIconUrl = (appType) => {
  return `${StaticBaseUrl}/apps/${routeManager.getDefaultIcon(appType)}`;
};

const DesktopIcon = ({name, onClick, gradient, appType}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
    onClick();
  };

  return (
    <div
      className={`desktop-icon ${isHovered ? "hovered" : ""} ${isClicked ? "clicked" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{"--icon-gradient": gradient}}
    >
      <div className="icon">
        <img
          src={getIconUrl(appType)}
          alt={name}
          onError={e => e.target.src = getDefaultIconUrl(appType)}
        />
      </div>
      <div className="icon-name">{name}</div>
    </div>
  );
};

const WindowContent = ({appType, account, history, match, location, isDesktopMode}) => {
  return (
    <DynamicRouteComponent
      appType={appType}
      match={match}
      location={location}
      account={account}
      history={history}
      isDesktopMode={isDesktopMode}
    />
  );
};

const Window = ({title, isMaximized, onClose, onMaximize, onMinimize, onFocus, appType, appConfig, account, history, match, location, onRouteChange, windowHistory, onGoBack, onGoForward}) => {
  const windowHistoryObj = {
    ...history,
    push: (path) => {
      onRouteChange(path);
    },
    replace: (path) => {
      onRouteChange(path);
    },
    goBack: () => onGoBack(),
    goForward: () => onGoForward(),
    location: {
      ...history.location,
      pathname: location.pathname || "/",
    },
    length: windowHistory ? windowHistory.entries.length : 1,
    action: "PUSH",
    createHref: (location) => {
      return typeof location === "string" ? location : location.pathname;
    },
    block: () => () => {},
    listen: () => () => {},
  };

  const canGoBack = windowHistory && windowHistory.currentIndex > 0;
  const canGoForward = windowHistory && windowHistory.currentIndex < windowHistory.entries.length - 1;

  return (
    <div
      className="desktop-window"
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
    >
      <div
        className="window-header"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onMaximize();
        }}
      >
        <div className="window-header-left">
          <div className="window-app-info">
            <img
              src={getIconUrl(appType)}
              alt={title}
              className="window-app-icon"
              onError={e => e.target.src = getDefaultIconUrl(appType)}
            />
            <div className="window-title">{i18next.t(`${appConfig?.i18nNamespace || "general"}:${title}`)}</div>
          </div>
          <div className="window-navigation">
            <Button
              icon={<LeftOutlined />}
              size="small"
              disabled={!canGoBack}
              onClick={(e) => {
                e.stopPropagation();
                onGoBack();
              }}
            />
            <Button
              icon={<RightOutlined />}
              size="small"
              disabled={!canGoForward}
              onClick={(e) => {
                e.stopPropagation();
                onGoForward();
              }}
            />
          </div>
        </div>
        <div className="window-controls">
          <Button
            className="window-control window-minimize"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            <span className="control-icon">−</span>
          </Button>
          <Button
            className="window-control window-maximize"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
          >
            <span className="control-icon">{isMaximized ? "❐" : "□"}</span>
          </Button>
          <Button
            className="window-control window-close"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <span className="control-icon">×</span>
          </Button>
        </div>
      </div>
      <div className="window-content">
        <WindowContent
          appType={appType}
          account={account}
          history={windowHistoryObj}
          match={match}
          location={location}
          isDesktopMode={true}
        />
      </div>
    </div>
  );
};

const DockItem = ({window, onClick, isActive}) => {
  return (
    <div
      className={`dock-item ${isActive ? "active" : ""} ${window.isMinimized ? "minimized" : ""}`}
      onClick={() => onClick(window.id)}
      style={{"--icon-gradient": window.gradient}}
      title={i18next.t(`${window.appConfig?.i18nNamespace || "general"}:${window.title}`)}
    >
      <img
        src={getIconUrl(window.appType)}
        alt={window.title}
        onError={e => e.target.src = getDefaultIconUrl(window.appType)}
      />
      {!window.isMinimized && <div className="dock-indicator"></div>}
    </div>
  );
};

const Dock = ({windows, activeWindowId, onDockItemClick}) => {
  if (windows.length === 0) {
    return null;
  }

  return (
    <div className="dock">
      <div className="dock-container">
        {windows.map(window => (
          <DockItem
            key={window.id}
            window={window}
            isActive={activeWindowId === window.id}
            onClick={onDockItemClick}
          />
        ))}
      </div>
    </div>
  );
};

const OsDesktop = (props) => {
  const [windows, setWindows] = useState([]);
  const [nextWindowId, setNextWindowId] = useState(1);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const desktopRef = useRef(null);
  const history = useHistory();
  const [isInitialized, setIsInitialized] = useState(false);
  const maxZindex = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "visible";
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopRef.current && e.target === desktopRef.current || e.target.className === "desktop-content") {
        setActiveWindowId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!props.account) {return;}
    const userId = props.account.id;
    const userDesktop = localStorage.getItem(`desktop-${userId}`);
    if (!userDesktop) {
      setIsInitialized(true);
      maxZindex.current = 0;
      return;
    }

    const windows = JSON.parse(userDesktop).desktop.windows;
    setWindows(windows);
    setIsInitialized(true);
    maxZindex.current = Math.max(...windows.map(w => w.zIndex));
  }, [props.account]);

  useEffect(() => {
    if (!props.account || !isInitialized) {return;}

    const userId = props.account.id;
    const userDesktop = {
      userId,
      desktop: {
        windows,
      },
    };
    localStorage.setItem(`desktop-${userId}`, JSON.stringify(userDesktop));
  }, [windows, isInitialized]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const openWindow = (appType) => {
    const id = `window-${nextWindowId}`;
    const appConfig = routeManager.getAppConfig(appType);
    const {title, gradient} = appConfig;
    const initialRoute = appConfig.routes[0].path;

    const offset = (windows.length * 30) % 150;

    const params = extractRouteParams(appType, initialRoute);

    const match = {
      params,
      path: initialRoute,
      url: initialRoute,
      isExact: true,
    };

    const location = {
      pathname: initialRoute,
      search: "",
      hash: "",
      state: null,
    };

    const newWindow = {
      id,
      title,
      appType,
      appConfig,
      gradient,
      isMaximized: false,
      isMinimized: false,
      zIndex: maxZindex.current + 1,
      position: {
        x: 100 + offset,
        y: 100 + offset,
      },
      size: {width: 800, height: 600},
      minSize: {width: 800, height: 600},
      history: {
        entries: [initialRoute],
        currentIndex: 0,
      },
      match,
      location,
      account: props.account,
      isDragging: false,
      isResizing: false,
    };

    setWindows([...windows, newWindow]);
    setNextWindowId(nextWindowId + 1);
    setActiveWindowId(id);
    maxZindex.current += 1;
  };

  const closeWindow = (id) => {
    setWindows(windows.filter(window => window.id !== id));
    if (activeWindowId === id) {
      const remainingWindows = windows.filter(window => window.id !== id);
      setActiveWindowId(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
    }
  };

  const toggleMaximize = (id) => {
    setWindows(prevWindows => prevWindows.map(window => {
      if (window.id === id) {
        const updatedWindow = {
          ...window,
          isMaximized: !window.isMaximized,
          isMinimized: false,
          isResizing: false,
          zIndex: maxZindex.current + 1,
        };

        return updatedWindow;
      }
      return window;
    }));
    maxZindex.current += 1;
    setActiveWindowId(id);
  };

  const minimizeWindow = (id) => {
    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {...window, isMinimized: true}
        : window
    ));

    const visibleWindows = windows.filter(w => !w.isMinimized && w.id !== id);
    if (visibleWindows.length > 0) {
      setActiveWindowId(visibleWindows[visibleWindows.length - 1].id);
    } else {
      setActiveWindowId(null);
    }
  };

  const focusWindow = (id) => {
    if (activeWindowId === id) {return;}

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {...window, zIndex: maxZindex.current + 1}
        : window
    ));
    maxZindex.current += 1;

    setActiveWindowId(id);
  };

  const extractRouteParams = (appType, pathname) => {
    const appConfig = routeManager.getAppConfig(appType);
    if (!appConfig || !appConfig.routes) {
      return {};
    }

    for (const route of appConfig.routes) {
      const routeParts = route.path.split("/");
      const pathParts = pathname.split("/");

      if (routeParts.length === pathParts.length) {
        let isMatch = true;
        const params = {};

        for (let i = 0; i < routeParts.length; i++) {
          const routePart = routeParts[i];
          const pathPart = pathParts[i];

          if (routePart.startsWith(":")) {
            const paramName = routePart.slice(1);
            params[paramName] = pathPart;
          } else if (routePart !== pathPart) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          return params;
        }
      }
    }

    return {};
  };

  const updateWindowRoute = (id, newRoute) => {
    const currentWindow = windows.find(window => window.id === id);

    const newHistory = {
      entries: [...currentWindow.history.entries.slice(0, currentWindow.history.currentIndex + 1), newRoute],
      currentIndex: currentWindow.history.currentIndex + 1,
    };

    const params = extractRouteParams(currentWindow.appType, newRoute);

    const newMatch = {
      params,
      path: newRoute,
      url: newRoute,
      isExact: true,
    };

    const newLocation = {
      pathname: newRoute,
      search: "",
      hash: "",
      state: null,
    };

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {
          ...window,
          history: newHistory,
          match: newMatch,
          location: newLocation,
          zIndex: maxZindex.current + 1,
        }
        : window
    ));

    setActiveWindowId(id);
    maxZindex.current += 1;
  };

  const goBack = (id) => {
    const currentWindow = windows.find(window => window.id === id);
    const history = currentWindow.history;
    const prevRoute = history.entries[history.currentIndex - 1];

    const params = extractRouteParams(currentWindow.appType, prevRoute);

    const newMatch = {
      params,
      path: prevRoute,
      url: prevRoute,
      isExact: true,
    };

    const newLocation = {
      pathname: prevRoute,
      search: "",
      hash: "",
      state: null,
    };

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {
          ...window,
          history: {
            ...history,
            currentIndex: history.currentIndex - 1,
          },
          match: newMatch,
          location: newLocation,
          zIndex: maxZindex.current + 1,
        }
        : window
    ));

    setActiveWindowId(id);
    maxZindex.current += 1;
  };

  const goForward = (id) => {
    const currentWindow = windows.find(window => window.id === id);
    const history = currentWindow.history;
    const nextRoute = history.entries[history.currentIndex + 1];

    const params = extractRouteParams(currentWindow.appType, nextRoute);

    const newMatch = {
      params,
      path: nextRoute,
      url: nextRoute,
      isExact: true,
    };

    const newLocation = {
      pathname: nextRoute,
      search: "",
      hash: "",
      state: null,
    };

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {
          ...window,
          history: {
            ...history,
            currentIndex: history.currentIndex + 1,
          },
          match: newMatch,
          location: newLocation,
          zIndex: maxZindex.current + 1,
        }
        : window
    ));

    setActiveWindowId(id);
    maxZindex.current += 1;
  };

  const handleDragStart = (event) => {
    const {active} = event;

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === active.id
        ? {...window, isDragging: true, zIndex: maxZindex.current + 1}
        : window
    ));
    maxZindex.current += 1;
    setActiveWindowId(active.id);
  };

  const handleDragEnd = (event) => {
    const {active, delta} = event;

    setWindows(prevWindows => prevWindows.map(window =>
      window.id === active.id
        ? {
          ...window,
          position: {
            x: window.position.x + delta.x,
            y: Math.max(64, window.position.y + delta.y),
          },
          isDragging: false,
        }
        : window
    ));
  };

  const restoreWindow = (id) => {
    setWindows(prevWindows => prevWindows.map(window =>
      window.id === id
        ? {...window, isMinimized: false, zIndex: maxZindex.current + 1}
        : window
    ));
    setActiveWindowId(id);
    maxZindex.current += 1;
  };

  const handleDockItemClick = (id) => {
    const window = windows.find(w => w.id === id);
    if (!window) {return;}

    if (window.isMinimized) {
      restoreWindow(id);
    } else if (activeWindowId === id) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  };

  const handleResizeStart = (e, direction, id) => {
    e.stopPropagation();
    const window = windows.find(w => w.id === id);
    if (!window) {return;}

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = window.size.width;
    const startHeight = window.size.height;
    const startXPos = window.position.x;
    const startYPos = window.position.y;

    setWindows(prevWindows => prevWindows.map(w =>
      w.id === id
        ? {...w, isResizing: true, zIndex: maxZindex.current + 1}
        : w
    ));
    maxZindex.current += 1;
    setActiveWindowId(id);

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (direction.includes("e")) {
        newWidth = Math.max(400, startWidth + deltaX);
      }
      if (direction.includes("w")) {
        const widthChange = Math.min(deltaX, startWidth - 400);
        newWidth = Math.max(400, startWidth - widthChange);
        newX = startXPos + widthChange;
      }
      if (direction.includes("s")) {
        newHeight = Math.max(300, startHeight + deltaY);
      }
      if (direction.includes("n")) {
        const heightChange = Math.min(deltaY, startHeight - 300);
        newHeight = Math.max(300, startHeight - heightChange);
        newY = startYPos + heightChange;
      }

      setWindows(prevWindows => prevWindows.map(w =>
        w.id === id
          ? {
            ...w,
            size: {width: newWidth, height: newHeight},
            position: {x: newX, y: newY},
          }
          : w
      ));
    };

    const handleMouseUp = () => {
      setWindows(prevWindows => prevWindows.map(w =>
        w.id === id
          ? {...w, isResizing: false}
          : w
      ));
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="os-desktop">
      <div className="desktop-content" ref={desktopRef}>
        <div className="desktop-icons">
          {routeManager.getAllAppConfigs().map((app) => (
            <DesktopIcon
              key={app.appType}
              name={i18next.t(`${app.i18nNamespace || "general"}:${app.title}`)}
              onClick={() => openWindow(app.appType)}
              gradient={app.gradient}
              appType={app.appType}
            />
          ))}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Droppable id="desktop">
            {windows.map(window => (
              <Draggable id={window.id}
                key={window.id}
                position={window.position}
                isMaximized={window.isMaximized}
                isMinimized={window.isMinimized}
                isDragging={window.isDragging}
                isResizing={window.isResizing}
                size={window.size}
                zIndex={window.zIndex}
              >
                <Window
                  title={window.title}
                  appType={window.appType}
                  appConfig={window.appConfig}
                  account={props.account}
                  history={props.history || history}
                  match={window.match}
                  location={window.location}
                  windowHistory={window.history}
                  onClose={() => closeWindow(window.id)}
                  onMaximize={() => toggleMaximize(window.id)}
                  onMinimize={() => minimizeWindow(window.id)}
                  onFocus={() => focusWindow(window.id)}
                  onRouteChange={(newRoute) => updateWindowRoute(window.id, newRoute)}
                  onGoBack={() => goBack(window.id)}
                  onGoForward={() => goForward(window.id)}
                />
                {!window.isMaximized && (
                  <div className="window-resize-handles">
                    <div className="window-resize-handle resize-handle-top" onMouseDown={(e) => handleResizeStart(e, "n", window.id)}></div>
                    <div className="window-resize-handle resize-handle-bottom" onMouseDown={(e) => handleResizeStart(e, "s", window.id)}></div>
                    <div className="window-resize-handle resize-handle-left" onMouseDown={(e) => handleResizeStart(e, "w", window.id)}></div>
                    <div className="window-resize-handle resize-handle-right" onMouseDown={(e) => handleResizeStart(e, "e", window.id)}></div>
                    <div className="window-resize-handle resize-handle-top-left" onMouseDown={(e) => handleResizeStart(e, "nw", window.id)}></div>
                    <div className="window-resize-handle resize-handle-top-right" onMouseDown={(e) => handleResizeStart(e, "ne", window.id)}></div>
                    <div className="window-resize-handle resize-handle-bottom-left" onMouseDown={(e) => handleResizeStart(e, "sw", window.id)}></div>
                    <div className="window-resize-handle resize-handle-bottom-right" onMouseDown={(e) => handleResizeStart(e, "se", window.id)}></div>
                  </div>
                )}
              </Draggable>
            ))}
          </Droppable>
        </DndContext>
      </div>

      <Dock
        windows={windows}
        activeWindowId={activeWindowId}
        onDockItemClick={handleDockItemClick}
      />
    </div>
  );
};

export default OsDesktop;

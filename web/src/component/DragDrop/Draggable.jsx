import {useDraggable} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";

export const Draggable = ({id, position, children, isMaximized, isMinimized, isDragging, isResizing, size, zIndex}) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id,
  });

  const finalTransform = {
    x: (transform?.x || 0) + (position?.x || 0),
    y: Math.max(0, (transform?.y || 0) + (position?.y || 0)),
  };

  const commonStyle = {
    position: "absolute",
    pointerEvents: "auto",
    minWidth: size.minWidth,
    minHeight: size.minHeight,
    maxWidth: "100%",
    maxHeight: "100%",
    zIndex: zIndex || 0,
    transition: isDragging ? "none" : isResizing ? "none" : "transform 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out",
    userSelect: isResizing ? "none" : "auto",
  };

  const style = {
    ...commonStyle,
    ...(isMaximized
      ? {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }
      : isMinimized
        ? {
          display: "none",
        }
        : {
          transform: CSS.Translate.toString(finalTransform),
          width: size.width ? size.width : 800,
          height: size.height ? size.height : 600,
        }
    ),
  };

  // check if the event is from resize handle
  const isResizeHandle = (event) => {
    return event.target && event.target.closest && event.target.closest(".window-resize-handle");
  };

  const isWindowHeader = (event) => {
    return event.target && event.target.closest && event.target.closest(".window-header");
  };

  const isWindowControl = (event) => {
    return event.target && event.target.closest && event.target.closest(".window-control");
  };

  const isWindowNavigation = (event) => {
    return event.target && event.target.closest && event.target.closest(".window-navigation");
  };

  const filteredListeners = isMaximized || isResizing ? {} : {
    onMouseDown: (event) => {
      if (isResizeHandle(event)) {
        return;
      }
      if (!isWindowHeader(event)) {
        return;
      }
      if (isWindowControl(event)) {
        return;
      }
      if (isWindowNavigation(event)) {
        return;
      }
      listeners.onMouseDown?.(event);
    },
  };

  return (
    <div
      ref={setNodeRef}
      {...(isMaximized ? {} : attributes)}
      {...filteredListeners}
      style={style}
    >
      {children}
    </div>
  );
};

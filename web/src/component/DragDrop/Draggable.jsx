import {useDraggable} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";

export const Draggable = ({id, position, children, isMaximized, isDragging}) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id,
  });

  const finalTransform = {
    x: (transform?.x || 0) + (position?.x || 0),
    y: (transform?.y || 0) + (position?.y || 0),
  };

  const commonStyle = {
    position: "absolute",
    touchAction: "none",
    userSelect: "none",
    pointerEvents: "auto",
    minWidth: 400,
    minHeight: 300,
    transition: isDragging ? "none" : "transform 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out",
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
      : {
        transform: CSS.Translate.toString(finalTransform),
        width: 800,
        height: 600,
      }
    ),
  };

  return (
    <div ref={setNodeRef} {...(isMaximized ? {} : attributes)} {...(isMaximized ? {} : listeners)} style={style}>
      {children}
    </div>
  );
};

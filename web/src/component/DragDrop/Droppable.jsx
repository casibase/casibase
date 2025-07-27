import {useDroppable} from "@dnd-kit/core";

export const Droppable = ({id, children, style}) => {
  const {setNodeRef} = useDroppable({id});

  const containerStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    ...style,
  };

  return (
    <div ref={setNodeRef} style={containerStyle}>
      {children}
    </div>
  );
};

import { Plate, PlateContent, PlatePlugin, Value } from "@udecode/plate-common";
import React from "react";
import { createPlateUI } from "./create-plate-ui";
import { plugins } from "./plate-editor";

export interface PlateViewerProps {
  value: Value;
  className?: string;
}

export function PlateViewer({ value, className }: PlateViewerProps) {
  // Create a simplified version of the plugins for read-only rendering
  const viewerPlugins = React.useMemo(() => {
    return plugins.filter(
      (plugin: PlatePlugin) =>
        // Filter out plugins that are only needed for editing
        ![
          "dnd",
          "nodeId",
          "resetNode",
          "selectOnBackspace",
          "blockSelection",
        ].includes(plugin.key),
    );
  }, []);

  // Create the UI components
  const components = createPlateUI();

  return (
    <Plate plugins={viewerPlugins} initialValue={value}>
      <PlateContent
        readOnly
        className={className}
        renderElement={(props) => {
          const Element = components[props.element.type] || components.p;
          return <Element {...props} />;
        }}
        // renderLeaf={(props) => {
        //   const Leaf = components[props.leaf.type] || components.span;
        //   return <Leaf {...props} />;
        // }}
      />
    </Plate>
  );
}

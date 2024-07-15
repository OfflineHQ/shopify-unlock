"use client";

import type { DropTargetMonitor } from "react-dnd";

import { cn, withRef } from "@udecode/cn";
import {
  type ClassNames,
  type PlateElementProps,
  type TEditor,
  type TElement,
  useEditorRef,
  useElement,
} from "@udecode/plate-common";
import {
  type DragItemNode,
  useDraggable,
  useDraggableState,
} from "@udecode/plate-dnd";
import { blockSelectionActions } from "@udecode/plate-selection";

import { Icons } from "../icons";

import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "./tooltip";

export interface DraggableProps
  extends PlateElementProps,
    ClassNames<{
      /** Block. */
      block: string;

      /** Block and gutter. */
      blockAndGutter: string;

      /** Block toolbar in the gutter. */
      blockToolbar: string;

      /**
       * Block toolbar wrapper in the gutter left. It has the height of a line
       * of the block.
       */
      blockToolbarWrapper: string;

      blockWrapper: string;

      /** Button to dnd the block, in the block toolbar. */
      dragHandle: string;

      /** Icon of the drag button, in the drag icon. */
      dragIcon: string;

      /** Show a dropline above or below the block when dragging a block. */
      dropLine: string;

      /** Gutter at the left side of the editor. It has the height of the block */
      gutterLeft: string;
    }> {
  /**
   * Intercepts the drop handling. If `false` is returned, the default drop
   * behavior is called after. If `true` is returned, the default behavior is
   * not called.
   */
  onDropHandler?: (
    editor: TEditor,
    props: {
      dragItem: DragItemNode;
      id: string;
      monitor: DropTargetMonitor<DragItemNode, unknown>;
      nodeRef: any;
    },
  ) => boolean;
}

const DragHandle = () => {
  const editor = useEditorRef();
  const element = useElement<TElement>();

  return (
    <Tooltip>
      <TooltipTrigger type="button">
        <Icons.dragHandle
          className="offline-size-4 offline-text-muted-foreground"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();

            // if (element.id) {
            //   blockSelectionActions.addSelectedRow(element.id as string);
            //   blockContextMenuActions.show(editor.id, event as any);
            // }
          }}
          onMouseDown={() => {
            blockSelectionActions.resetSelectedIds();
          }}
        />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>Drag to move</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export const Draggable = withRef<"div", DraggableProps>(
  ({ className, classNames = {}, onDropHandler, ...props }, ref) => {
    const { children, element } = props;

    const state = useDraggableState({ element, onDropHandler });
    const { dropLine, isDragging, isHovered } = state;
    const {
      droplineProps,
      groupProps,
      gutterLeftProps,
      handleRef,
      previewRef,
    } = useDraggable(state);

    return (
      <div
        className={cn(
          "offline-relative",
          isDragging && "offline-opacity-50",
          "offline-group",
          className,
        )}
        ref={ref}
        {...groupProps}
      >
        <div
          className={cn(
            "offline-pointer-events-none offline-absolute offline--top-px offline-z-50 offline-flex offline-h-full offline--translate-x-full offline-cursor-text offline-opacity-0 group-hover:offline-opacity-100",
            classNames.gutterLeft,
          )}
          {...gutterLeftProps}
        >
          <div
            className={cn(
              "offline-flex offline-h-[1.5em]",
              classNames.blockToolbarWrapper,
            )}
          >
            <div
              className={cn(
                "offline-pointer-events-auto offline-mr-1 offline-flex offline-items-center",
                classNames.blockToolbar,
              )}
            >
              <div
                className="offline-size-4"
                data-key={element.id as string}
                ref={handleRef}
              >
                {isHovered && <DragHandle />}
              </div>
            </div>
          </div>
        </div>

        <div className={classNames.blockWrapper} ref={previewRef}>
          {children}

          {!!dropLine && (
            <div
              className={cn(
                "offline-absolute offline-inset-x-0 offline-h-0.5 offline-opacity-100",
                "offline-bg-ring",
                dropLine === "top" && "offline--top-px",
                dropLine === "bottom" && "offline--bottom-px",
                classNames.dropLine,
              )}
              {...droplineProps}
            />
          )}
        </div>
      </div>
    );
  },
);
import React, { useEffect } from "react";

import {
  isSelectionExpanded,
  useEditorSelector,
  useElement,
  useRemoveNodeButton,
} from "@udecode/plate-common";
import {
  FloatingMedia as FloatingMediaPrimitive,
  floatingMediaActions,
  useFloatingMediaSelectors,
} from "@udecode/plate-media";
import { useReadOnly, useSelected } from "slate-react";

import { Icons } from "../icons";

import { Button, buttonVariants } from "./button";
import { CaptionButton } from "./caption";
import { inputVariants } from "./input";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { Separator } from "./separator";

export interface MediaPopoverProps {
  children: React.ReactNode;
  pluginKey?: string;
}

export function MediaPopover({ children, pluginKey }: MediaPopoverProps) {
  const readOnly = useReadOnly();
  const selected = useSelected();

  const selectionCollapsed = useEditorSelector(
    (editor) => !isSelectionExpanded(editor),
    [],
  );
  const isOpen = !readOnly && selected && selectionCollapsed;
  const isEditing = useFloatingMediaSelectors().isEditing();

  useEffect(() => {
    if (!isOpen && isEditing) {
      floatingMediaActions.isEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const element = useElement();
  const { props: buttonProps } = useRemoveNodeButton({ element });

  if (readOnly) return <>{children}</>;

  return (
    <Popover modal={false} open={isOpen}>
      <PopoverAnchor>{children}</PopoverAnchor>

      <PopoverContent
        className="offline-w-auto offline-p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isEditing ? (
          <div className="offline-flex offline-w-[330px] offline-flex-col">
            <div className="offline-flex offline-items-center">
              <div className="offline-flex offline-items-center offline-pl-3 offline-text-muted-foreground">
                <Icons.link className="offline-size-4" />
              </div>

              <FloatingMediaPrimitive.UrlInput
                className={inputVariants({ h: "sm", variant: "ghost" })}
                options={{
                  pluginKey,
                }}
                placeholder="Paste the embed link..."
              />
            </div>
          </div>
        ) : (
          <div className="offline-box-content offline-flex offline-h-9 offline-items-center offline-gap-1">
            <FloatingMediaPrimitive.EditButton
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              Edit link
            </FloatingMediaPrimitive.EditButton>

            <CaptionButton variant="ghost">Caption</CaptionButton>

            <Separator className="offline-my-1" orientation="vertical" />

            <Button size="sms" variant="ghost" {...buttonProps}>
              <Icons.delete className="offline-size-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

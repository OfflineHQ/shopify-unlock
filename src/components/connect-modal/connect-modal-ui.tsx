import {
  DialogClose,
  type DialogPortalProps,
  type DialogProps,
} from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "../ui/drawer";

import { type Value } from "@udecode/plate-common";
import { PlateViewer } from "../plate-ui/plate-viewer";

export interface ConnectModalUIProps
  extends DialogProps,
    Pick<DialogPortalProps, "container"> {
  content: Value;
  cta: React.ReactNode;
  closeText: string;
  closeBtnClasses?: string;
  isDesktop?: boolean;
}

export default function ConnectModalUI({
  content,
  container,
  closeBtnClasses,
  cta,
  isDesktop,
  closeText,
  ...dialogProps
}: ConnectModalUIProps) {
  if (isDesktop) {
    return (
      <Dialog {...dialogProps}>
        <DialogContent
          className="offline-max-w-[48rem]"
          container={container}
          style={{ maxWidth: "448px" }}
        >
          <DialogTitle className="offline-sr-only">sign up</DialogTitle>
          <PlateViewer value={content} />
          <DialogFooter className="offline-flex offline-flex-col offline-gap-4">
            <DialogClose className={closeBtnClasses}>{closeText}</DialogClose>
            {cta}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...dialogProps}>
      <DrawerContent container={container}>
        <DrawerTitle className="offline-sr-only">sign up</DrawerTitle>
        <PlateViewer className="offline-px-4" value={content} />
        <DrawerFooter>
          {cta}
          <DrawerClose className={closeBtnClasses}>{closeText}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

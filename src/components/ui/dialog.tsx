import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { Pick } from "@prisma/client/runtime/library";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "offline-dialog-overlay offline-fixed offline-inset-0 offline-z-50 offline-bg-black/80 offline-data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 offline-w-full offline-h-full",
      className,
    )}
    // fixing an issue where overlay not displayed in storefront
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      display: "block",
    }}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    Pick<DialogPrimitive.DialogPortalProps, "container">
>(({ className, children, container, ...props }, ref) => (
  <DialogPortal container={container}>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "offline-fixed offline-left-[50%] offline-top-[50%] offline-z-50 offline-grid offline-w-full offline-max-w-lg offline-translate-x-[-50%] offline-translate-y-[-50%] offline-gap-4 offline-border offline-bg-background offline-p-6 offline-shadow-lg offline-duration-200 data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 data-[state=closed]:offline-zoom-out-95 data-[state=open]:offline-zoom-in-95 data-[state=closed]:offline-slide-out-to-left-1/2 data-[state=closed]:offline-slide-out-to-top-[48%] data-[state=open]:offline-slide-in-from-left-1/2 data-[state=open]:offline-slide-in-from-top-[48%] sm:offline-rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="offline-border-none offline-bg-transparent offline-cursor-pointer offline-absolute offline-right-4 offline-top-4 offline-opacity-70 offline-ring-offset-background offline-transition-opacity hover:offline-opacity-100 focus:offline-outline-none focus:offline-ring-2 focus:offline-ring-ring focus:offline-ring-offset-2 disabled:offline-pointer-events-none data-[state=open]:offline-bg-accent data-[state=open]:offline-text-muted-foreground">
        <X style={{ height: "30px", width: "30px" }} />
        <span className="offline-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "offline-flex offline-flex-col offline-space-y-1.5 offline-text-center sm:offline-text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "offline-flex offline-flex-col-reverse sm:offline-flex-row sm:offline-justify-end sm:offline-space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("offline-text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

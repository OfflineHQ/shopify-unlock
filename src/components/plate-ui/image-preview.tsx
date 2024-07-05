import { cn, createPrimitiveComponent } from "@udecode/cn";
import {
  PreviewImage,
  useImagePreview,
  useImagePreviewState,
  useScaleInput,
  useScaleInputState,
} from "@udecode/plate-media";
import { cva } from "class-variance-authority";

import { Icons } from "../icons";

const toolButtonVariants = cva(
  "offline-rounded offline-bg-[rgba(0,0,0,0.5)] offline-px-1",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "offline-text-white",
        disabled: "offline-cursor-not-allowed offline-text-gray-400",
      },
    },
  },
);

const ScaleInput = createPrimitiveComponent("input")({
  propsHook: useScaleInput,
  stateHook: useScaleInputState,
});

const SCROLL_SPEED = 4;

export const ImagePreview = () => {
  const state = useImagePreviewState({ scrollSpeed: SCROLL_SPEED });

  const {
    closeProps,
    currentUrlIndex,
    maskLayerProps,
    nextDisabled,
    nextProps,
    prevDisabled,
    prevProps,
    scaleTextProps,
    zommOutProps,
    zoomInDisabled,
    zoomInProps,
    zoomOutDisabled,
  } = useImagePreview(state);

  const { isOpen, scale } = state;

  return (
    <div
      className={cn(
        "offline-fixed offline-left-0 offline-top-0 offline-z-50 offline-h-screen offline-w-screen",
        !isOpen && "offline-hidden",
      )}
      {...maskLayerProps}
    >
      <div className="offline-absolute offline-inset-0 offline-size-full offline-bg-black offline-opacity-30"></div>
      <div className="offline-absolute offline-inset-0 offline-size-full offline-bg-black offline-opacity-30"></div>
      <div className="offline-absolute offline-inset-0 offline-flex offline-items-center offline-justify-center ">
        <div className="offline-relative offline-flex offline-max-h-screen offline-w-full offline-items-center">
          <PreviewImage
            className={cn(
              "offline-mx-auto offline-block offline-max-h-[calc(100vh-4rem)] offline-w-auto offline-object-contain offline-transition-transform",
            )}
          />
          <div
            className="offline-absolute offline-bottom-0 offline-left-1/2 offline-z-40 offline-flex offline-w-fit offline--translate-x-1/2 offline-justify-center offline-gap-4 offline-p-2 offline-text-center offline-text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="offline-flex offline-gap-1 ">
              <button
                {...prevProps}
                className={cn(
                  toolButtonVariants({
                    variant: prevDisabled ? "disabled" : "default",
                  }),
                )}
                type="button"
              >
                <Icons.arrowLeft className="offline-size-5" />
              </button>
              {(currentUrlIndex ?? 0) + 1}
              <button
                {...nextProps}
                className={cn(
                  toolButtonVariants({
                    variant: nextDisabled ? "disabled" : "default",
                  }),
                )}
                type="button"
              >
                <Icons.arrowRight className="offline-size-5" />
              </button>
            </div>
            <div className="offline-flex ">
              <button
                className={cn(
                  toolButtonVariants({
                    variant: zoomOutDisabled ? "disabled" : "default",
                  }),
                )}
                {...zommOutProps}
                type="button"
              >
                <Icons.minus className="offline-size-4" />
              </button>
              <div className="offline-mx-px">
                {state.isEditingScale ? (
                  <>
                    <ScaleInput className="offline-w-10 offline-rounded offline-px-1 offline-text-slate-500 offline-outline" />{" "}
                    <span>%</span>
                  </>
                ) : (
                  <span {...scaleTextProps}>{scale * 100 + "%"}</span>
                )}
              </div>
              <button
                className={cn(
                  toolButtonVariants({
                    variant: zoomInDisabled ? "disabled" : "default",
                  }),
                )}
                {...zoomInProps}
                type="button"
              >
                <Icons.add className="offline-size-4" />
              </button>
            </div>
            {/* TODO: downLoad the image */}
            <button className={cn(toolButtonVariants())} type="button">
              <Icons.downLoad className="offline-size-4" />
            </button>
            <button
              {...closeProps}
              className={cn(toolButtonVariants())}
              type="button"
            >
              <Icons.close className="offline-size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

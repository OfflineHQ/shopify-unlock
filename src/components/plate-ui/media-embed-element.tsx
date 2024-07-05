import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { cn, withRef } from "@udecode/cn";
import { PlateElement, withHOC } from "@udecode/plate-common";
import {
  ELEMENT_MEDIA_EMBED,
  parseTwitterUrl,
  parseVideoUrl,
  useMediaState,
} from "@udecode/plate-media";
import { ResizableProvider, useResizableStore } from "@udecode/plate-resizable";
import { Caption, CaptionTextarea } from "./caption";
import { MediaPopover } from "./media-popover";
import {
  Resizable,
  ResizeHandle,
  mediaResizeHandleVariants,
} from "./resizable";

export const MediaEmbedElement = withHOC(
  ResizableProvider,
  withRef<typeof PlateElement>(({ children, className, ...props }, ref) => {
    const {
      align = "center",
      embed,
      focused,
      isVideo,
      isYoutube,
      readOnly,
      selected,
    } = useMediaState({
      urlParsers: [parseTwitterUrl, parseVideoUrl],
    });
    const width = useResizableStore().get.width();
    const provider = embed?.provider;

    return (
      <MediaPopover pluginKey={ELEMENT_MEDIA_EMBED}>
        <PlateElement
          className={cn("offline-relative offline-py-2.5", className)}
          ref={ref}
          {...props}
        >
          <figure
            className="offline-group offline-relative offline-m-0 offline-w-full"
            contentEditable={false}
          >
            <Resizable
              align={align}
              options={{
                align,
                maxWidth: "100%",
                minWidth: 100,
              }}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: "left" })}
                options={{ direction: "left" }}
              />

              {isVideo ? (
                isYoutube ? (
                  <LiteYouTubeEmbed
                    id={embed!.id!}
                    title="youtube"
                    wrapperClass={cn(
                      "offline-rounded-sm",
                      focused &&
                        selected &&
                        "offline-ring-2 offline-ring-ring offline-ring-offset-2",
                      "offline-relative offline-block offline-cursor-pointer offline-bg-black offline-bg-cover offline-bg-center [contain:content]",
                      "[&.lyt-activated]:before:offline-absolute [&.lyt-activated]:before:offline-top-0 [&.lyt-activated]:before:offline-h-[60px] [&.lyt-activated]:before:offline-w-full [&.lyt-activated]:before:offline-bg-top [&.lyt-activated]:before:offline-bg-repeat-x [&.lyt-activated]:before:offline-pb-[50px] [&.lyt-activated]:before:offline-[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]",
                      "[&.lyt-activated]:before:offline-bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==)]",
                      'offline-after:offline-block offline-after:offline-pb-[var(--aspect-ratio)] offline-after:offline-content-[""]',
                      "[&_>_iframe]:offline-absolute [&_>_iframe]:offline-left-0 [&_>_iframe]:offline-top-0 [&_>_iframe]:offline-size-full",
                      "[&_>_.lty-playbtn]:offline-z-[1] [&_>_.lty-playbtn]:offline-h-[46px] [&_>_.lty-playbtn]:offline-w-[70px] [&_>_.lty-playbtn]:offline-rounded-[14%] [&_>_.lty-playbtn]:offline-bg-[#212121] [&_>_.lty-playbtn]:offline-opacity-80 [&_>_.lty-playbtn]:offline-[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]",
                      "[&:hover_>_.lty-playbtn]:offline-bg-[red] [&:hover_>_.lty-playbtn]:offline-opacity-100",
                      '[&_>_.lty-playbtn]:before:offline-border-y-[11px] [&_>_.lty-playbtn]:before:offline-border-l-[19px] [&_>_.lty-playbtn]:before:offline-border-r-0 [&_>_.lty-playbtn]:before:offline-border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:offline-content-[""]',
                      "[&_>_.lty-playbtn]:offline-absolute [&_>_.lty-playbtn]:offline-left-1/2 [&_>_.lty-playbtn]:offline-top-1/2 [&_>_.lty-playbtn]:offline-[transform:translate3d(-50%,-50%,0)]",
                      "[&_>_.lty-playbtn]:before:offline-absolute [&_>_.lty-playbtn]:before:offline-left-1/2 [&_>_.lty-playbtn]:before:offline-top-1/2 [&_>_.lty-playbtn]:before:offline-[transform:translate3d(-50%,-50%,0)]",
                      "[&.lyt-activated]:offline-cursor-[unset]",
                      "[&.lyt-activated]:before:offline-pointer-events-none [&.lyt-activated]:before:offline-opacity-0",
                      "[&.lyt-activated_>_.lty-playbtn]:offline-pointer-events-none [&.lyt-activated_>_.lty-playbtn]:offline-!opacity-0",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      provider === "vimeo" && "offline-pb-[75%]",
                      provider === "youku" && "offline-pb-[56.25%]",
                      provider === "dailymotion" && "offline-pb-[56.0417%]",
                      provider === "coub" && "offline-pb-[51.25%]",
                    )}
                  >
                    <iframe
                      allowFullScreen
                      className={cn(
                        "offline-absolute offline-left-0 offline-top-0 offline-size-full offline-rounded-sm",
                        isVideo && "offline-border-0",
                        focused &&
                          selected &&
                          "offline-ring-2 offline-ring-ring offline-ring-offset-2",
                      )}
                      src={embed!.url}
                      title="embed"
                    />
                  </div>
                )
              ) : null}

              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: "right" })}
                options={{ direction: "right" }}
              />
            </Resizable>

            <Caption align={align} style={{ width }}>
              <CaptionTextarea placeholder="Write a caption..." />
            </Caption>
          </figure>

          {children}
        </PlateElement>
      </MediaPopover>
    );
  }),
);

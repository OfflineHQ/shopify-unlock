"use client";

import { withProps } from "@udecode/cn";
import { createAlignPlugin } from "@udecode/plate-alignment";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import {
  createExitBreakPlugin,
  createSoftBreakPlugin,
} from "@udecode/plate-break";
import {
  createPlugins,
  Plate,
  PlateElement,
  PlateLeaf,
  type Value,
} from "@udecode/plate-common";
import {
  createFontBackgroundColorPlugin,
  createFontColorPlugin,
  createFontSizePlugin,
} from "@udecode/plate-font";
import {
  createHeadingPlugin,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
} from "@udecode/plate-heading";
import {
  createHorizontalRulePlugin,
  ELEMENT_HR,
} from "@udecode/plate-horizontal-rule";
import { createIndentPlugin } from "@udecode/plate-indent";
import { createLineHeightPlugin } from "@udecode/plate-line-height";
import {
  createListPlugin,
  ELEMENT_LI,
  ELEMENT_OL,
  ELEMENT_UL,
} from "@udecode/plate-list";
import { createNodeIdPlugin } from "@udecode/plate-node-id";
import {
  createParagraphPlugin,
  ELEMENT_PARAGRAPH,
} from "@udecode/plate-paragraph";
import { createResetNodePlugin } from "@udecode/plate-reset-node";
import { createDeletePlugin } from "@udecode/plate-select";
import { createBlockSelectionPlugin } from "@udecode/plate-selection";
import { createDeserializeDocxPlugin } from "@udecode/plate-serializer-docx";
import { createTabbablePlugin } from "@udecode/plate-tabbable";
import { createTrailingBlockPlugin } from "@udecode/plate-trailing-block";
import { HTML5Backend } from "react-dnd-html5-backend";

import { createCaptionPlugin } from "@udecode/plate-caption";
import { createDndPlugin } from "@udecode/plate-dnd";
import {
  createImagePlugin,
  createMediaEmbedPlugin,
  ELEMENT_IMAGE,
  ELEMENT_MEDIA_EMBED,
} from "@udecode/plate-media";
import { DndProvider } from "react-dnd";
import { Editor } from "./editor";
import { FixedToolbar } from "./fixed-toolbar";
import { FixedToolbarButtons } from "./fixed-toolbar-buttons";
import { FloatingToolbar } from "./floating-toolbar";
import { FloatingToolbarButtons } from "./floating-toolbar-buttons";
import { HeadingElement } from "./heading-element";
import { HrElement } from "./hr-element";
import { ImageElement } from "./image-element";
import { ImagePreview } from "./image-preview";
import { ListElement } from "./list-element";
import { MediaEmbedElement } from "./media-embed-element";
import { ParagraphElement } from "./paragraph-element";
import { withPlaceholders } from "./placeholder";
import { withDraggables } from "./with-draggables";

export const plugins = createPlugins(
  [
    createParagraphPlugin(),
    createHeadingPlugin(),
    createHorizontalRulePlugin(),
    createListPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createFontColorPlugin(),
    createFontBackgroundColorPlugin(),
    createFontSizePlugin(),
    createAlignPlugin({
      inject: {
        props: {
          validTypes: [
            ELEMENT_PARAGRAPH,
            ELEMENT_H1,
            ELEMENT_H2,
            ELEMENT_H3,
            ELEMENT_IMAGE,
            ELEMENT_MEDIA_EMBED,
          ],
        },
      },
    }),
    createIndentPlugin({
      inject: {
        props: {
          validTypes: [
            ELEMENT_PARAGRAPH,
            ELEMENT_H1,
            ELEMENT_H2,
            ELEMENT_H3,
            ELEMENT_IMAGE,
            ELEMENT_MEDIA_EMBED,
          ],
        },
      },
    }),
    createLineHeightPlugin({
      inject: {
        props: {
          defaultNodeValue: 1.5,
          validNodeValues: [1, 1.2, 1.5, 2, 3],
          validTypes: [ELEMENT_PARAGRAPH, ELEMENT_H1, ELEMENT_H2, ELEMENT_H3],
        },
      },
    }),
    createAutoformatPlugin({
      options: {
        rules: [
          // Usage: https://platejs.org/docs/autoformat
        ],
        enableUndoOnDelete: true,
      },
    }),
    createBlockSelectionPlugin({
      options: {
        sizes: {
          top: 0,
          bottom: 0,
        },
      },
    }),
    //     createEmojiPlugin(), // TODO: wait for this issue to be fixed: https://github.com/udecode/plate/issues/3320
    createExitBreakPlugin({
      options: {
        rules: [
          {
            hotkey: "mod+enter",
          },
          {
            hotkey: "mod+shift+enter",
            before: true,
          },
          {
            hotkey: "enter",
            query: {
              start: true,
              end: true,
              // allow: KEYS_HEADING,
            },
            relative: true,
            level: 1,
          },
        ],
      },
    }),
    createNodeIdPlugin(),
    createDndPlugin({ options: { enableScroller: true } }),
    createResetNodePlugin({
      options: {
        rules: [
          // Usage: https://platejs.org/docs/reset-node
        ],
      },
    }),
    createDeletePlugin(),
    createSoftBreakPlugin({
      options: {
        rules: [
          { hotkey: "shift+enter" },
          {
            hotkey: "enter",
            query: {
              allow: [
                // ELEMENT_CODE_BLOCK, ELEMENT_BLOCKQUOTE, ELEMENT_TD
              ],
            },
          },
        ],
      },
    }),
    createTabbablePlugin(),
    createTrailingBlockPlugin({
      options: { type: ELEMENT_PARAGRAPH },
    }),
    createDeserializeDocxPlugin(),
    createImagePlugin({
      enabled: true,
      renderAfterEditable: ImagePreview,
    }),
    createMediaEmbedPlugin({ enabled: true }),
    createCaptionPlugin({ enabled: true }),
  ],
  {
    components: withDraggables(
      withPlaceholders({
        [ELEMENT_HR]: HrElement,
        [ELEMENT_H1]: withProps(HeadingElement, { variant: "h1" }),
        [ELEMENT_H2]: withProps(HeadingElement, { variant: "h2" }),
        [ELEMENT_H3]: withProps(HeadingElement, { variant: "h3" }),
        [ELEMENT_H4]: withProps(HeadingElement, { variant: "h4" }),
        [ELEMENT_H5]: withProps(HeadingElement, { variant: "h5" }),
        [ELEMENT_H6]: withProps(HeadingElement, { variant: "h6" }),
        [ELEMENT_UL]: withProps(ListElement, { variant: "ul" }),
        [ELEMENT_OL]: withProps(ListElement, { variant: "ol" }),
        [ELEMENT_LI]: withProps(PlateElement, { as: "li" }),
        [ELEMENT_PARAGRAPH]: ParagraphElement,
        [MARK_BOLD]: withProps(PlateLeaf, { as: "strong" }),
        [MARK_ITALIC]: withProps(PlateLeaf, { as: "em" }),
        [MARK_UNDERLINE]: withProps(PlateLeaf, { as: "u" }),
        [ELEMENT_IMAGE]: ImageElement,
        [ELEMENT_MEDIA_EMBED]: MediaEmbedElement,
      }),
    ),
  },
);

export function PlateEditor({
  value,
  onChange,
  className,
}: {
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Plate plugins={plugins} initialValue={value} onChange={onChange}>
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>

        <Editor className={className} />

        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      </Plate>
    </DndProvider>
  );
}

import { withProps } from "@udecode/cn";
import {
  MARK_BOLD,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_SUBSCRIPT,
  MARK_SUPERSCRIPT,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import {
  PlateElement,
  PlateLeaf,
  type PlatePluginComponent,
} from "@udecode/plate-common";
import {
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
} from "@udecode/plate-heading";
import { ELEMENT_HR } from "@udecode/plate-horizontal-rule";
import { ELEMENT_LI, ELEMENT_OL, ELEMENT_UL } from "@udecode/plate-list";
import { ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED } from "@udecode/plate-media";
import { ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import { HeadingElement } from "./heading-element";
import { HrElement } from "./hr-element";
import { ImageElement } from "./image-element";
import { ListElement } from "./list-element";
import { MediaEmbedElement } from "./media-embed-element";
import { ParagraphElement } from "./paragraph-element";
import { withPlaceholders } from "./placeholder";
import { withDraggables } from "./with-draggables";

export const createPlateUI = (
  overrideByKey?: Partial<Record<string, PlatePluginComponent>>,
  {
    draggable,
    placeholder,
  }: { draggable?: boolean; placeholder?: boolean } = {},
) => {
  let components: Record<string, PlatePluginComponent> = {
    [ELEMENT_H1]: withProps(HeadingElement, { variant: "h1" }),
    [ELEMENT_H2]: withProps(HeadingElement, { variant: "h2" }),
    [ELEMENT_H3]: withProps(HeadingElement, { variant: "h3" }),
    [ELEMENT_H4]: withProps(HeadingElement, { variant: "h4" }),
    [ELEMENT_H5]: withProps(HeadingElement, { variant: "h5" }),
    [ELEMENT_H6]: withProps(HeadingElement, { variant: "h6" }),
    [ELEMENT_HR]: HrElement,
    [ELEMENT_IMAGE]: ImageElement,
    [ELEMENT_LI]: withProps(PlateElement, { as: "li" }),
    [ELEMENT_MEDIA_EMBED]: MediaEmbedElement,
    [ELEMENT_OL]: withProps(ListElement, { variant: "ol" }),
    [ELEMENT_PARAGRAPH]: ParagraphElement,
    [ELEMENT_UL]: withProps(ListElement, { variant: "ul" }),
    [MARK_BOLD]: withProps(PlateLeaf, { as: "strong" }),
    [MARK_ITALIC]: withProps(PlateLeaf, { as: "em" }),
    [MARK_STRIKETHROUGH]: withProps(PlateLeaf, { as: "s" }),
    [MARK_SUBSCRIPT]: withProps(PlateLeaf, { as: "sub" }),
    [MARK_SUPERSCRIPT]: withProps(PlateLeaf, { as: "sup" }),
    [MARK_UNDERLINE]: withProps(PlateLeaf, { as: "u" }),
  };

  if (overrideByKey) {
    Object.keys(overrideByKey).forEach((key) => {
      (components as any)[key] = (overrideByKey as any)[key];
    });
  }
  if (placeholder) {
    components = withPlaceholders(components);
  }
  if (draggable) {
    components = withDraggables(components);
  }

  return components;
};

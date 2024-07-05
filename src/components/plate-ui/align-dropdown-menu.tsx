"use client";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

import {
  useAlignDropdownMenu,
  useAlignDropdownMenuState,
} from "@udecode/plate-alignment";

import { Icons } from "../icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  useOpenState,
} from "./dropdown-menu";
import { ToolbarButton } from "./toolbar";

const items = [
  {
    icon: Icons.alignLeft,
    value: "left",
  },
  {
    icon: Icons.alignCenter,
    value: "center",
  },
  {
    icon: Icons.alignRight,
    value: "right",
  },
  {
    icon: Icons.alignJustify,
    value: "justify",
  },
];

export function AlignDropdownMenu({ children, ...props }: DropdownMenuProps) {
  const state = useAlignDropdownMenuState();
  const { radioGroupProps } = useAlignDropdownMenu(state);

  const openState = useOpenState();
  const IconValue =
    items.find((item) => item.value === radioGroupProps.value)?.icon ??
    Icons.alignLeft;

  return (
    <DropdownMenu modal={false} {...openState} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={openState.open} tooltip="Align">
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="offline-min-w-0">
        <DropdownMenuRadioGroup
          className="offline-flex offline-flex-col offline-gap-0.5"
          {...radioGroupProps}
        >
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              value={itemValue}
              className="offline-pl-2"
            >
              <Icon className="offline-mr-2 offline-size-5" />
              {itemValue}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

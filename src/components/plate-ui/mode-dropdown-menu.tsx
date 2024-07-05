import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

import {
  focusEditor,
  useEditorReadOnly,
  useEditorRef,
  usePlateStore,
} from "@udecode/plate-common";

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

export function ModeDropdownMenu(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const setReadOnly = usePlateStore().set.readOnly();
  const readOnly = useEditorReadOnly();
  const openState = useOpenState();

  let value = "editing";

  if (readOnly) value = "viewing";

  const item: any = {
    editing: (
      <>
        <Icons.editing className="offline-mr-2 offline-size-5" />
        <span className="offline-hidden lg:offline-inline">Editing</span>
      </>
    ),
    viewing: (
      <>
        <Icons.viewing className="offline-mr-2 offline-size-5" />
        <span className="offline-hidden lg:offline-inline">Viewing</span>
      </>
    ),
  };

  return (
    <DropdownMenu modal={false} {...openState} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="offline-min-w-[auto] lg:offline-min-w-[130px]"
          isDropdown
          pressed={openState.open}
          tooltip="Editing mode"
        >
          {item[value]}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="offline-min-w-[180px]">
        <DropdownMenuRadioGroup
          className="offline-flex offline-flex-col offline-gap-0.5"
          onValueChange={(newValue) => {
            if (newValue !== "viewing") {
              setReadOnly(false);
            }
            if (newValue === "viewing") {
              setReadOnly(true);

              return;
            }
            if (newValue === "editing") {
              focusEditor(editor);

              return;
            }
          }}
          value={value}
        >
          <DropdownMenuRadioItem value="editing">
            {item.editing}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="viewing">
            {item.viewing}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { ActionList, Button, Popover } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ViewIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { ActionsEnum } from "./types";

interface CampaignRowActionsProps {
  campaignId: string;
  handleAction: (campaignId: string, action: ActionsEnum) => void;
}

export function CampaignRowActions({
  campaignId,
  handleAction,
}: CampaignRowActionsProps) {
  const [active, setActive] = useState(false);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const activator = (
    <Button onClick={toggleActive} disclosure>
      Select an action
    </Button>
  );

  return (
    <Popover
      active={active}
      activator={activator}
      autofocusTarget="first-node"
      onClose={toggleActive}
      preferredAlignment="right"
      activatorWrapper="span"
    >
      <ActionList
        actionRole="menuitem"
        items={[
          {
            icon: EditIcon,
            content: "Edit campaign",
            onAction: () => handleAction(campaignId, ActionsEnum.EditCampaign),
          },
          {
            icon: ViewIcon,
            content: "View campaign",
            onAction: () => handleAction(campaignId, ActionsEnum.ViewCampaign),
          },
          {
            icon: DeleteIcon,
            destructive: true,
            content: "Delete campaign",
            onAction: () =>
              handleAction(campaignId, ActionsEnum.DeleteCampaign),
          },
        ]}
      />
    </Popover>
  );
}

import {
  Toolbar,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@/components/plate-ui/toolbar";
import { Text } from "@shopify/polaris";
import { Monitor, Smartphone, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ViewportPreviewProps {
  children?: React.ReactNode;
  setContainer: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>;
  onViewportChange?: (viewport: string) => void;
  initialViewport?: string;
}

export const viewports = [
  {
    id: "mobile",
    icon: <Smartphone />,
    label: "Mobile view",
    width: 375,
    height: 667,
  },
  {
    id: "desktop",
    icon: <Monitor />,
    label: "Desktop view",
    width: 1440,
    height: 900,
  },
];

const Preview: React.FC<ViewportPreviewProps> = ({
  children,
  setContainer,
  onViewportChange,
  initialViewport = "mobile",
}) => {
  const [selectedViewport, setSelectedViewport] =
    useState<string>(initialViewport);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    onViewportChange?.(selectedViewport);
  }, [selectedViewport, onViewportChange]);

  const handleViewportChange = (value: string) => {
    if (value && value !== selectedViewport) {
      setSelectedViewport(value);
      if (value === "desktop") {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    }
  };

  const closeFullscreen = () => {
    setSelectedViewport("mobile");
    setIsFullscreen(false);
  };

  const currentViewport =
    viewports.find((v) => v.id === selectedViewport) || viewports[0];

  const scale = isFullscreen ? 1 : selectedViewport === "mobile" ? 1 : 0.75;

  return (
    <div>
      <Toolbar className="offline-mb-4">
        <Text as="h3" variant="headingMd">
          Preview
        </Text>
        <ToolbarToggleGroup
          className="offline-mx-2"
          type="single"
          value={selectedViewport}
          onValueChange={handleViewportChange}
        >
          {viewports.map((viewport) => (
            <ToolbarToggleItem
              size="lg"
              className="offline-mx-1"
              key={viewport.id}
              value={viewport.id}
              aria-label={viewport.label}
            >
              {viewport.icon}
            </ToolbarToggleItem>
          ))}
        </ToolbarToggleGroup>
      </Toolbar>

      <div
        className={`offline-border offline-rounded-lg offline-overflow-hidden ${
          isFullscreen
            ? "offline-fixed offline-inset-0 offline-z-[100] offline-flex offline-items-center offline-justify-center offline-bg-black offline-bg-opacity-80"
            : ""
        }`}
      >
        <div
          className="offline-bg-white"
          style={{
            width: currentViewport.width,
            height: currentViewport.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "auto",
          }}
        >
          <div className="offline-w-full offline-h-full" ref={setContainer}>
            {children}
          </div>
        </div>
        {isFullscreen && (
          <button
            onClick={closeFullscreen}
            className="offline-absolute offline-top-4 offline-right-4 offline-text-white offline-bg-black offline-bg-opacity-50 offline-p-2 offline-rounded-full"
          >
            <X size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Preview;

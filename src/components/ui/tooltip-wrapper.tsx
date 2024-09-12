"use client";

import { FolderHandleContext } from "@/context/folder-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useContext } from "react";

type Props = {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  Label: string;
};

export default function ToolTipWrapper({ children, Label, side }: Props) {
  const { settings } = useContext(FolderHandleContext);

  if (settings.EnableToolTip === false) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side ?? "left"}>
        <p>{Label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

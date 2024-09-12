import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ToolTipWrapper from "@/components/ui/tooltip-wrapper";
import { FolderHandleContext } from "@/context/folder-context";
import { useContext } from "react";

const NotAuthorized = () => (
  <Tooltip>
    <TooltipTrigger>
      <Badge
        className="text-center justify-center cursor-default select-none whitespace-nowrap"
        variant={"destructive"}
      >
        Access Not Authorized
      </Badge>
    </TooltipTrigger>
    <TooltipContent side="left">
      <p>Authorize a specific folder to begin.</p>
    </TooltipContent>
  </Tooltip>
);

const Authorized = ({ Handle }: { Handle: FileSystemDirectoryHandle }) => (
  <Tooltip>
    <TooltipTrigger>
      <Badge className="bg-green-500 text-white hover:bg-green-400 cursor-default select-none whitespace-nowrap">
        Access Authorized
      </Badge>
    </TooltipTrigger>
    <TooltipContent side="left">
      <p>Folder Authorized: {Handle.name}</p>
    </TooltipContent>
  </Tooltip>
);

export default function AuthorizationStatus() {
  const { handle } = useContext(FolderHandleContext);

  const message = handle
    ? `Folder Authorized: ${handle.name}`
    : "Access Not Authorized";

  return <>{handle ? <Authorized Handle={handle} /> : <NotAuthorized />}</>;
}

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NotAuthorized = () => (
  <Tooltip>
    <TooltipTrigger>
      <Badge
        className="text-center justify-center cursor-default select-none whitespace-nowrap hover:bg-destructive"
        variant={'destructive'}
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
      <Badge className="bg-green-500 text-white hover:bg-green-500 cursor-default select-none whitespace-nowrap">
        Access Authorized
      </Badge>
    </TooltipTrigger>
    <TooltipContent side="left">
      <p>Folder Authorized: {Handle.name}</p>
    </TooltipContent>
  </Tooltip>
);

export default function AuthorizationStatus({ handle }: { handle?: FileSystemDirectoryHandle }) {
  return <>{handle ? <Authorized Handle={handle} /> : <NotAuthorized />}</>;
}

import SessionDesignerForm from './views/session-designer-form';
import { KeySet } from '@/types/keyset';
import { SavedSettings } from '@/lib/dtos';
import { ApplicationSettingsTypes } from '@/types/settings';

export function SessionDesignerPage({
  Group,
  Individual,
  Evaluation,
  Conditions,
  Keysets,
  SessionParams,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
  Keysets: KeySet[];
  SessionParams: SavedSettings;
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
}) {
  return (
    <SessionDesignerForm
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Conditions={Conditions}
      Keysets={Keysets}
      SessionSettings={SessionParams}
      Settings={Settings}
      Handle={Handle}
    />
  );
}

import SessionRecorderInterface from './views/session-recorder-interface';
import { KeySet } from '@/types/keyset';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';

export default function SessionRecorderPage({
  Group,
  Individual,
  Evaluation,
  KeySetObject,
  SessionParams,
  Handle,
  ApplicationSettings,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  KeySetObject: KeySet;
  SessionParams: SavedSettings;
  Handle: FileSystemDirectoryHandle;
  ApplicationSettings: ApplicationSettingsTypes;
}) {
  return (
    <SessionRecorderInterface
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Settings={SessionParams}
      Keyset={KeySetObject}
      Handle={Handle}
      ApplicationSettings={ApplicationSettings}
    />
  );
}

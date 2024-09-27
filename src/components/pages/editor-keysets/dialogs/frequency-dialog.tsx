import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_ENTRY, is_key_already_assigned, PROTECTED_KEY_ENTRIES } from '@/lib/keys';
import { displayConditionalNotification } from '@/lib/notifications';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { PlusIcon } from 'lucide-react';
import { createRef, useContext, useState } from 'react';

type Props = {
  KeySet: KeySet;
  Callback: (key: KeySetInstance, type: 'Duration' | 'Frequency') => void;
};

export default function FrequencyDialogKeyCreator({ KeySet, Callback }: Props) {
  const { settings } = useContext(FolderHandleContext);
  const [keyInstance, setKeyInstance] = useState<KeySetInstance>(DEFAULT_ENTRY);
  const [show, setShow] = useState(false);
  const buttonRef = createRef<HTMLButtonElement>();

  return (
    <Dialog
      open={show}
      onOpenChange={(open) => {
        setShow(open);
        setKeyInstance(DEFAULT_ENTRY);
      }}
    >
      <div>
        <ToolTipWrapper Label="Add a new Frequency Key">
          <Button className="w-fit shadow" variant={'outline'} onClick={() => setShow(true)}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Key
          </Button>
        </ToolTipWrapper>
      </div>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Frequency Key Creator</DialogTitle>
          <DialogDescription>Set key and relevant description</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <p>Event to Record (e.g., Physical Aggression):</p>
          <Input
            className="mb-2"
            value={keyInstance.KeyDescription}
            onChange={(event) => {
              setKeyInstance({
                ...keyInstance,
                KeyDescription: event.target.value,
              });
            }}
          />

          <p>Key Capture (Note: Select and Press Key to Assign):</p>
          <Input
            className="mb-2"
            value={keyInstance.KeyName}
            onChange={() => {}}
            onKeyDownCapture={(event) => {
              if (event.shiftKey || event.ctrlKey) {
                event.preventDefault();

                displayConditionalNotification(
                  settings,
                  'Shift/Ctrl Keys Disabled',
                  `You cannot use the '${event.key}' key (i.e., no capitalization or alt. characters).`,
                  3000,
                  true
                );
                return;
              }

              if (is_key_already_assigned(KeySet, event.keyCode)) {
                event.preventDefault();

                displayConditionalNotification(
                  settings,
                  'Key is already assigned',
                  `You cannot use the '${event.key}' key because it is already assigned.`,
                  3000,
                  true
                );
                return;
              }

              if (event.key === 'Enter') {
                buttonRef.current?.click();

                return;
              }

              if (event.key === 'Escape') return;

              if (PROTECTED_KEY_ENTRIES.includes(event.key)) {
                event.preventDefault();

                displayConditionalNotification(
                  settings,
                  'Key is protected',
                  `You cannot use the '${event.key}' key in a keyset because that key is reserved.`,
                  3000,
                  true
                );
                return;
              }

              setKeyInstance({
                ...keyInstance,
                KeyCode: event.keyCode,
                KeyName: event.key,
              });
            }}
          />
        </div>

        <Button
          ref={buttonRef}
          onClick={() => {
            if (keyInstance.KeyDescription.trim().length < 2) {
              displayConditionalNotification(
                settings,
                'Key Description Too Short',
                'The key description must be at least 2 characters long.',
                3000,
                true
              );
              return;
            }
            if (keyInstance.KeyName.trim().length < 1) {
              displayConditionalNotification(
                settings,
                'The Key Captured is Invalid',
                'The key name must be at least 1 character long.',
                3000,
                true
              );
              return;
            }

            Callback(keyInstance, 'Frequency');

            setShow(false);
            setKeyInstance(DEFAULT_ENTRY);
          }}
        >
          Create Key
        </Button>
      </DialogContent>
    </Dialog>
  );
}

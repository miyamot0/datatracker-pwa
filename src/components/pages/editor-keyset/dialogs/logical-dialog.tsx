import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_ENTRY, is_key_already_assigned, PROTECTED_KEY_ENTRIES } from '@/lib/keys';
import { LogicalStep, LogicState, ValueSource } from '@/lib/logic/logic';
import { displayConditionalNotification } from '@/lib/notifications';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { PlusIcon } from 'lucide-react';
import { createRef, useContext, useState } from 'react';

type Props = {
  KeySet: KeySet;
  Callback: (key_set: KeySet, key: KeySetInstance, type: 'Duration' | 'Frequency') => void;
};

export default function LogicalDialogKeyCreator({ KeySet, Callback }: Props) {
  const { settings } = useContext(FolderHandleContext);
  //const [keyName, setKeyName] = useState<string>('');
  const [show, setShow] = useState(false);
  const buttonRef = createRef<HTMLButtonElement>();

  const [logicState, setLogicState] = useState({
    initial: { type: 'constant', value: 0 } as ValueSource,
    steps: [] as LogicalStep[],
    fields: [KeySet.FrequencyKeys, KeySet.DurationKeys].flat(),
    value: 0,
    name: '',
    id: 'test1',
  });

  const stringBuilderPre = logicState.steps.map((step) => {
    let operatorString = '';

    switch (step.operation) {
      case 'add':
        operatorString = ' += ';
        break;
      case 'subtract':
        operatorString = ' -= ';
        break;
      case 'multiply':
        operatorString = ' *= ';
        break;
      case 'divide':
        operatorString = ' /= ';
        break;
    }

    const operandStr =
      step.operand.type === 'constant' ? step.operand.value.toString() : step.operand.field.KeyDescription;
    return `${operatorString} ${operandStr}`;
  });

  return (
    <Dialog
      open={show}
      onOpenChange={(open) => {
        setShow(open);
        //setKeyInstance(DEFAULT_ENTRY);
      }}
    >
      <div>
        <ToolTipWrapper Label="Add a new Logical Key">
          <Button className="w-fit shadow" variant={'outline'} onClick={() => setShow(true)} size={'sm'}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Derived
          </Button>
        </ToolTipWrapper>
      </div>
      <DialogContent className="bg-card select-none">
        <DialogHeader>
          <DialogTitle>Logical Key Creator</DialogTitle>
          <DialogDescription>Set key and relevant description</DialogDescription>
        </DialogHeader>
        <div className="flex flex-row gap-4 justify-between items-center">
          <p>Name:</p>
          <Input
            className="mb-2"
            value={logicState.name}
            onChange={(event) => {
              setLogicState({ ...logicState, name: event.target.value });
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={() => {
              const newStep: LogicalStep = {
                id: `step${logicState.steps.length + 1}`,
                operation: 'add',
                operand: { type: 'constant', value: 0 },
              };
              setLogicState((prev) => ({
                ...prev,
                steps: [...prev.steps, newStep],
              }));
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" /> Add Step
          </Button>
          <div className="flex flex-1"></div>
          <Button
            ref={buttonRef}
            onClick={() => {
              if (logicState.name.trim().length < 2) {
                displayConditionalNotification(
                  settings,
                  'Key Description Too Short',
                  'The key description must be at least 2 characters long.',
                  3000,
                  true,
                );
                return;
              }

              //Callback(KeySet, keyInstance, 'Frequency');

              setShow(false);
              //setKeyInstance(DEFAULT_ENTRY);
            }}
          >
            Save Derived Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { LogicalStep, LogicState, Operation, OperationTypes, ValueSource, ValueSourceField } from '@/lib/logic/logic';
import { displayConditionalNotification } from '@/lib/notifications';
import { KeySet, KeySetLogical } from '@/types/keyset';
import { PlusIcon, Trash } from 'lucide-react';
import { createRef, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  KeySet: KeySet;
  Callback: (logic: LogicState) => void;
};

export default function LogicalDialogKeyCreator({ KeySet, Callback }: Props) {
  const { settings } = useContext(FolderHandleContext);
  const [show, setShow] = useState(false);
  const buttonRef = createRef<HTMLButtonElement>();

  const defaultEntry = {
    initial: { type: 'constant', value: 0 } as ValueSource,
    steps: [] as LogicalStep[],
    fields: [...KeySet.FrequencyKeys, ...KeySet.DurationKeys].map((key) => ({
      ...key,
      Value: 0,
      Tag: 'field.' + key.KeyDescription,
    })) as KeySetLogical[],
    value: 0,
    name: '',
    id: uuidv4(),
  } satisfies LogicState;

  const [logicState, setLogicState] = useState(defaultEntry);

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

  const stringBuilder = [
    logicState.initial.type === 'constant'
      ? logicState.initial.value.toString()
      : logicState.initial.field.KeyDescription,
    ...stringBuilderPre,
  ].join(' ');

  return (
    <Dialog
      open={show}
      onOpenChange={(open) => {
        setShow(open);
        setLogicState({
          ...defaultEntry,
          fields: [...KeySet.FrequencyKeys, ...KeySet.DurationKeys].map((key) => ({
            ...key,
            Value: 0,
            Tag: 'field.' + key.KeyDescription,
          })) as KeySetLogical[],
          id: uuidv4(),
        });
      }}
    >
      <div>
        <ToolTipWrapper Label="Add a new Logical Key">
          <Button className="w-fit shadow" variant={'outline'} onClick={() => setShow(true)} size={'sm'}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Derived
          </Button>
        </ToolTipWrapper>
      </div>
      <DialogContent className="bg-card select-none min-w-[600px]">
        <DialogHeader>
          <DialogTitle>Derived Key Creator</DialogTitle>
          <DialogDescription>Set key and relevant description</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 divide-y">
          <div className="flex flex-row gap-4 justify-between items-center">
            <p>Derived Key Name:</p>
            <Input
              className="max-w-[300px]"
              value={logicState.name}
              onChange={(event) => {
                setLogicState({ ...logicState, name: event.target.value });
              }}
            />
          </div>

          <div className="flex flex-row justify-between items-start pt-2">
            <div className="w-fit h-[40px] flex flex-col justify-center">
              <p className="text-nowrap ">Initial Value</p>
            </div>
            <div className="min-w-[300px] flex flex-col gap-2">
              <Select
                defaultValue={logicState.initial.type}
                onValueChange={(value) => {
                  console.log('Selected initial value type:', value);

                  if (value === 'constant') {
                    setLogicState((prev) => ({
                      ...prev,
                      initial: { type: 'constant', value: 0 },
                    }));
                  } else {
                    const selectedField = logicState.fields.find((field) => field.Tag === value);

                    console.log('Selected field:', selectedField);

                    if (selectedField) {
                      const valueSource: ValueSourceField = { type: 'field', field: selectedField };

                      console.log('Value source:', valueSource);

                      const updatedState: LogicState = {
                        ...logicState,
                        value: valueSource.field.Value,
                        initial: valueSource,
                      };

                      setLogicState(updatedState);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select initial value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Custom Constant</SelectItem>
                  {logicState.fields.map((field) => (
                    <SelectItem key={field.KeyCode} value={field.Tag}>
                      {field.KeyDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {logicState.initial.type === 'constant' && (
                <Input
                  type="numeric"
                  value={logicState.initial.value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue)) {
                      setLogicState((prev) => ({
                        ...prev,
                        initial: { type: 'constant', value: newValue },
                      }));
                    }
                  }}
                />
              )}
            </div>
          </div>

          {logicState.steps.map((step, index) => (
            <div key={index} className="flex flex-row justify-start gap-4 items-start pt-2">
              <div className="w-[60px] h-[40px] flex flex-col justify-center">
                <p className="text-nowrap ">{`Step ${index + 1}`}</p>
              </div>
              <div className="min-w-[100px] flex flex-row gap-2">
                <Select
                  defaultValue={step.operation}
                  onValueChange={(value) => {
                    const updatedSteps = [...logicState.steps];
                    updatedSteps[index] = { ...updatedSteps[index], operation: value as Operation };
                    setLogicState((prev) => ({ ...prev, steps: updatedSteps }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OperationTypes.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-1"></div>
              <div className="min-w-[235px] flex flex-col gap-2">
                <Select
                  defaultValue={step.operand.type === 'constant' ? 'constant' : step.operand.field.Tag}
                  onValueChange={(value) => {
                    if (value === 'constant') {
                      const updatedSteps = [...logicState.steps];
                      updatedSteps[index] = { ...updatedSteps[index], operand: { type: 'constant', value: 0 } };
                      setLogicState((prev) => ({ ...prev, steps: updatedSteps }));
                    } else {
                      const selectedField = logicState.fields.find((field) => field.Tag === value);
                      if (selectedField) {
                        const valueSource: ValueSourceField = { type: 'field', field: selectedField };
                        const updatedSteps = [...logicState.steps];
                        updatedSteps[index] = { ...updatedSteps[index], operand: valueSource };
                        setLogicState((prev) => ({ ...prev, steps: updatedSteps }));
                      } else {
                        console.error('Selected field not found for operand:', value);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constant">Custom Constant</SelectItem>
                    {logicState.fields.map((field) => (
                      <SelectItem key={field.KeyCode} value={field.Tag}>
                        {field.KeyDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step.operand.type === 'constant' && (
                  <Input
                    type="numeric"
                    value={step.operand.value}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      if (!isNaN(newValue)) {
                        const updatedSteps = [...logicState.steps];
                        updatedSteps[index] = {
                          ...updatedSteps[index],
                          operand: { type: 'constant', value: newValue },
                        };
                        setLogicState((prev) => ({ ...prev, steps: updatedSteps }));
                      }
                    }}
                  />
                )}
              </div>
              <Button
                variant={'destructive'}
                onClick={() => {
                  // Delete this step
                  const updatedSteps = logicState.steps.filter((_, i) => i !== index);
                  setLogicState((prev) => ({ ...prev, steps: updatedSteps }));
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
          ))}

          <div className="flex flex-row justify-between items-start pt-2 h-[40px]">
            <p>Formula: {stringBuilder}</p>
            <span>{}</span>
          </div>
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

              Callback(logicState);

              setShow(false);
              setLogicState({
                ...defaultEntry,
                fields: [...KeySet.FrequencyKeys, ...KeySet.DurationKeys].map((key) => ({
                  ...key,
                  Value: 0,
                  Tag: 'field.' + key.KeyDescription,
                })),
                id: uuidv4(),
              });
            }}
          >
            Save Derived Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

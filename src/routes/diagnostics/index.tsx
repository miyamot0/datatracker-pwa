import { queryClient } from '@/App';
import PageWrapper from '@/components/elements/page-wrapper';
import BackButton from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FolderHandleContext } from '@/context/folder-context';
import {
  evaluate,
  getRelevantFieldValues,
  LogicalStep,
  LogicState,
  Operation,
  OperationTypes,
  ValueSourceField,
} from '@/lib/logic/logic';
import { checkCrossOriginIsolation } from '@/lib/shared-buffer';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon, Trash } from 'lucide-react';
import { useContext, useState } from 'react';

export const Route = createFileRoute('/diagnostics/')({
  component: RouteComponent,
});

function AdaptiveBadge({ isSupported }: { isSupported: boolean }) {
  return (
    <Badge
      className={cn('bg-green-500 text-white hover:bg-green-500 cursor-default select-none whitespace-nowrap', {
        'bg-red-500 hover:bg-red-500': !isSupported,
      })}
    >
      {isSupported ? 'Enabled' : 'Disabled'}
    </Badge>
  );
}

function RouteComponent() {
  const check = checkCrossOriginIsolation();
  const { settings } = useContext(FolderHandleContext);

  return (
    <PageWrapper label="Diagnostics" className="flex flex-col gap-6 select-none">
      <Card className="w-full max-w-screen-lg">
        <CardHeader className="flex flex-row justify-between align-top">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Diagnostic and Performance Information</CardTitle>
            <CardDescription>Information here presented for debugging purposes</CardDescription>
          </div>
          <BackButton />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row justify-between">
            <p>Shared Array Buffer support:</p> <AdaptiveBadge isSupported={check.isSupported} />
          </div>
          <div className="flex flex-row justify-between">
            <p>Cross-Origin Isolation:</p> <AdaptiveBadge isSupported={check.isIsolated} />
          </div>

          <Separator className="my-1" />

          <div className="flex flex-row justify-between">
            <p>User Agent:</p> <span>{check.userAgent}</span>
          </div>

          <Separator className="my-1" />

          <div className="flex flex-row justify-between">
            <p>Issues:</p> <span>{check.issues.length}</span>
          </div>
          {check.issues.length > 0 && (
            <>
              <ul className="list-disc list-inside">
                {check.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </>
          )}

          <div className="flex flex-row justify-between">
            <p>Recommendations:</p> <span>{check.recommendations.length}</span>
          </div>
          {check.recommendations.length > 0 && (
            <>
              <ul className="list-disc list-inside">
                {check.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </>
          )}

          <Separator className="my-1" />

          <div className="flex flex-row justify-between">
            <p>Caching Mode:</p> <span>{settings.CacheBehavior}</span>
          </div>

          <div className="flex flex-row justify-between">
            <p>Stale Time (ms):</p>
            <span>{queryClient.getDefaultOptions().queries?.staleTime?.toString() ?? ''} ms</span>
          </div>

          <div className="flex flex-row justify-between">
            <p>Cache Time (ms):</p>
            <span>{queryClient.getDefaultOptions().queries?.gcTime?.toString() ?? ''} ms</span>
          </div>
        </CardContent>
      </Card>

      <LogicBuilderTest />
    </PageWrapper>
  );
}

function LogicBuilderTest() {
  //testLogic();

  // Note: Common across ALL rules
  const fields = getRelevantFieldValues();

  // Note: Specific to SINGLE rule
  //const steps = getLogicalSteps();

  const [logicState, setLogicState] = useState<LogicState>({
    initial: { type: 'constant', value: 0 },
    steps: [],
    fields: fields,
    value: 0,
    name: 'CTB Test',
    id: 'test1',
  });

  console.log(logicState);

  const result = evaluate(logicState);

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
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Logic Builder: {logicState.name}</CardTitle>
          <CardDescription>Generate index for derived value</CardDescription>
        </div>
        <Button
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
      </CardHeader>
      <CardContent className="flex flex-col gap-2 divide-y">
        <div className="flex flex-row justify-between items-start">
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
          <span>{result}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Save Logic</Button>
      </CardFooter>
    </Card>
  );
}

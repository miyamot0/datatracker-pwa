import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  Label: string;
  Description: string;
};

export default function SettingsFormItemWrapper({ children, Label, Description }: Props) {
  return (
    <div className="flex flex-col gap-2 md:flex-row justify-between w-full">
      <div className="flex flex-col w-full">
        <p className="font-semibold">{Label}</p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground">{Description}</p>
      </div>
      {children}
    </div>
  );
}

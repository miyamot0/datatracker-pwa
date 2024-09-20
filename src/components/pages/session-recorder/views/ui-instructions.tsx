import { SavedSettings } from '@/lib/dtos';
import { PaddedRow } from './padded-row';

type Props = {
  Evaluation: string;
  Settings: SavedSettings;
};

export default function SessionRecorderInstructions({ Evaluation, Settings }: Props) {
  return (
    <div className="w-full flex flex-col gap-2 border rounded shadow-xl bg-card">
      <div className="w-full text-center justify-center pt-2 text-sm font-bold">Session Parameters</div>
      <hr />
      <PaddedRow label="Evaluation Name:" value={Evaluation} />
      <PaddedRow label="Condition Name:" value={Settings.Condition} />
      <PaddedRow label="Data Collector:" value={Settings.Initials} />
      <PaddedRow label="Session Therapist:" value={Settings.Therapist} />

      <hr />
      <div className="flex flex-col gap-2 mb-2">
        <p className="w-full text-center text-sm font-bold">Instructions</p>
        <hr />

        <PaddedRow label="Enter:" value="Begins the session recording" />
        <PaddedRow label="Backspace:" value="Remove the last key entered" />
        <PaddedRow label="Escape:" value="End the current session" />
        <PaddedRow label="Z:" value="Switch to Timer #1" />
        <PaddedRow label="X:" value="Switch to Timer #2" />
        <PaddedRow label="C:" value="Switch to Timer #3" />
      </div>
    </div>
  );
}

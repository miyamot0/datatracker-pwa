import { ExpandedSavedSessionResult } from '../session-viewer-page';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table-common';
import { ApplicationSettingsTypes } from '@/types/settings';
import { KeyManageType } from '../../session-recorder/types/session-recorder-types';

type Props = {
  Session: ExpandedSavedSessionResult | undefined;
  Settings: ApplicationSettingsTypes;
};

export default function SessionKeyList({ Session, Settings }: Props) {
  if (!Session) return <></>;

  const columns: ColumnDef<KeyManageType>[] = [
    {
      accessorKey: 'Event',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recorded Event" />,
      cell: ({ row }) => <div>{`${row.original.KeyDescription}`}</div>,
    },
    {
      accessorKey: 'Key Code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Key Pressed" />,
      cell: ({ row }) => <div>{`${row.original.KeyName}`}</div>,
    },
    {
      accessorKey: 'Timer',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timer/Schedule" />,
      cell: ({ row }) => <div>{row.original.KeyScheduleRecording}</div>,
    },
    {
      id: 'Key Type',
      accessorKey: 'KeyType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Key Information" />,
      cell: ({ row }) => <div>{row.original.KeyType}</div>,
    },
    {
      id: 'Time Pressed',
      accessorKey: 'TimePressed',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time Pressed" />,
      cell: ({ row }) => <div>{new Date(row.original.TimePressed).toLocaleTimeString()}</div>,
    },
    {
      id: 'Time Into Session (sec)',
      accessorKey: 'TimeIntoSession',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time Into Session (sec)" />,
      cell: ({ row }) => <div>{`${row.original.TimeIntoSession.toFixed(3)}`}</div>,
    },
    {
      id: 'Time Into Session (min)',
      accessorKey: 'TimeIntoSession',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time Into Session (min)" />,
      cell: ({ row }) => <div>{`${(row.original.TimeIntoSession / 60).toFixed(3)} min`}</div>,
    },
  ];

  return (
    <>
      <DataTable
        settings={Settings}
        columns={columns}
        limitCols
        hiddenCols={{ 'Time Into Session (min)': true }}
        data={Session.PlottedKeys.sort((a, b) => a.TimeIntoSession - b.TimeIntoSession)}
      />
    </>
  );
}

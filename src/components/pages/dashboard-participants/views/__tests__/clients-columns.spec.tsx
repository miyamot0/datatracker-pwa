import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('../client-row-actions', () => ({
  default: ({ Individual }: any) => <div data-testid="client-row-actions">{Individual}</div>,
}));

import { buildClientColumns } from '../clients-columns';

const buildColumns = () =>
  buildClientColumns({
    Group: 'GroupA',
    Clients: ['Client1', 'Client2'],
    Handle: {} as FileSystemDirectoryHandle,
    Settings: { EnableFileDeletion: true } as any,
  });

const findCol = (key: string) => buildColumns().find((c) => ('accessorKey' in c ? c.accessorKey === key : false))!;

describe('buildClientColumns', () => {
  it('exports 2 column definitions in the correct order', () => {
    const columns = buildColumns();

    expect(columns).toHaveLength(2);
    expect(columns.map((c) => ('accessorKey' in c ? c.accessorKey : undefined))).toEqual(['Individual', 'Actions']);
  });

  it('renders the Client Name/ID header for the Individual column', async () => {
    const col = findCol('Individual');
    const Header = col.header as any;

    await render(<Header column={{ id: 'Individual' }} />);

    await expect.element(page.getByText('Client Name/ID')).toBeInTheDocument();
  });

  it('renders the Client Folder Actions header for the Actions column', async () => {
    const col = findCol('Actions');
    const Header = col.header as any;

    await render(<Header />);

    await expect.element(page.getByText('Client Folder Actions')).toBeInTheDocument();
  });

  it('renders ClientRowActions with the row Individual in the Actions cell', async () => {
    const col = findCol('Actions');
    const Cell = col.cell as any;

    await render(<Cell row={{ original: { Individual: 'Client1' } }} />);

    await expect.element(page.getByTestId('client-row-actions')).toHaveTextContent('Client1');
  });
});

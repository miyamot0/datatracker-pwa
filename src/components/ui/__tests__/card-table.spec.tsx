import { createRef } from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import '@/styles/globals.css';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from '../table';

describe('Card', () => {
  it('renders every subcomponent with its content', async () => {
    await render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title text</CardTitle>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
        <CardContent>Body text</CardContent>
        <CardFooter>Footer text</CardFooter>
      </Card>,
    );

    await expect.element(page.getByText('Title text')).toBeVisible();
    await expect.element(page.getByText('Description text')).toBeVisible();
    await expect.element(page.getByText('Body text')).toBeVisible();
    await expect.element(page.getByText('Footer text')).toBeVisible();
  });

  it('merges custom classes into every subcomponent', async () => {
    await render(
      <Card className="card-x">
        <CardHeader className="header-x">
          <CardTitle className="title-x">T</CardTitle>
          <CardDescription className="desc-x">D</CardDescription>
        </CardHeader>
        <CardContent className="content-x">C</CardContent>
        <CardFooter className="footer-x">F</CardFooter>
      </Card>,
    );

    await expect.element(page.getByText('T', { exact: true })).toHaveClass('title-x');
    await expect.element(page.getByText('D', { exact: true })).toHaveClass('desc-x');
    await expect.element(page.getByText('C', { exact: true })).toHaveClass('content-x');
    await expect.element(page.getByText('F', { exact: true })).toHaveClass('footer-x');
    await expect.element(document.querySelector('.card-x') as HTMLElement).toHaveClass('card-x');
  });

  it('forwards refs for each subcomponent', async () => {
    const refs = {
      card: createRef<HTMLDivElement>(),
      header: createRef<HTMLDivElement>(),
      title: createRef<HTMLParagraphElement>(),
      description: createRef<HTMLParagraphElement>(),
      content: createRef<HTMLDivElement>(),
      footer: createRef<HTMLDivElement>(),
    };
    await render(
      <Card ref={refs.card}>
        <CardHeader ref={refs.header}>
          <CardTitle ref={refs.title}>T</CardTitle>
          <CardDescription ref={refs.description}>D</CardDescription>
        </CardHeader>
        <CardContent ref={refs.content}>C</CardContent>
        <CardFooter ref={refs.footer}>F</CardFooter>
      </Card>,
    );

    expect(refs.card.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.header.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.title.current).toBeInstanceOf(HTMLElement);
    expect(refs.description.current).toBeInstanceOf(HTMLElement);
    expect(refs.content.current).toBeInstanceOf(HTMLDivElement);
    expect(refs.footer.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Table primitives', () => {
  it('renders a full table with caption, head, body, footer, and cells', async () => {
    await render(
      <Table>
        <TableCaption>Caption text</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Row one</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    await expect.element(page.getByText('Caption text')).toBeVisible();
    await expect.element(page.getByText('Name', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('cell', { name: 'Row one' })).toBeVisible();
    await expect.element(page.getByRole('cell', { name: 'Total' })).toBeVisible();
  });

  it('merges custom classes and wraps the table in a scroll container', async () => {
    await render(
      <Table className="table-x">
        <TableHeader className="thead-x">
          <TableRow className="tr-x">
            <TableHead className="th-x">H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tbody-x">
          <TableRow>
            <TableCell className="td-x">C</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="tfoot-x">
          <TableRow>
            <TableCell>F</TableCell>
          </TableRow>
        </TableFooter>
        <TableCaption className="caption-x">Cap</TableCaption>
      </Table>,
    );

    await expect.element(page.getByRole('table')).toHaveClass('table-x');
    await expect.element(page.getByText('H', { exact: true })).toHaveClass('th-x');
    await expect.element(page.getByRole('cell', { name: 'C' })).toHaveClass('td-x');
    await expect.element(page.getByText('Cap')).toHaveClass('caption-x');
  });

  it('forwards refs for each table element', async () => {
    const refs = {
      table: createRef<HTMLTableElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
    };
    await render(
      <Table ref={refs.table}>
        <TableCaption ref={refs.caption}>Cap</TableCaption>
        <TableHeader ref={refs.header}>
          <TableRow ref={refs.row}>
            <TableHead ref={refs.head}>H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={refs.body}>
          <TableRow>
            <TableCell ref={refs.cell}>C</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={refs.footer}>
          <TableRow>
            <TableCell>F</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(refs.table.current).toBeInstanceOf(HTMLTableElement);
    expect(refs.header.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(refs.body.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(refs.footer.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(refs.row.current).toBeInstanceOf(HTMLTableRowElement);
    expect(refs.head.current).toBeInstanceOf(HTMLTableCellElement);
    expect(refs.cell.current).toBeInstanceOf(HTMLTableCellElement);
    expect(refs.caption.current).toBeInstanceOf(HTMLTableCaptionElement);
  });
});

import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';

import '@/styles/globals.css';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarPortal,
} from '../menubar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import { ScrollArea, ScrollBar } from '../scroll-area';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../form';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb';

describe('Select', () => {
  it('shows the selected value and lists options when opened', async () => {
    const onValueChange = vi.fn();
    await render(
      <Select defaultValue="b" onValueChange={onValueChange}>
        <SelectTrigger className="trigger-x" aria-label="Pick">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruit</SelectLabel>
            <SelectItem value="a">Apple</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    const trigger = page.getByRole('combobox', { name: 'Pick' });
    await expect.element(trigger).toHaveClass('trigger-x');
    await expect.element(trigger).toHaveTextContent('Banana');

    await trigger.click();
    await expect.element(page.getByRole('option', { name: 'Apple' })).toBeVisible();
    await expect.element(page.getByText('Fruit')).toBeVisible();
    await page.getByRole('option', { name: 'Apple' }).click();
    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('renders the item and content with custom classes and the alternate position', async () => {
    await render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Positioned">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="item-aligned" className="content-x">
          <SelectItem value="x" className="item-x">
            Only item
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    await expect.element(page.getByRole('option', { name: 'Only item' })).toHaveClass('item-x');
  });
});

describe('DropdownMenu', () => {
  it('opens from its trigger and renders items, labels, groups, and shortcuts', async () => {
    const onSelect = vi.fn();
    await render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent className="content-x">
          <DropdownMenuLabel inset>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem inset onSelect={onSelect}>
              Rename
              <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect.element(page.getByText('Actions')).toBeVisible();
    await expect.element(page.getByText('⌘R')).toBeVisible();
    await page.getByRole('menuitem', { name: /Rename/ }).click();
    expect(onSelect).toHaveBeenCalled();
  });

  it('toggles checkbox items', async () => {
    const onCheck = vi.fn();
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Toggles</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheck} className="check-x">
            Show grid
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Show grid' })).toHaveClass('check-x');
    await page.getByRole('menuitemcheckbox', { name: 'Show grid' }).click();
    expect(onCheck).toHaveBeenCalledWith(true);
  });

  it('selects radio items', async () => {
    const onRadio = vi.fn();
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Radios</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="one" onValueChange={onRadio}>
            <DropdownMenuRadioItem value="one">One</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="two" className="radio-x">
              Two
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await expect.element(page.getByRole('menuitemradio', { name: 'Two' })).toHaveClass('radio-x');
    await page.getByRole('menuitemradio', { name: 'Two' }).click();
    expect(onRadio).toHaveBeenCalledWith('two');
  });

  it('opens a nested submenu from a sub trigger', async () => {
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Nested</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset className="sub-x">
              More options
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="subcontent-x">
                <DropdownMenuItem>Deep item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await expect.element(page.getByRole('menuitem', { name: 'More options' })).toHaveClass('sub-x');
    await page.getByRole('menuitem', { name: 'More options' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Deep item' })).toBeVisible();
  });
});

describe('Menubar', () => {
  it('opens menus and renders items, checkbox and radio items, labels, shortcuts, and separators', async () => {
    const onSelect = vi.fn();
    await render(
      <Menubar className="bar-x">
        <MenubarMenu>
          <MenubarTrigger className="trigger-x">File</MenubarTrigger>
          <MenubarContent className="content-x">
            <MenubarLabel inset>Document</MenubarLabel>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem inset onSelect={onSelect}>
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarCheckboxItem checked className="check-x">
              Autosave
            </MenubarCheckboxItem>
            <MenubarRadioGroup value="a">
              <MenubarRadioItem value="a">Alpha</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent>
              <MenubarSub defaultOpen>
                <MenubarSubTrigger inset>Transform</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Uppercase</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'File' }).click();
    await expect.element(page.getByText('Document')).toBeVisible();
    await expect.element(page.getByText('⌘S')).toBeVisible();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Autosave' })).toHaveClass('check-x');
    await expect.element(page.getByRole('menuitemradio', { name: 'Alpha' })).toBeVisible();
    await page.getByRole('menuitem', { name: /Save/ }).click();
    expect(onSelect).toHaveBeenCalled();
  });

  it('switches to a neighbouring menu when another trigger is hovered while open', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>First</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>First item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Second</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Second item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'First' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'First item' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Second' }).hover();
    await expect.element(page.getByRole('menuitem', { name: 'Second item' })).toBeVisible();
  });

  it('keeps the menu switch when a click lands on another trigger while open', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Alpha</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Alpha item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Beta</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Beta item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'Alpha' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Alpha item' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Beta' }).click({ force: true });
    await expect.element(page.getByRole('menuitem', { name: 'Beta item' })).toBeVisible();
  });

  it('does not dismiss when focus moves to another trigger while open', async () => {
    await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Gamma</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Gamma item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Delta</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Delta item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await page.getByRole('menuitem', { name: 'Gamma' }).click();
    await expect.element(page.getByRole('menuitem', { name: 'Gamma item' })).toBeVisible();
    (page.getByRole('menuitem', { name: 'Delta' }).element() as HTMLElement).focus();
    await expect.element(page.getByRole('menuitem', { name: 'Gamma item' })).toBeVisible();
  });
});

describe('Tooltip', () => {
  it('shows tooltip content when the trigger is hovered', async () => {
    await render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Info trigger</TooltipTrigger>
          <TooltipContent className="tip-x">Helpful text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await page.getByRole('button', { name: 'Info trigger' }).hover();
    await expect.element(page.getByText('Helpful text')).toBeVisible();
  });
});

describe('ScrollArea', () => {
  it('renders its children in a viewport and supports a horizontal scrollbar', async () => {
    await render(
      <ScrollArea className="area-x">
        <p>Scrollable content</p>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>,
    );
    await expect.element(page.getByText('Scrollable content')).toBeVisible();
  });

  it('defaults the scrollbar to vertical orientation', async () => {
    await render(
      <ScrollArea className="h-10">
        <div style={{ height: '400px' }}>Vertical content</div>
        <ScrollBar />
      </ScrollArea>,
    );
    await page.getByText('Vertical content').hover();
    await vi.waitFor(() => expect(document.querySelector('[data-orientation="vertical"]')).not.toBeNull());
  });
});

describe('Form', () => {
  function FormFixture({ onSubmit }: { onSubmit: (values: { name: string }) => void }) {
    const form = useForm<{ name: string }>({ defaultValues: { name: '' } });
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <FormItem className="item-x">
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <input placeholder="Full name input" {...field} />
                </FormControl>
                <FormDescription>Shown to others</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <button type="submit">Submit form</button>
        </form>
      </Form>
    );
  }

  it('wires labels, controls, and descriptions to the field', async () => {
    await render(<FormFixture onSubmit={() => {}} />);
    const input = page.getByLabelText('Full name');
    await expect.element(input).toBeVisible();
    await expect.element(page.getByText('Shown to others')).toBeVisible();
  });

  it('shows the validation message after a failed submit', async () => {
    const onSubmit = vi.fn();
    await render(<FormFixture onSubmit={onSubmit} />);
    await page.getByRole('button', { name: 'Submit form' }).click();
    await expect.element(page.getByText('Name is required')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the typed value through the form', async () => {
    const onSubmit = vi.fn();
    await render(<FormFixture onSubmit={onSubmit} />);
    await page.getByPlaceholder('Full name input').fill('Ada');
    await page.getByRole('button', { name: 'Submit form' }).click();
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('throws when useFormField is used outside a FormField', async () => {
    const { useFormField } = await import('../form');
    const Broken = () => {
      useFormField();
      return null;
    };
    await expect(render(<Broken />)).rejects.toThrow();
  });
});

describe('Breadcrumb', () => {
  it('renders links, the current page, separators, and an ellipsis', async () => {
    await render(
      <Breadcrumb className="crumbs-x">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis className="ellipsis-x" />
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    await expect.element(page.getByRole('navigation')).toHaveAttribute('aria-label', 'breadcrumb');
    await expect.element(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
    await expect.element(page.getByText('Current')).toHaveAttribute('aria-current', 'page');
    await expect.element(page.getByText('More')).toBeInTheDocument();
  });

  it('applies custom classes and renders a default separator icon', async () => {
    await render(
      <Breadcrumb>
        <BreadcrumbList className="list-x">
          <BreadcrumbItem className="item-x">
            <BreadcrumbLink href="#a" className="link-x">
              A
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="sep-x" />
          <BreadcrumbItem>
            <BreadcrumbPage className="page-x">B</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    await expect.element(page.getByRole('link', { name: 'A' })).toHaveClass('link-x');
    await expect.element(page.getByText('B')).toHaveClass('page-x');
    expect(document.querySelector('li[role="presentation"] svg')).not.toBeNull();
  });
});

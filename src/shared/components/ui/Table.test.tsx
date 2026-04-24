import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';

describe('<Table /> family', () => {
  it('renders a semantic <table> wrapped in an overflow container', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>api</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
    expect((container.firstElementChild as HTMLElement).className).toContain('overflow-x-auto');
  });

  it('adds a pointer cursor on clickable rows and fires onClick', async () => {
    const onClick = vi.fn();
    render(
      <Table>
        <TableBody>
          <TableRow onClick={onClick}>
            <TableCell>row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = screen.getByRole('row');
    expect(row.className).toContain('cursor-pointer');
    await userEvent.setup().click(row);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('omits cursor-pointer when no onClick is set', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row').className).not.toContain('cursor-pointer');
  });
});

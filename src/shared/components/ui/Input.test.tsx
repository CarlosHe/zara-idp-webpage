import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Select, Textarea, fieldVariants } from './Input';

describe('<Input />', () => {
  it('renders an input element and auto-wires label/id when a label is provided', () => {
    render(<Input label="Name" placeholder="type" />);
    const field = screen.getByLabelText('Name');
    expect(field).toBeInTheDocument();
    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveAttribute('placeholder', 'type');
  });

  it('renders the error message with role="alert" and sets aria-invalid/describedby', () => {
    render(<Input label="Email" id="email" error="required" />);
    const field = screen.getByLabelText('Email');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', 'email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('required');
  });

  it('disables the input when `disabled` is set', () => {
    render(<Input label="N" disabled />);
    expect(screen.getByLabelText('N')).toBeDisabled();
  });

  it('forwards a ref to the underlying input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts text input via user-event', async () => {
    render(<Input label="City" />);
    const user = userEvent.setup();
    const field = screen.getByLabelText('City');
    await user.type(field, 'zara');
    expect(field).toHaveValue('zara');
  });
});

describe('<Textarea />', () => {
  it('renders a <textarea> with the label wired up', () => {
    render(<Textarea label="Notes" />);
    const field = screen.getByLabelText('Notes');
    expect(field.tagName).toBe('TEXTAREA');
  });

  it('propagates aria-invalid on error', () => {
    render(<Textarea label="bio" error="too short" />);
    expect(screen.getByLabelText('bio')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('too short');
  });
});

describe('<Select />', () => {
  it('renders options from the `options` prop', () => {
    render(
      <Select
        label="Kind"
        options={[
          { value: 'pod', label: 'Pod' },
          { value: 'svc', label: 'Service' },
        ]}
      />,
    );
    expect(screen.getByRole('option', { name: 'Pod' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Service' })).toBeInTheDocument();
  });

  it('renders children when options is omitted', () => {
    render(
      <Select label="K">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'B' })).toBeInTheDocument();
  });
});

describe('fieldVariants', () => {
  it('maps invalid=true to the red border', () => {
    expect(fieldVariants({ invalid: true })).toContain('border-red-500');
    expect(fieldVariants({ invalid: false })).toContain('border-slate-700');
  });
});

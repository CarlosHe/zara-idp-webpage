import { Input } from '@/shared/components/ui';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type,
  required,
}: TextFieldProps) {
  return (
    <div>
      <Input label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <div>
      <Input label={label}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min="0"
      />
    </div>
  );
}

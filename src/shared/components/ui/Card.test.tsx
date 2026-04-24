import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from './Card';

describe('<Card />', () => {
  it('renders a div with the default variant + medium padding', () => {
    render(<Card data-testid="c">body</Card>);
    const el = screen.getByTestId('c');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('bg-slate-800/50');
    expect(el.className).toContain('p-4');
  });

  it('switches the variant and padding when requested', () => {
    render(
      <Card data-testid="c" variant="elevated" padding="lg">
        body
      </Card>,
    );
    const el = screen.getByTestId('c');
    expect(el.className).toContain('bg-slate-800');
    expect(el.className).toContain('shadow-sm');
    expect(el.className).toContain('p-6');
  });

  it('composes header / title / description / content / footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Foot')).toBeInTheDocument();
  });

  it('cardVariants exposes CVA factories for each variant', () => {
    expect(cardVariants({ variant: 'outline', padding: 'none' })).toContain(
      'bg-transparent',
    );
  });
});

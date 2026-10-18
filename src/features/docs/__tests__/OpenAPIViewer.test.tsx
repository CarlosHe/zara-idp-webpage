import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/mocks/server';
import { OpenAPIViewer } from '../components/OpenAPIViewer';
import type { TechDoc } from '../types';

const doc: TechDoc = { slug: 'api', title: 'API', description: '', format: 'openapi', markdown: '', openApiPath: '/api/openapi.yaml' };
const spec = { openapi: '3.0.3', paths: { '/resources': { get: { summary: 'List platform resources' } } } };

describe('OpenAPIViewer authentication', () => {
  it('authenticates same-origin operation and raw-spec requests', async () => {
    const authorization: (string | null)[] = [];
    localStorage.setItem('zara.authToken', 'spec-test-token');
    server.use(http.get('*/api/openapi.yaml', ({ request }) => {
      authorization.push(request.headers.get('authorization'));
      return HttpResponse.json(spec);
    }));
    try {
      render(<OpenAPIViewer doc={doc} />);
      expect(await screen.findByText('List platform resources')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'View raw spec' }));
      expect(await screen.findByText(JSON.stringify(spec), { exact: false })).toBeInTheDocument();
      expect(authorization).toEqual(['Bearer spec-test-token', 'Bearer spec-test-token']);
    } finally {
      localStorage.removeItem('zara.authToken');
    }
  });

  it('does not send the platform token to an external specification host', async () => {
    let authorization: string | null | undefined;
    localStorage.setItem('zara.authToken', 'private-platform-token');
    server.use(http.get('https://spec.example.test/openapi.json', ({ request }) => {
      authorization = request.headers.get('authorization');
      return HttpResponse.json(spec);
    }));
    try {
      render(<OpenAPIViewer doc={{ ...doc, openApiPath: 'https://spec.example.test/openapi.json' }} />);
      expect(await screen.findByText('List platform resources')).toBeInTheDocument();
      expect(authorization).toBeNull();
    } finally {
      localStorage.removeItem('zara.authToken');
    }
  });
});

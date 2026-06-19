import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the login page when no token is present', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('Sign in').length).toBeGreaterThan(0);
  });
});

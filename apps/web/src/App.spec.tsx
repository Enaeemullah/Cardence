import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the login page when no token is present', () => {
    const { getByText } = render(<App />);
    expect(getByText('Sign in')).toBeDefined();
  });
});

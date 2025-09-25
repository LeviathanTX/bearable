import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders health coaching app welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Your Health Journey/i);
  expect(welcomeElement).toBeInTheDocument();
});

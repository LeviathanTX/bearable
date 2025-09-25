import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders health coaching app welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Your Health Journey/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders bearable health coach title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Bearable Health Coach/i);
  expect(titleElement).toBeInTheDocument();
});

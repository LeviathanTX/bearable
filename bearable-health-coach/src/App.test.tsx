import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome screen', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Your Health Journey/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders bearable health coach title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Bearable Health Coach/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders mayo clinic powered text', () => {
  render(<App />);
  const poweredByElements = screen.getAllByText(/Powered by Mayo Clinic/i);
  expect(poweredByElements.length).toBeGreaterThan(0);
  expect(poweredByElements[0]).toBeInTheDocument();
});

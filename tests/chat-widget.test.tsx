import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatWidget } from '../components/chat/ChatWidget';

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('ChatWidget Component & Positioning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders minimized launcher with desktop bottom-16 and mobile bottom-5 positioning classes', () => {
    render(<ChatWidget />);

    const container = screen.getByTestId('chat-widget-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('fixed');
    expect(container).toHaveClass('z-50');
    expect(container).toHaveClass('sm:bottom-16');
    expect(container).toHaveClass('bottom-5');
    expect(container).toHaveClass('right-5');

    const launcherBtn = screen.getByRole('button', { name: /open ai chat assistant/i });
    expect(launcherBtn).toBeInTheDocument();
  });

  it('opens to standard chat panel anchored at bottom-5 when launcher is clicked', () => {
    render(<ChatWidget />);

    const launcherBtn = screen.getByRole('button', { name: /open ai chat assistant/i });
    act(() => {
      fireEvent.click(launcherBtn);
    });

    const container = screen.getByTestId('chat-widget-container');
    expect(container).toHaveClass('sm:bottom-5');
    expect(container).toHaveClass('sm:right-5');
    expect(container).not.toHaveClass('sm:bottom-16');

    expect(screen.getByText('LLM Wiki AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /minimize chat window/i })).toBeInTheDocument();
  });

  it('minimizes back to launcher positioned at sm:bottom-16 when minimize button is clicked', () => {
    render(<ChatWidget />);

    // 1. Open
    const launcherBtn = screen.getByRole('button', { name: /open ai chat assistant/i });
    act(() => {
      fireEvent.click(launcherBtn);
    });

    const minimizeBtn = screen.getByRole('button', { name: /minimize chat window/i });
    expect(minimizeBtn).toBeInTheDocument();

    // 2. Minimize
    act(() => {
      fireEvent.click(minimizeBtn);
    });

    const container = screen.getByTestId('chat-widget-container');
    expect(container).toHaveClass('sm:bottom-16');
    expect(container).toHaveClass('bottom-5');
    expect(container).toHaveClass('right-5');
    expect(screen.getByRole('button', { name: /open ai chat assistant/i })).toBeInTheDocument();
  });

  it('minimizes when Escape key is pressed in open view', () => {
    render(<ChatWidget />);

    // Open
    const launcherBtn = screen.getByRole('button', { name: /open ai chat assistant/i });
    act(() => {
      fireEvent.click(launcherBtn);
    });

    expect(screen.getByText('LLM Wiki AI')).toBeInTheDocument();

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });

    const container = screen.getByTestId('chat-widget-container');
    expect(container).toHaveClass('sm:bottom-16');
    expect(screen.getByRole('button', { name: /open ai chat assistant/i })).toBeInTheDocument();
  });

  it('expands to enlarged panel view and restores back', () => {
    render(<ChatWidget />);

    // Open standard view
    const launcherBtn = screen.getByRole('button', { name: /open ai chat assistant/i });
    act(() => {
      fireEvent.click(launcherBtn);
    });

    const expandBtn = screen.getByRole('button', { name: /expand window/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    const container = screen.getByTestId('chat-widget-container');
    expect(container).toHaveClass('inset-2');
    expect(container).toHaveClass('sm:inset-auto');

    // Restore back
    const restoreBtn = screen.getByRole('button', { name: /restore window size/i });
    act(() => {
      fireEvent.click(restoreBtn);
    });

    expect(container).toHaveClass('sm:bottom-5');
  });
});

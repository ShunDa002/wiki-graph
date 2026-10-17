import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatMessage, Source } from '../features/chat/chat.types';

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
        <div {...props}>{children}</div>
      ),
      span: ({ children, ...props }: React.ComponentPropsWithoutRef<'span'>) => (
        <span {...props}>{children}</span>
      ),
    },
  };
});

describe('AI Chat Inline Citation Click, Scroll & Pulse Highlighting', () => {
  const mockSources: Source[] = [
    {
      citation: 1,
      title: 'Agentic Architecture',
      path: 'concepts/Agentic AI.md',
      score: 0.94,
    },
    {
      citation: 2,
      title: 'Prompt Engineering',
      path: 'sources/Prompting Guide.md',
      score: 0.88,
    },
  ];

  const mockMessage: ChatMessage = {
    id: 'msg-assistant-1',
    role: 'assistant',
    content: 'According to [1], agentic systems utilize tool calling. See also [2] for prompt design. Missing [99] here.',
    timestamp: Date.now(),
    sources: mockSources,
    status: 'complete',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    } else {
      vi.spyOn(Element.prototype, 'scrollIntoView');
    }
  });

  it('renders inline citation buttons with data-citation attributes and titles', () => {
    render(<MessageBubble message={mockMessage} />);

    const citation1 = screen.getByRole('button', { name: '[1]' });
    const citation2 = screen.getByRole('button', { name: '[2]' });
    const citation99 = screen.getByRole('button', { name: '[99]' });

    expect(citation1).toBeInTheDocument();
    expect(citation1).toHaveAttribute('data-citation', '1');
    expect(citation1).toHaveAttribute('title', 'View Source [1]');

    expect(citation2).toBeInTheDocument();
    expect(citation2).toHaveAttribute('data-citation', '2');

    expect(citation99).toBeInTheDocument();
    expect(citation99).toHaveAttribute('data-citation', '99');
  });

  it('auto-expands SourcesAccordion when inline citation [1] is clicked', async () => {
    render(<MessageBubble message={mockMessage} />);

    // Initially accordion toggle is collapsed
    const toggleBtn = screen.getByRole('button', { name: /sources \(2\)/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Click citation [1]
    const citation1 = screen.getByRole('button', { name: '[1]' });
    act(() => {
      fireEvent.click(citation1);
    });

    // Accordion expands
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Agentic Architecture')).toBeInTheDocument();
  });

  it('smoothly scrolls the referenced source item centered into view when clicked', async () => {
    render(<MessageBubble message={mockMessage} />);

    const citation1 = screen.getByRole('button', { name: '[1]' });
    act(() => {
      fireEvent.click(citation1);
    });

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    const sourceItem1 = document.getElementById('source-item-1');
    expect(sourceItem1).toBeInTheDocument();
  });

  it('applies pulsing highlight classes to the active source card', async () => {
    render(<MessageBubble message={mockMessage} />);

    const citation1 = screen.getByRole('button', { name: '[1]' });
    act(() => {
      fireEvent.click(citation1);
    });

    await waitFor(() => {
      const sourceItem1 = document.getElementById('source-item-1');
      expect(sourceItem1).toHaveClass('animate-pulse');
      expect(sourceItem1).toHaveClass('ring-2');
      expect(sourceItem1).toHaveClass('ring-indigo-400/80');
      expect(sourceItem1).toHaveClass('border-indigo-400');
    });

    // Source 2 should not be highlighted
    const sourceItem2 = document.getElementById('source-item-2');
    expect(sourceItem2).not.toHaveClass('animate-pulse');
  });

  it('gracefully ignores clicks on missing citation numbers without throwing or scrolling', async () => {
    render(<MessageBubble message={mockMessage} />);

    const citation99 = screen.getByRole('button', { name: '[99]' });
    act(() => {
      fireEvent.click(citation99);
    });

    // Accordion should remain closed
    const toggleBtn = screen.getByRole('button', { name: /sources \(2\)/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // scrollIntoView should NOT have been called
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('repeated clicks on citation [1] re-trigger scroll and pulse without closing accordion', async () => {
    render(<MessageBubble message={mockMessage} />);

    const citation1 = screen.getByRole('button', { name: '[1]' });
    
    // First click
    act(() => {
      fireEvent.click(citation1);
    });

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    // Second click on the same citation
    act(() => {
      fireEvent.click(citation1);
    });

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    });

    // Accordion remains open
    const toggleBtn = screen.getByRole('button', { name: /sources \(2\)/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('switches active citation and centers source 2 when citation [2] is clicked', async () => {
    render(<MessageBubble message={mockMessage} />);

    // Click 1
    const citation1 = screen.getByRole('button', { name: '[1]' });
    act(() => {
      fireEvent.click(citation1);
    });

    // Click 2
    const citation2 = screen.getByRole('button', { name: '[2]' });
    act(() => {
      fireEvent.click(citation2);
    });

    await waitFor(() => {
      const sourceItem2 = document.getElementById('source-item-2');
      expect(sourceItem2).toHaveClass('animate-pulse');
      expect(sourceItem2).toHaveClass('ring-2');
    });

    const sourceItem1 = document.getElementById('source-item-1');
    expect(sourceItem1).not.toHaveClass('animate-pulse');
  });

  it('disables citation buttons while assistant is streaming', () => {
    const streamingMessage: ChatMessage = {
      ...mockMessage,
      status: 'streaming',
    };

    render(<MessageBubble message={streamingMessage} />);

    const citation1 = screen.getByRole('button', { name: '[1]' });
    expect(citation1).toBeDisabled();
    expect(citation1).toHaveAttribute('title', 'Generating response...');

    act(() => {
      fireEvent.click(citation1);
    });

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

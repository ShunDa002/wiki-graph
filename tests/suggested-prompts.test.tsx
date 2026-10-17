import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SuggestedPrompts,
  extractTopicsList,
  formatTopicToPrompt,
  DEFAULT_SUGGESTED_TOPICS,
} from '../components/chat/SuggestedPrompts';

describe('extractTopicsList', () => {
  it('extracts plain string arrays', () => {
    const data = ['Graph Layouts', 'Wikilinks'];
    expect(extractTopicsList(data)).toEqual(['Graph Layouts', 'Wikilinks']);
  });

  it('extracts topics from object with topics key', () => {
    const data = { topics: ['Obsidian Notes', 'Knowledge Vaults'] };
    expect(extractTopicsList(data)).toEqual(['Obsidian Notes', 'Knowledge Vaults']);
  });

  it('extracts topics from object with random_topics key', () => {
    const data = { random_topics: ['Vector Embeddings'] };
    expect(extractTopicsList(data)).toEqual(['Vector Embeddings']);
  });

  it('extracts topics from object with data or items key', () => {
    const data = { data: ['Semantic Search'] };
    expect(extractTopicsList(data)).toEqual(['Semantic Search']);
  });

  it('extracts topics from array of objects with topic or title keys', () => {
    const data = [{ topic: 'Clustering' }, { title: 'Dagre Layout' }];
    expect(extractTopicsList(data)).toEqual(['Clustering', 'Dagre Layout']);
  });

  it('returns empty array on invalid or null data', () => {
    expect(extractTopicsList(null)).toEqual([]);
    expect(extractTopicsList(123)).toEqual([]);
    expect(extractTopicsList({})).toEqual([]);
  });
});

describe('formatTopicToPrompt', () => {
  it('formats clean noun topics with "What is ...?"', () => {
    expect(formatTopicToPrompt('Wikilinks')).toBe('What is Wikilinks?');
    expect(formatTopicToPrompt('Graph Layouts')).toBe('What is Graph Layouts?');
  });

  it('strips redundant trailing question marks before formatting', () => {
    expect(formatTopicToPrompt('Obsidian Notes?')).toBe('What is Obsidian Notes?');
    expect(formatTopicToPrompt('Semantic Search???')).toBe('What is Semantic Search?');
  });

  it('preserves natural questions starting with question words', () => {
    expect(formatTopicToPrompt('How do backlinks work?')).toBe('How do backlinks work?');
    expect(formatTopicToPrompt('Why use Cytoscape')).toBe('Why use Cytoscape?');
    expect(formatTopicToPrompt('What is LangGraph?')).toBe('What is LangGraph?');
  });

  it('returns empty string for empty input', () => {
    expect(formatTopicToPrompt('   ')).toBe('');
  });
});

describe('SuggestedPrompts Component', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches /random-topics and displays up to 3 formatted prompt chips', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ['Wikilinks', 'Graph Layouts', 'Semantic Search', 'Vector Embeddings'],
    } as Response);

    const onSelectPrompt = vi.fn();
    render(<SuggestedPrompts onSelectPrompt={onSelectPrompt} />);

    expect(screen.getByText('Suggested queries')).toBeInTheDocument();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    const firstBtn = screen.getAllByRole('button')[0];
    expect(firstBtn.textContent).toMatch(/^What is .+\?$/);

    fireEvent.click(firstBtn);
    expect(onSelectPrompt).toHaveBeenCalledTimes(1);
    expect(onSelectPrompt).toHaveBeenCalledWith(firstBtn.textContent);
  });

  it('falls back to default suggested topics when API endpoint fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const onSelectPrompt = vi.fn();
    render(<SuggestedPrompts onSelectPrompt={onSelectPrompt} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons[0].textContent).toMatch(/^What is .+\?$/);
  });
});

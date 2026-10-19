import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPanel } from '../components/graph/ErrorPanel';
import { SearchBox } from '../components/graph/SearchBox';
import { FilterPanel } from '../components/graph/FilterPanel';
import { NodePreview } from '../components/graph/NodePreview';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { ApiError, GraphNode, GraphNodeSchema, GraphResponse, GraphResponseSchema } from '../lib/api';

describe('ErrorPanel', () => {
  it('renders Service Unavailable error and calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    const error = new ApiError('Offline', { isUnavailable: true });

    render(<ErrorPanel error={error} onRetry={onRetry} />);

    expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry connection/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Incompatible Schema Version error when unsupported version returned', () => {
    const error = new ApiError('Incompatible', {
      isUnsupportedSchema: true,
      schemaVersion: '2.5.0',
    });

    render(<ErrorPanel error={error} onRetry={() => {}} />);

    expect(screen.getByText('Incompatible Schema Version')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh application/i })).toBeInTheDocument();
  });
});

describe('SearchBox', () => {
  it('renders input, accepts typing and clear button', () => {
    const onChange = vi.fn();
    render(<SearchBox value="neural" onChange={onChange} resultCount={5} />);

    expect(screen.getByDisplayValue('neural')).toBeInTheDocument();
    expect(screen.getByText('5 found')).toBeInTheDocument();

    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('FilterPanel', () => {
  it('renders folders, tags, orphan toggle and handles interactions', () => {
    const onSelectFolder = vi.fn();
    const onSelectTag = vi.fn();
    const onToggleHideOrphans = vi.fn();

    render(
      <FilterPanel
        folders={['concepts', 'guides']}
        selectedFolder={null}
        onSelectFolder={onSelectFolder}
        tags={['ai', 'wiki']}
        selectedTag={null}
        onSelectTag={onSelectTag}
        hideOrphans={false}
        onToggleHideOrphans={onToggleHideOrphans}
      />
    );

    expect(screen.getByText('concepts')).toBeInTheDocument();
    expect(screen.getByText('#ai')).toBeInTheDocument();

    fireEvent.click(screen.getByText('concepts'));
    expect(onSelectFolder).toHaveBeenCalledWith('concepts');

    fireEvent.click(screen.getByRole('switch'));
    expect(onToggleHideOrphans).toHaveBeenCalledTimes(1);
  });
});

describe('GraphToolbar', () => {
  it('renders note/edge metrics and calls onRefresh when Refresh Graph button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <GraphToolbar
        nodeCount={42}
        edgeCount={108}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('108')).toBeInTheDocument();

    const refreshBtn = screen.getByTitle('Refresh Graph');
    expect(refreshBtn).toBeInTheDocument();
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('NodePreview', () => {
  const mockNode: GraphNode = GraphNodeSchema.parse({
    id: 'test-node',
    label: 'Test Node',
    type: 'note',
    metadata: {
      title: 'Neural Networks Overview',
      path: 'concepts/nn.md',
      folder: 'concepts',
      tags: ['ai', 'deep-learning'],
      aliases: ['NN'],
      excerpt: 'Comprehensive guide to artificial neural networks.',
      status: 'active',
      incomingCount: 4,
      outgoingCount: 7,
      isOrphan: false,
    },
  });

  it('renders note details, excerpt, link counts and handles close', () => {
    const onClose = vi.fn();
    const onSelectNode = vi.fn();

    render(
      <NodePreview
        node={mockNode}
        onClose={onClose}
        onSelectNode={onSelectNode}
        incomingNeighbors={[]}
        outgoingNeighbors={[]}
      />
    );

    expect(screen.getByText('Neural Networks Overview')).toBeInTheDocument();
    expect(screen.getByText('concepts/nn.md')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(
      screen.getByText(/Comprehensive guide to artificial neural networks/i)
    ).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Close preview');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders incoming and outgoing neighbors cleanly without key collision even if duplicate nodes are passed', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NodePreview
        node={mockNode}
        onClose={() => {}}
        onSelectNode={() => {}}
        incomingNeighbors={[mockNode, mockNode]}
        outgoingNeighbors={[mockNode, mockNode]}
      />
    );

    expect(screen.getAllByText('Neural Networks Overview').length).toBeGreaterThan(1);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Encountered two children with the same key')
    );

    consoleErrorSpy.mockRestore();
  });

  it('renders View Wiki Source button linking to original repo when path and env variable are present', () => {
    const originalEnv = process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO;
    process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO = 'https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki';

    render(
      <NodePreview
        node={mockNode}
        onClose={() => {}}
        onSelectNode={() => {}}
      />
    );

    const sourceBtn = screen.getByRole('link', { name: /view original wiki source on github/i });
    expect(sourceBtn).toBeInTheDocument();
    expect(sourceBtn).toHaveAttribute(
      'href',
      'https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki/concepts/nn.md'
    );
    expect(sourceBtn).toHaveAttribute('target', '_blank');
    expect(sourceBtn).toHaveAttribute('rel', 'noopener noreferrer');

    process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO = originalEnv;
  });

  it('hides View Wiki Source button when path is empty or falsy', () => {
    const originalEnv = process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO;
    process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO = 'https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki';

    const nodeWithoutPath: GraphNode = {
      ...mockNode,
      metadata: {
        ...mockNode.metadata,
        path: '',
      },
    };

    render(
      <NodePreview
        node={nodeWithoutPath}
        onClose={() => {}}
        onSelectNode={() => {}}
      />
    );

    expect(
      screen.queryByRole('link', { name: /view original wiki source on github/i })
    ).not.toBeInTheDocument();

    process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO = originalEnv;
  });

  it('hides View Wiki Source button when NEXT_PUBLIC_ORIGINAL_WIKI_REPO is unset', () => {
    const originalEnv = process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO;
    delete process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO;

    render(
      <NodePreview
        node={mockNode}
        onClose={() => {}}
        onSelectNode={() => {}}
      />
    );

    expect(
      screen.queryByRole('link', { name: /view original wiki source on github/i })
    ).not.toBeInTheDocument();

    process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO = originalEnv;
  });
});

describe('ForceGraphCanvas', () => {
  const mockGraphData: GraphResponse = GraphResponseSchema.parse({
    schemaVersion: '1.0.0',
    generatedAt: '2026-10-10T00:00:00Z',
    sourceVersion: 'v1',
    metadata: {
      nodeCount: 2,
      edgeCount: 1,
      brokenLinkCount: 0,
    },
    nodes: [
      {
        id: 'node1',
        label: 'Node 1',
        title: 'Node 1',
        type: 'index',
        path: 'node1.md',
        folder: 'concepts',
        tags: ['core'],
        aliases: [],
        excerpt: 'Intro note',
        status: 'active',
        incomingCount: 2,
        outgoingCount: 1,
        isOrphan: false,
      },
      {
        id: 'node2',
        label: 'Node 2',
        title: 'Node 2',
        type: 'note',
        path: 'node2.md',
        folder: 'concepts',
        tags: ['core'],
        aliases: [],
        excerpt: 'Secondary note',
        status: 'active',
        incomingCount: 1,
        outgoingCount: 2,
        isOrphan: false,
      },
    ],
    edges: [
      { id: 'e1', source: 'node1', target: 'node2', type: 'wikilink' },
    ],
    unresolvedLinks: [],
  });

  it('renders canvas and HUD interactive control buttons', async () => {
    const { ForceGraphCanvas } = await import('../components/graph/ForceGraphCanvas');
    const onSelectNode = vi.fn();

    render(<ForceGraphCanvas graphData={mockGraphData} onSelectNode={onSelectNode} />);

    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Fit View / Reset Camera')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh Graph')).toBeInTheDocument();

    const zoomInBtn = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInBtn);

    const reclusterBtn = screen.getByTitle('Refresh Graph');
    fireEvent.click(reclusterBtn);
  });
});


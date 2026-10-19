'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GraphResponse } from '../../lib/api';
import { filterGraphData } from '../../lib/graph-transforms';
import { useGraphStore } from '../../store/useGraphStore';
import {
  SimNode,
  SimEdge,
  initializeSimulationNodes,
  stepPhysicsSimulation,
  shouldRenderNodeLabel,
  computeDegreeStats,
  getNeonNodeTheme,
  NeonNodeTheme,
  DEFAULT_PHYSICS_PARAMS,
} from '../../lib/force-simulation';
import { computeCanvasLayout } from '../../lib/layout-engine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  RefreshCw,
  Type,
  Compass,
  FileText,
  Bookmark,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

// Neon Blue interaction effect constants (#1f51ff)
const NEON_BLUE = '#1f51ff';
const NEON_BLUE_GLOW = 'rgba(31, 81, 255, 0.85)';
const NEON_BLUE_AURA = 'rgba(31, 81, 255, 0.35)';
const NEON_BLUE_AMBIENT = 'rgba(31, 81, 255, 0.22)';
const NEON_BLUE_EDGE_REST = 'rgba(31, 81, 255, 0.14)';
const NEON_BLUE_EDGE_DIM = 'rgba(31, 81, 255, 0.025)';
const NEON_BLUE_ARROW_REST = 'rgba(31, 81, 255, 0.30)';
const NEON_BLUE_NEIGHBOR = 'rgba(31, 81, 255, 0.80)';

interface ForceGraphCanvasProps {
  graphData: GraphResponse;
  onSelectNode?: (nodeId: string | null) => void;
}

export function ForceGraphCanvas({ graphData, onSelectNode }: ForceGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    selectedNodeId,
    setSelectedNodeId,
    searchQuery,
    selectedFolder,
    selectedTag,
    hideOrphans,
    showLabels,
    setShowLabels,
    layoutAlgorithm,
  } = useGraphStore();

  // Physics simulation state
  const [isSimRunning, setIsSimRunning] = useState(true);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const alphaRef = useRef<number>(1.0);
  const isSimRunningRef = useRef<boolean>(true);
  isSimRunningRef.current = isSimRunning;

  // Viewport camera transform
  const transformRef = useRef({
    panX: 0,
    panY: 0,
    zoom: 1.0,
  });

  // Interaction tracking
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const draggedNodeRef = useRef<SimNode | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
  const mouseMovedDistanceRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInitialCenteringDone = useRef(false);

  // 1. Filter raw graph data according to active search, folder, tag, and orphan filters
  const { filteredNodes, filteredEdges } = useMemo(() => {
    return filterGraphData(graphData, {
      searchQuery,
      selectedFolder,
      selectedTag,
      hideOrphans,
    });
  }, [graphData, searchQuery, selectedFolder, selectedTag, hideOrphans]);

  // Compute degree stats for label LoD thresholds
  const degreeStats = useMemo(() => {
    const degrees = filteredNodes.map(
      (n) => (n.metadata?.incomingCount || 0) + (n.metadata?.outgoingCount || 0)
    );
    return computeDegreeStats(degrees);
  }, [filteredNodes]);

  // 2. Build / Update Simulation Nodes and Edges when filtered data changes
  useEffect(() => {
    const container = containerRef.current;
    const width = container?.clientWidth || 1000;
    const height = container?.clientHeight || 800;

    // Build existing map so node coordinates are preserved smoothly
    const existingMap = new Map<string, SimNode>(
      simNodesRef.current.map((n) => [n.id, n])
    );

    const { simNodes, simEdges } = initializeSimulationNodes(
      filteredNodes,
      filteredEdges,
      width,
      height,
      existingMap
    );

    // If active layout is static, apply computed layout coordinates directly
    if (layoutAlgorithm !== 'force') {
      const posMap = computeCanvasLayout(simNodes, simEdges, layoutAlgorithm, { width, height });
      simNodes.forEach((node) => {
        const pos = posMap.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
          node.startX = pos.x;
          node.startY = pos.y;
          node.targetX = pos.x;
          node.targetY = pos.y;
        }
        node.vx = 0;
        node.vy = 0;
      });
    }

    simNodesRef.current = simNodes;
    simEdgesRef.current = simEdges;

    // Reheat simulation only in force mode so new elements settle organically
    if (layoutAlgorithm === 'force') {
      alphaRef.current = 0.8;
    }

    // Initial fit view if first load
    if (!isInitialCenteringDone.current && simNodes.length > 0) {
      setTimeout(() => {
        handleFitView();
        isInitialCenteringDone.current = true;
      }, 60);
    }
  }, [filteredNodes, filteredEdges, layoutAlgorithm]);

  // 2b. Handle layoutAlgorithm transitions with smooth 500-600ms coordinate tweening
  const prevLayoutRef = useRef(layoutAlgorithm);
  const tweenStartTimeRef = useRef<number | null>(null);
  const isTweeningRef = useRef<boolean>(false);

  useEffect(() => {
    if (prevLayoutRef.current === layoutAlgorithm) return;
    prevLayoutRef.current = layoutAlgorithm;

    const container = containerRef.current;
    const width = container?.clientWidth || 1000;
    const height = container?.clientHeight || 800;

    if (simNodesRef.current.length === 0) return;

    if (layoutAlgorithm === 'force') {
      // Reheat simulation so elements settle organically
      alphaRef.current = 0.8;
      setIsSimRunning(true);
      isTweeningRef.current = false;
      tweenStartTimeRef.current = null;
    } else {
      // Compute deterministic target layout positions
      const posMap = computeCanvasLayout(
        simNodesRef.current,
        simEdgesRef.current,
        layoutAlgorithm,
        { width, height }
      );

      simNodesRef.current.forEach((node) => {
        const targetPos = posMap.get(node.id);
        node.startX = node.x;
        node.startY = node.y;
        if (targetPos) {
          node.targetX = targetPos.x;
          node.targetY = targetPos.y;
        } else {
          node.targetX = node.x;
          node.targetY = node.y;
        }
        node.vx = 0;
        node.vy = 0;
      });

      tweenStartTimeRef.current = performance.now();
      isTweeningRef.current = true;
    }
  }, [layoutAlgorithm]);

  // 3. Keep camera centered on selected node when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) return;
    const target = simNodesRef.current.find((n) => n.id === selectedNodeId);
    const container = containerRef.current;
    if (target && container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const targetZoom = Math.max(1.15, transformRef.current.zoom);

      // Smooth pan to selected node
      const targetPanX = width / 2 - target.x * targetZoom;
      const targetPanY = height / 2 - target.y * targetZoom;

      const startPanX = transformRef.current.panX;
      const startPanY = transformRef.current.panY;
      const startZoom = transformRef.current.zoom;
      const startTime = performance.now();
      const duration = 450;

      const animateCamera = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);

        transformRef.current.panX = startPanX + (targetPanX - startPanX) * ease;
        transformRef.current.panY = startPanY + (targetPanY - startPanY) * ease;
        transformRef.current.zoom = startZoom + (targetZoom - startZoom) * ease;

        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };

      requestAnimationFrame(animateCamera);
    }
  }, [selectedNodeId]);

  // Compute 1-hop neighborhood for currently selected and hovered nodes
  const { selectedNeighbors, hoveredNeighbors } = useMemo(() => {
    const sNeighbors = new Set<string>();
    const hNeighbors = new Set<string>();

    if (selectedNodeId) {
      filteredEdges.forEach((e) => {
        if (e.source === selectedNodeId) sNeighbors.add(e.target);
        if (e.target === selectedNodeId) sNeighbors.add(e.source);
      });
    }

    if (hoveredNode) {
      filteredEdges.forEach((e) => {
        if (e.source === hoveredNode.id) hNeighbors.add(e.target);
        if (e.target === hoveredNode.id) hNeighbors.add(e.source);
      });
    }

    return { selectedNeighbors: sNeighbors, hoveredNeighbors: hNeighbors };
  }, [selectedNodeId, hoveredNode, filteredEdges]);

  // Fit View / Zoom to Fit
  const handleFitView = useCallback(() => {
    const container = containerRef.current;
    const nodes = simNodesRef.current;
    if (!container || nodes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x - n.radius);
      maxX = Math.max(maxX, n.x + n.radius);
      minY = Math.min(minY, n.y - n.radius);
      maxY = Math.max(maxY, n.y + n.radius);
    });

    const graphWidth = maxX - minX || 100;
    const graphHeight = maxY - minY || 100;
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    const padding = 80;
    const scaleX = (width - padding * 2) / graphWidth;
    const scaleY = (height - padding * 2) / graphHeight;
    const targetZoom = Math.min(1.8, Math.max(0.25, Math.min(scaleX, scaleY)));

    const targetPanX = width / 2 - graphCenterX * targetZoom;
    const targetPanY = height / 2 - graphCenterY * targetZoom;

    // Smooth transition
    const startPanX = transformRef.current.panX;
    const startPanY = transformRef.current.panY;
    const startZoom = transformRef.current.zoom;
    const startTime = performance.now();
    const duration = 400;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      transformRef.current.panX = startPanX + (targetPanX - startPanX) * ease;
      transformRef.current.panY = startPanY + (targetPanY - startPanY) * ease;
      transformRef.current.zoom = startZoom + (targetZoom - startZoom) * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, []);

  // Zoom Helpers
  const handleZoomIn = () => {
    const container = containerRef.current;
    if (!container) return;
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    zoomAt(cx, cy, 1.25);
  };

  const handleZoomOut = () => {
    const container = containerRef.current;
    if (!container) return;
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    zoomAt(cx, cy, 0.8);
  };

  const zoomAt = (screenX: number, screenY: number, factor: number) => {
    const { panX, panY, zoom } = transformRef.current;
    const nextZoom = Math.min(3.5, Math.max(0.12, zoom * factor));

    const worldX = (screenX - panX) / zoom;
    const worldY = (screenY - panY) / zoom;

    transformRef.current.panX = screenX - worldX * nextZoom;
    transformRef.current.panY = screenY - worldY * nextZoom;
    transformRef.current.zoom = nextZoom;
  };

  // Reheat / Re-cluster simulation (or Re-align in static layouts)
  const handleReheat = () => {
    if (layoutAlgorithm === 'force') {
      alphaRef.current = 1.0;
      setIsSimRunning(true);
    } else {
      const container = containerRef.current;
      const width = container?.clientWidth || 1000;
      const height = container?.clientHeight || 800;
      if (simNodesRef.current.length === 0) return;

      const posMap = computeCanvasLayout(
        simNodesRef.current,
        simEdgesRef.current,
        layoutAlgorithm,
        { width, height }
      );

      simNodesRef.current.forEach((node) => {
        const targetPos = posMap.get(node.id);
        node.startX = node.x;
        node.startY = node.y;
        if (targetPos) {
          node.targetX = targetPos.x;
          node.targetY = targetPos.y;
        } else {
          node.targetX = node.x;
          node.targetY = node.y;
        }
        node.vx = 0;
        node.vy = 0;
      });

      tweenStartTimeRef.current = performance.now();
      isTweeningRef.current = true;
    }
  };

  // 4. Main 60fps Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      const container = containerRef.current;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;
        }
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Coordinate tweening across layout transitions
      if (isTweeningRef.current && tweenStartTimeRef.current !== null) {
        const elapsed = performance.now() - tweenStartTimeRef.current;
        const duration = 550;
        const progress = Math.min(1, elapsed / duration);
        // Smooth cubic ease-in-out
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        simNodesRef.current.forEach((n) => {
          if (
            n.targetX !== undefined &&
            n.startX !== undefined &&
            n.targetY !== undefined &&
            n.startY !== undefined
          ) {
            n.x = n.startX + (n.targetX - n.startX) * ease;
            n.y = n.startY + (n.targetY - n.startY) * ease;
          }
        });

        if (progress >= 1) {
          isTweeningRef.current = false;
          tweenStartTimeRef.current = null;
          handleFitView();
        }
      }

      // Physics step: only execute when layoutAlgorithm === 'force' and not tweening
      const isForceLayout = layoutAlgorithm === 'force';
      if (isForceLayout && isSimRunningRef.current && alphaRef.current > 0.002 && !isTweeningRef.current) {
        stepPhysicsSimulation(
          simNodesRef.current,
          simEdgesRef.current,
          width,
          height,
          alphaRef.current,
          DEFAULT_PHYSICS_PARAMS
        );
        // Gentle exponential cooling
        alphaRef.current *= 0.992;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 4.1 Background rendering (Deep Navy Canvas evoking a digital constellation)
      ctx.fillStyle = '#060b18';
      ctx.fillRect(0, 0, width, height);

      // Deep midnight-blue ambient substrate glow
      const centerGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        15,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      centerGrad.addColorStop(0, 'rgba(14, 30, 68, 0.65)');
      centerGrad.addColorStop(0.45, 'rgba(8, 18, 42, 0.40)');
      centerGrad.addColorStop(0.85, 'rgba(6, 11, 24, 0.85)');
      centerGrad.addColorStop(1, 'rgba(5, 9, 20, 1.0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, width, height);

      // Apply camera pan & zoom
      const { panX, panY, zoom } = transformRef.current;
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Faint digital constellation neural lattice dots in world space
      const latticeStep = 64;
      const startX = Math.floor((-panX / zoom) / latticeStep) * latticeStep - latticeStep;
      const endX = startX + (width / zoom) + latticeStep * 2;
      const startY = Math.floor((-panY / zoom) / latticeStep) * latticeStep - latticeStep;
      const endY = startY + (height / zoom) + latticeStep * 2;

      ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
      for (let gx = startX; gx < endX; gx += latticeStep) {
        for (let gy = startY; gy < endY; gy += latticeStep) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.85 / zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4.2 Neon Blue Edge Weighting & Interaction Connections
      const nodes = simNodesRef.current;
      const edges = simEdgesRef.current;
      const activeNodeId = selectedNodeId || hoveredNode?.id || null;

      edges.forEach((edge) => {
        const s = edge.sourceNode;
        const t = edge.targetNode;
        if (!s || !t) return;

        const isIncidentToActive =
          activeNodeId && (edge.source === activeNodeId || edge.target === activeNodeId);
        const isDimmed = activeNodeId && !isIncidentToActive;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isIncidentToActive) {
          // Highlighted connection: intense luminescent Neon Blue glow
          ctx.strokeStyle = NEON_BLUE;
          ctx.lineWidth = 2.4 / zoom;
          ctx.shadowColor = NEON_BLUE_GLOW;
          ctx.shadowBlur = 10;
        } else if (isDimmed) {
          // Subdued edges when other note is focused
          ctx.strokeStyle = NEON_BLUE_EDGE_DIM;
          ctx.lineWidth = 0.7 / zoom;
          ctx.shadowBlur = 0;
        } else {
          // Low-opacity hue (maintains clear connection paths without visual noise)
          ctx.strokeStyle = NEON_BLUE_EDGE_REST;
          ctx.lineWidth = 0.95 / zoom;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Directional arrowhead in matching Neon Blue
        if (!isDimmed || isIncidentToActive) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > t.radius + 14) {
            const arrowDist = t.radius + 5.5;
            const ax = t.x - (dx / len) * arrowDist;
            const ay = t.y - (dy / len) * arrowDist;
            const arrowSize = (isIncidentToActive ? 5.5 : 3.5) / zoom;
            const angle = Math.atan2(dy, dx);

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(
              ax - arrowSize * Math.cos(angle - Math.PI / 6),
              ay - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              ax - arrowSize * Math.cos(angle + Math.PI / 6),
              ay - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = isIncidentToActive
              ? NEON_BLUE
              : NEON_BLUE_ARROW_REST;
            ctx.fill();
          }
        }
      });

      // 4.3 Node Hierarchy & Categorical Neon Accents
      const q = searchQuery.trim().toLowerCase();

      nodes.forEach((node) => {
        const theme = getNeonNodeTheme(node);
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isNeighbor =
          Boolean(selectedNodeId && selectedNeighbors.has(node.id)) ||
          Boolean(hoveredNode && hoveredNeighbors.has(node.id));
        const isSearchMatch = Boolean(
          q &&
          (node.label.toLowerCase().includes(q) ||
            node.tags.some((t) => t.toLowerCase().includes(q)) ||
            node.folder.toLowerCase().includes(q))
        );
        const isDimmed = Boolean(
          (activeNodeId && !isSelected && !isHovered && !isNeighbor) ||
          (q && !isSearchMatch)
        );

        const r = node.radius;

        ctx.save();
        if (isDimmed) {
          ctx.globalAlpha = 0.14;
        }

        // Auras & Halos (Neon Blue for selection, hovering, and neighbors)
        if (isSelected) {
          // Pulsing Neon Blue halo for selected node
          const pulse = (Math.sin(performance.now() * 0.005) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 7 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(31, 81, 255, ${0.55 + pulse * 0.4})`;
          ctx.lineWidth = 2.5 / zoom;
          ctx.stroke();

          // Outer ambient Neon Blue glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 16, 0, Math.PI * 2);
          ctx.fillStyle = NEON_BLUE_AMBIENT;
          ctx.fill();
        } else if (isHovered) {
          // Neon Blue hover ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 5.5, 0, Math.PI * 2);
          ctx.strokeStyle = NEON_BLUE;
          ctx.lineWidth = 2.2 / zoom;
          ctx.stroke();

          // Soft bloom in Neon Blue
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 12, 0, Math.PI * 2);
          ctx.fillStyle = NEON_BLUE_AURA;
          ctx.fill();
        } else if (isNeighbor) {
          // Connected neighbor ring in Neon Blue
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = NEON_BLUE_NEIGHBOR;
          ctx.lineWidth = 1.6 / zoom;
          ctx.stroke();
        } else if (isSearchMatch) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffe600';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }


        // Node Circle Body: Pure flat neon color without radial gradients
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = theme.accentHex;
        ctx.fill();

        // Node High-Contrast Perimeter Stroke
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        if (node.isOrphan) {
          ctx.setLineDash([3, 2]);
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isSelected ? NEON_BLUE : theme.borderRgba;
        }
        ctx.lineWidth = (isSelected ? 2.5 : 1.1) / zoom;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      });

      // 4.4 Adaptive Label Placement Rendering (Clean sans-serif typography adjacent to nodes)
      if (showLabels) {
        nodes.forEach((node) => {
          const theme = getNeonNodeTheme(node);
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const isNeighbor =
            Boolean(selectedNodeId && selectedNeighbors.has(node.id)) ||
            Boolean(hoveredNode && hoveredNeighbors.has(node.id));
          const isSearchMatch = Boolean(
            q &&
            (node.label.toLowerCase().includes(q) ||
              node.tags.some((t) => t.toLowerCase().includes(q)))
          );

          // LoD visibility assessment
          const labelInfo = shouldRenderNodeLabel(
            node,
            zoom,
            isSelected,
            isHovered,
            isNeighbor,
            degreeStats.medianDegree
          );

          if (!labelInfo.visible && !isSearchMatch) return;

          const r = node.radius;
          const labelText = node.label;
          const fontSize = Math.max(9, Math.min(14, 11 / Math.pow(zoom, 0.15)));
          ctx.font = `${theme.category === 'cyan' || isSelected ? '600' : '500'} ${fontSize}px system-ui, -apple-system, sans-serif`;

          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          // Adaptive placement: position adjacent to node; if clipping right screen edge, flip left
          const screenX = node.x * zoom + panX;
          const placeLeft = screenX + (r + textWidth + 20) * zoom > width;

          const labelX = placeLeft ? node.x - r - 6 - textWidth : node.x + r + 6;
          const labelY = node.y + textHeight * 0.35;

          ctx.save();
          const effectiveAlpha = Math.min(1, labelInfo.alpha);
          const isDimmed = activeNodeId && !isSelected && !isHovered && !isNeighbor && !isSearchMatch;
          ctx.globalAlpha = isDimmed ? 0.14 : effectiveAlpha;

          // Translucent deep navy backdrop pill for crisp readability over intersecting lines
          const paddingH = 4;
          const paddingV = 2;
          ctx.fillStyle = theme.pillBg;
          ctx.strokeStyle = isSelected
            ? NEON_BLUE
            : isHovered
              ? NEON_BLUE
              : 'rgba(31, 81, 255, 0.22)';
          ctx.lineWidth = 1 / zoom;

          ctx.beginPath();
          ctx.roundRect(
            labelX - paddingH,
            labelY - textHeight + paddingV,
            textWidth + paddingH * 2,
            textHeight + paddingV * 2,
            4 / zoom
          );
          ctx.fill();
          ctx.stroke();

          // Typography color
          ctx.fillStyle = isSelected
            ? '#ffffff'
            : isHovered
              ? '#5c8aff'
              : isSearchMatch
                ? '#ffe600'
                : theme.textColor;

          ctx.fillText(labelText, labelX, labelY);
          ctx.restore();
        });
      }

      ctx.restore(); // Restore camera pan/zoom
      ctx.restore(); // Restore canvas scale

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    showLabels,
    selectedNodeId,
    hoveredNode,
    selectedNeighbors,
    hoveredNeighbors,
    degreeStats,
    searchQuery,
  ]);

  // 5. Mouse Interaction Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { worldX: 0, worldY: 0, screenX: 0, screenY: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { panX, panY, zoom } = transformRef.current;
    const worldX = (screenX - panX) / zoom;
    const worldY = (screenY - panY) / zoom;
    return { worldX, worldY, screenX, screenY };
  };

  const findNodeAt = (worldX: number, worldY: number): SimNode | null => {
    const nodes = simNodesRef.current;
    // Iterate in reverse so top-drawn nodes take precedence
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      // Hit target includes generous padding for small leaf notes
      const hitRadius = Math.max(node.radius, 10);
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only
    const { worldX, worldY, screenX, screenY } = getCanvasCoords(e);
    mouseMovedDistanceRef.current = 0;

    const hitNode = findNodeAt(worldX, worldY);
    if (hitNode) {
      draggedNodeRef.current = hitNode;
      hitNode.fx = hitNode.x;
      hitNode.fy = hitNode.y;
      alphaRef.current = 0.5; // Reheat physics during drag
      setIsSimRunning(true);
    } else {
      isPanningRef.current = true;
      panStartRef.current = {
        x: screenX,
        y: screenY,
        initialPanX: transformRef.current.panX,
        initialPanY: transformRef.current.panY,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, screenX, screenY } = getCanvasCoords(e);

    // Node Dragging
    if (draggedNodeRef.current) {
      mouseMovedDistanceRef.current += 1;
      draggedNodeRef.current.fx = worldX;
      draggedNodeRef.current.fy = worldY;
      alphaRef.current = Math.max(alphaRef.current, 0.35);
      return;
    }

    // Viewport Panning
    if (isPanningRef.current) {
      const dx = screenX - panStartRef.current.x;
      const dy = screenY - panStartRef.current.y;
      mouseMovedDistanceRef.current += Math.hypot(dx, dy);

      transformRef.current.panX = panStartRef.current.initialPanX + dx;
      transformRef.current.panY = panStartRef.current.initialPanY + dy;
      return;
    }

    // Hover detection
    const hit = findNodeAt(worldX, worldY);
    if (hit !== hoveredNode) {
      setHoveredNode(hit);
      if (hit) {
        setHoverPos({ x: screenX, y: screenY });
      } else {
        setHoverPos(null);
      }
    } else if (hit) {
      setHoverPos({ x: screenX, y: screenY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY } = getCanvasCoords(e);

    if (draggedNodeRef.current) {
      // Release fixed position gently so node continues settling
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
    }

    isPanningRef.current = false;

    // If mouse barely moved, treat as click event
    if (mouseMovedDistanceRef.current < 6) {
      const hitNode = findNodeAt(worldX, worldY);
      if (hitNode) {
        const nextId = hitNode.id === selectedNodeId ? null : hitNode.id;
        setSelectedNodeId(nextId);
        if (onSelectNode) onSelectNode(nextId);
      } else {
        // Clicked background -> clear selection
        setSelectedNodeId(null);
        if (onSelectNode) onSelectNode(null);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { screenX, screenY } = getCanvasCoords(e);
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(screenX, screenY, zoomFactor);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY } = getCanvasCoords(e);
    const hit = findNodeAt(worldX, worldY);
    if (hit) {
      setSelectedNodeId(hit.id);
      if (onSelectNode) onSelectNode(hit.id);
    } else {
      handleFitView();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-[#060b18]"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full block ${draggedNodeRef.current
          ? 'cursor-grabbing'
          : isPanningRef.current
            ? 'cursor-grabbing'
            : hoveredNode
              ? 'cursor-pointer'
              : 'cursor-grab'
          }`}
      />

      {/* Interactive Floating HUD Controls (Bottom-Left) */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2 z-20">
        <div className="flex items-center gap-1 bg-[#0a1228]/85 backdrop-blur-md border border-cyan-900/40 p-1 rounded-2xl shadow-2xl">
          <button
            onClick={handleZoomIn}
            className="p-2 text-cyan-300 hover:text-white hover:bg-cyan-950/50 rounded-xl transition"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-cyan-300 hover:text-white hover:bg-cyan-950/50 rounded-xl transition"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 text-blue-300 hover:text-white hover:bg-blue-950/50 rounded-xl transition"
            title="Fit View / Reset Camera"
            aria-label="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-blue-900/50 mx-0.5" />
          {/* Simulation & Layout Controls (Rendered across all layouts) */}
          <button
            onClick={() => {
              if (layoutAlgorithm === 'force') {
                setIsSimRunning(!isSimRunning);
              }
            }}
            disabled={layoutAlgorithm !== 'force'}
            aria-disabled={layoutAlgorithm !== 'force'}
            className={`p-2 rounded-xl transition ${layoutAlgorithm === 'force'
                ? isSimRunning
                  ? 'text-[#1f51ff] hover:bg-blue-500/10'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/80'
                : 'text-neutral-600 opacity-40 cursor-not-allowed'
              }`}
            title={
              layoutAlgorithm === 'force'
                ? isSimRunning
                  ? 'Pause'
                  : 'Resume'
                : 'Physics simulation is inactive in static layouts'
            }
            aria-label={
              layoutAlgorithm === 'force'
                ? 'Toggle Physics Simulation'
                : 'Physics simulation is inactive in static layouts'
            }
          >
            {layoutAlgorithm === 'force' && !isSimRunning ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleReheat}
            className="p-2 text-[#ffe600] hover:text-yellow-300 hover:bg-yellow-500/10 rounded-xl transition"
            title="Refresh Graph"
            aria-label="Refresh Graph"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2 rounded-xl transition ${showLabels
              ? 'text-pink-400 hover:bg-pink-500/10'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/80'
              }`}
            title={showLabels ? 'Hide Labels' : 'Show Labels'}
            aria-label="Toggle Labels"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Neon Category Legend (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-20 hidden sm:flex items-center gap-3 bg-[#0a1228]/85 backdrop-blur-md border border-cyan-900/40 px-3.5 py-2 rounded-2xl shadow-xl text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
          <span className="text-cyan-200 font-medium">Core Hubs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff2a85] shadow-[0_0_6px_#ff2a85]" />
          <span className="text-pink-200 font-medium">Concepts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffe600] shadow-[0_0_6px_#ffe600]" />
          <span className="text-yellow-200 font-medium">Sources</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
          <span className="text-slate-300 font-medium">Notes</span>
        </div>
      </div>

      {/* Floating Hover Card Tooltip in Neon Glass */}
      {hoveredNode && hoverPos && !isPanningRef.current && !draggedNodeRef.current && (() => {
        const hoveredTheme = getNeonNodeTheme(hoveredNode);
        return (
          <div
            style={{
              left: Math.min(hoverPos.x + 16, (containerRef.current?.clientWidth || 800) - 270),
              top: Math.max(16, Math.min(hoverPos.y - 30, (containerRef.current?.clientHeight || 600) - 160)),
            }}
            className="pointer-events-none absolute z-30 w-64 bg-[#070e24]/95 backdrop-blur-xl border border-[#1f51ff]/35 p-3.5 rounded-2xl shadow-2xl text-xs text-neutral-200 transition-opacity animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: hoveredTheme.accentHex, boxShadow: `0 0 8px ${hoveredTheme.accentHex}` }}
                />
                <span className="font-semibold text-white truncate text-[13px]">
                  {hoveredNode.label}
                </span>
              </div>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium border"
                style={{
                  backgroundColor: `${hoveredTheme.accentHex}1a`,
                  color: hoveredTheme.accentHex,
                  borderColor: `${hoveredTheme.accentHex}40`,
                }}
              >
                {hoveredTheme.categoryLabel}
              </span>
            </div>

            {hoveredNode.folder && (
              <div className="text-[10px] text-cyan-400/80 font-mono mb-2 truncate">
                {hoveredNode.folder}
              </div>
            )}

            {hoveredNode.excerpt && (
              <p className="text-[11px] text-slate-300 line-clamp-2 mb-2.5 leading-relaxed">
                {hoveredNode.excerpt}
              </p>
            )}

            <div className="pt-2 border-t border-cyan-950/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-[#1f51ff]" />
                <span>{hoveredNode.incomingCount} incoming</span>
              </span>
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-[#38bdf8]" />
                <span>{hoveredNode.outgoingCount} outgoing</span>
              </span>
            </div>
          </div>
        );
      })()}

      {/* Empty Filtered State indicator */}
      {simNodesRef.current.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-[#0a1228]/85 backdrop-blur-md border border-cyan-900/40 px-6 py-4 rounded-2xl text-center shadow-xl">
            <p className="text-sm font-medium text-cyan-200">No notes match current filters</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or folder/tag selection
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Note, Block, GraphNode, GraphLink } from '../types';

interface GraphViewProps {
  notes: Note[];
  block: Block;
  onNodeClick: (noteId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, block, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const noteMap = new Map<string, Note>(notes.map(note => [note.id, note]));
    const noteTitleMap = new Map<string, Note>(notes.map(note => [note.title.toLowerCase(), note]));

    // Add block as central node
    const graphNodes: GraphNode[] = [{
      id: block.id,
      title: block.title,
      level: 0,
      isBlockNode: true,
    }];
    const graphLinks: GraphLink[] = [];

    // Add notes as nodes
    notes.forEach(note => {
      graphNodes.push({
        id: note.id,
        title: note.title,
        level: note.parentId ? 2 : 1, // Simple level calculation
      });

      // Link to parent or block
      if (note.parentId && noteMap.has(note.parentId)) {
        graphLinks.push({ source: note.id, target: note.parentId });
      } else {
        graphLinks.push({ source: note.id, target: block.id });
      }

      // Link based on [[...]] syntax
      note.links.forEach(linkTitle => {
        const targetNote = noteTitleMap.get(linkTitle.toLowerCase());
        if (targetNote && targetNote.id !== note.id) {
          graphLinks.push({ source: note.id, target: targetNote.id });
        }
      });
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [notes, block]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    // Clear previous render
    svg.selectAll("*").remove();

    svg.attr('width', width).attr('height', height);
    svg.attr('viewBox', [-width / 2, -height / 2, width, height]);
    
    // Create a group for all graph elements to apply zoom transformations
    const g = svg.append("g");

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => (d.source as GraphNode).level === 0 || (d.target as GraphNode).level === 0 ? 120 : 60))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide().radius(d => d.isBlockNode ? 40 : 25));

    const drag = (simulation: d3.Simulation<GraphNode, undefined>) => {
      function dragstarted(event: d3.D3DragEvent<Element, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event: d3.D3DragEvent<Element, GraphNode, GraphNode>, d: GraphNode) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event: d3.D3DragEvent<Element, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0);
        // Do not nullify fx/fy to keep the node pinned.
        // d.fx = null;
        // d.fy = null;
      }
      
      return d3.drag<any, GraphNode>()
          .clickDistance(3) // Distinguish clicks from drags to fix node navigation
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    }
    
    // Append links and nodes to the main group `g`
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "var(--color-border)")
        .attr("stroke-width", 1.5);

    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "cursor-pointer")
        .call(drag(simulation) as any);
        
    const getNodeFillColor = (level: number) => {
        if (level === 0) return 'var(--color-primary)';
        if (level === 1) return 'var(--color-panel-hover-bg)';
        return 'var(--color-panel-bg)';
    };

    const getNodeStrokeColor = (level: number) => {
        if (level === 0) return 'var(--color-primary-hover)';
        if (level === 1) return 'var(--color-primary)';
        return 'var(--color-border)';
    };

    node.append("circle")
        .attr("r", d => d.isBlockNode ? 30 : 15)
        .attr("fill", d => getNodeFillColor(d.level))
        .attr("stroke", d => getNodeStrokeColor(d.level))
        .attr("stroke-width", 2);

    node.append("text")
        .text(d => d.title)
        .attr("x", 0)
        .attr("y", d => d.isBlockNode ? 45 : 25)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-base)")
        .attr("font-size", "12px")
        .style("pointer-events", "none");

    node.on('click', (event, d) => {
        if (!d.isBlockNode) {
            onNodeClick(d.id);
        }
    });

    node.on('dblclick', (event, d) => {
      // Unpin the node on double click
      d.fx = null;
      d.fy = null;
    });
    
    simulation.on("tick", () => {
      link
          .attr("x1", d => (d.source as GraphNode).x!)
          .attr("y1", d => (d.source as GraphNode).y!)
          .attr("x2", d => (d.target as GraphNode).x!)
          .attr("y2", d => (d.target as GraphNode).y!);

      node
          .attr("transform", d => `translate(${d.x}, ${d.y})`);
    });
    
    // --- ZOOM IMPLEMENTATION ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5]) // Set zoom range
        .filter((event) => {
            // Allow panning with middle mouse button (1), in addition to left (0).
            return (!event.ctrlKey || event.type === 'wheel') && (event.button === 0 || event.button === 1);
        })
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    const resizeObserver = new ResizeObserver(() => {
        width = container.clientWidth;
        height = container.clientHeight;
        svg.attr('width', width).attr('height', height);
        svg.attr('viewBox', [-width / 2, -height / 2, width, height]);
        simulation.force("center", d3.forceCenter(0, 0));
        simulation.alpha(0.3).restart();
    });

    resizeObserver.observe(container);

    return () => {
        simulation.stop();
        resizeObserver.disconnect();
    };
  }, [nodes, links, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[--color-bg] overflow-hidden">
        <svg ref={svgRef}></svg>
    </div>
  );
};
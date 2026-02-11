import React, { useEffect, useRef } from 'react';
import { CommunityNode } from '../types';

interface ConstellationProps {
  nodes: CommunityNode[];
  onNodeClick: (node: CommunityNode) => void;
  userNodeId?: string;
  highlightQuery?: string;
}

const Constellation: React.FC<ConstellationProps> = ({ nodes, onNodeClick, userNodeId, highlightQuery = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Rotation state
  const rotation = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  // Interaction state
  const mousePos = useRef({ x: -1000, y: -1000 });
  const hoveredNodeRef = useRef<CommunityNode | null>(null);

  // Shooting Star State
  const shootingStar = useRef<{x: number, y: number, length: number, speed: number, life: number, active: boolean}>({
      x: 0, y: 0, length: 0, speed: 0, life: 0, active: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Neural Network Constants
    const CONNECTION_DISTANCE = 200;
    const PERSPECTIVE = 600;
    
    // Normalize nodes to 3D space centered at 0,0,0
    const points = nodes.map(node => ({
        ...node,
        x3d: (node.x - 50) * 20,
        y3d: (node.y - 50) * 20,
        z3d: node.z || (Math.random() - 0.5) * 300
    }));

    const render = () => {
      // Smooth Rotation
      rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.1;
      rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.1;

      // Auto rotation
      if (!isDragging.current) {
         targetRotation.current.y += 0.0002;
      }

      ctx.fillStyle = '#0f172a'; 
      ctx.clearRect(0, 0, width, height);
      
      // --- SHOOTING STAR LOGIC ---
      if (!shootingStar.current.active) {
          if (Math.random() < 0.005) { // 0.5% chance per frame to spawn
              shootingStar.current = {
                  x: Math.random() * width,
                  y: Math.random() * height * 0.5,
                  length: Math.random() * 80 + 20,
                  speed: Math.random() * 15 + 10,
                  life: 1.0,
                  active: true
              };
          }
      } else {
          const s = shootingStar.current;
          s.x += s.speed;
          s.y += s.speed * 0.5; // Angled down
          s.life -= 0.01;
          
          if (s.life <= 0 || s.x > width || s.y > height) {
              s.active = false;
          } else {
              const tailX = s.x - s.length;
              const tailY = s.y - s.length * 0.5;
              const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
              grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
              grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
              
              ctx.beginPath();
              ctx.strokeStyle = grad;
              ctx.lineWidth = 2;
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(tailX, tailY);
              ctx.stroke();
          }
      }

      // --- PROJECTION ---
      const projectedPoints = points.map(p => {
         let x = p.x3d * Math.cos(rotation.current.y) - p.z3d * Math.sin(rotation.current.y);
         let z = p.z3d * Math.cos(rotation.current.y) + p.x3d * Math.sin(rotation.current.y);
         let y = p.y3d * Math.cos(rotation.current.x) - z * Math.sin(rotation.current.x);
         z = z * Math.cos(rotation.current.x) + p.y3d * Math.sin(rotation.current.x);

         const scale = PERSPECTIVE / (PERSPECTIVE + z + 1000); 
         const x2d = x * scale + width / 2;
         const y2d = y * scale + height / 2;

         // Determine match status
         const isMatch = !highlightQuery || 
                         p.activity.toLowerCase().includes(highlightQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(highlightQuery.toLowerCase()) ||
                         p.id === userNodeId;

         return { ...p, x2d, y2d, scale, zIndex: z, isMatch };
      });

      projectedPoints.sort((a, b) => b.zIndex - a.zIndex);

      // --- HIT TEST ---
      let closestNode: typeof projectedPoints[0] | null = null;
      for (let i = projectedPoints.length - 1; i >= 0; i--) {
          const p = projectedPoints[i];
          if (p.scale < 0 || !p.isMatch) continue; 

          const dx = mousePos.current.x - p.x2d;
          const dy = mousePos.current.y - p.y2d;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const hitRadius = Math.max(20, p.size * p.scale * 2);
          
          if (dist < hitRadius) {
              closestNode = p;
              break; 
          }
      }
      hoveredNodeRef.current = closestNode;
      if (containerRef.current) {
          containerRef.current.style.cursor = closestNode ? 'pointer' : isDragging.current ? 'grabbing' : 'grab';
      }

      // --- DRAWING NODES & CONNECTIONS ---
      
      // Connections
      ctx.lineWidth = 1;
      for (let i = 0; i < projectedPoints.length; i++) {
        const p1 = projectedPoints[i];
        if (p1.scale < 0) continue; 

        for (let j = i + 1; j < projectedPoints.length; j++) {
            const p2 = projectedPoints[j];
            if (p2.scale < 0) continue;

            // Don't draw connections if either node is dimmed by search
            if (!p1.isMatch || !p2.isMatch) continue;

            const dx = p1.x3d - p2.x3d;
            const dy = p1.y3d - p2.y3d;
            const dz = p1.z3d - p2.z3d;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

            const isUserConnection = p1.id === userNodeId || p2.id === userNodeId;
            const maxDist = isUserConnection ? CONNECTION_DISTANCE * 1.5 : CONNECTION_DISTANCE;

            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * (isUserConnection ? 0.6 : 0.2);
                const grad = ctx.createLinearGradient(p1.x2d, p1.y2d, p2.x2d, p2.y2d);
                
                let startColor = p1.category === p2.category ? p1.color : '#ffffff';
                let endColor = p1.category === p2.category ? p1.color : '#ffffff';

                // Force white connections for user to make it "glow" as a constellation
                if (isUserConnection) {
                    startColor = '#ffffff';
                    endColor = '#ffffff';
                }

                grad.addColorStop(0, `${startColor}${Math.floor(alpha * 255).toString(16).padStart(2,'0')}`);
                grad.addColorStop(1, `${endColor}${Math.floor(alpha * 255).toString(16).padStart(2,'0')}`);
                
                ctx.beginPath();
                ctx.strokeStyle = grad;
                ctx.lineWidth = isUserConnection ? 2 : 1;
                ctx.moveTo(p1.x2d, p1.y2d);
                ctx.lineTo(p2.x2d, p2.y2d);
                ctx.stroke();
            }
        }
      }

      // Nodes
      projectedPoints.forEach(p => {
          if (p.scale < 0) return;

          const isUser = p.id === userNodeId;
          const isHover = hoveredNodeRef.current?.id === p.id;
          const opacity = p.isMatch ? 1 : 0.1; // Dim irrelevant nodes

          const size = p.size * p.scale * (isHover ? 1.8 : 1) * (isUser ? 1.5 : 1);
          
          // Glow
          if (p.isMatch || isUser) {
              const glowSize = isUser ? size * 6 : size * 3;
              const grad = ctx.createRadialGradient(p.x2d, p.y2d, size * 0.2, p.x2d, p.y2d, glowSize);
              
              // Brilliant white glow for user
              const glowColor = isUser ? '#ffffff' : p.color;
              const glowAlpha = isUser ? 0.6 : opacity;

              grad.addColorStop(0, `${glowColor}${Math.floor(glowAlpha * 255).toString(16).padStart(2,'0')}`);
              grad.addColorStop(1, 'transparent');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(p.x2d, p.y2d, glowSize, 0, Math.PI * 2);
              ctx.fill();
          }

          // User specific extra glow pulse ring
          if (isUser) {
              const pulseSize = size * 3 + Math.sin(Date.now() / 400) * 8;
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(Date.now()/400)*0.2})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(p.x2d, p.y2d, pulseSize, 0, Math.PI * 2);
              ctx.stroke();
          }

          // Core
          ctx.fillStyle = isUser ? '#ffffff' : `${p.color}${Math.floor(opacity * 255).toString(16).padStart(2,'0')}`;
          ctx.beginPath();
          ctx.arc(p.x2d, p.y2d, size, 0, Math.PI * 2);
          ctx.fill();

          // Verified Badge (Safety Layer)
          if (p.verified && p.isMatch && !isUser) {
              ctx.fillStyle = '#38bdf8'; // Sky blue check
              ctx.beginPath();
              ctx.arc(p.x2d + size, p.y2d - size, size * 0.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1;
              ctx.stroke();
          }

          // Hover Ring
          if (isHover && p.isMatch) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(p.x2d, p.y2d, size + 4, 0, Math.PI * 2);
              ctx.stroke();
          }

          // Label
          if ((isHover || isUser) && p.isMatch) {
              ctx.font = `bold ${Math.max(10, 14 * p.scale)}px Inter`;
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.shadowColor = 'black';
              ctx.shadowBlur = 4;
              const label = isUser ? 'You' : `${p.activity} (${p.distance})`;
              ctx.fillText(label, p.x2d, p.y2d - size - 8);
              
              if (p.verified && !isUser) {
                   ctx.font = `${Math.max(8, 10 * p.scale)}px Inter`;
                   ctx.fillStyle = '#38bdf8';
                   ctx.fillText("✓ Verified", p.x2d, p.y2d - size - 22);
              }
              
              ctx.shadowBlur = 0;
          }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, userNodeId, highlightQuery]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
        mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (isDragging.current) {
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        targetRotation.current.x += deltaY * 0.005;
        targetRotation.current.y += deltaX * 0.005;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
      if (hoveredNodeRef.current) {
          onNodeClick(hoveredNodeRef.current);
      }
  };

  return (
    <div 
        ref={containerRef}
        className="absolute inset-0 z-0 bg-[#0f172a] cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={() => {
            isDragging.current = false;
            mousePos.current = { x: -1000, y: -1000 };
        }}
    >
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-8 right-8 text-xs text-slate-500 pointer-events-none select-none bg-black/40 backdrop-blur px-4 py-2 rounded-xl border border-white/10 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-white font-bold">Network Active</span>
            </div>
            <div className="text-[10px] text-slate-400">Proximity Mode (KM)</div>
            <div className="flex items-center gap-1 text-[10px] text-sky-400">
                <span>✓</span> Verified Profiles
            </div>
        </div>
    </div>
  );
};

export default Constellation;
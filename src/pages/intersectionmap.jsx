import React, { useEffect, useRef, useState } from 'react';

// --- CONFIGURATION CONSTANTS ---
const CANVAS_SIZE = 800;
const ROAD_WIDTH = 200; // Total width for 5 lanes (40px per lane)
const LANE_WIDTH = 40;
const CENTER = CANVAS_SIZE / 2;

// Traffic light states: 0 = North/South Green, 1 = East/West Green
const SIGNAL_PHASES = {
  NS_GREEN: 'NS_GREEN',
  EW_GREEN: 'EW_GREEN'
};

export default function IntersectionSimulation() {
  const canvasRef = useRef(null);
  const [signalPhase, setSignalPhase] = useState(SIGNAL_PHASES.NS_GREEN);
  const [timer, setTimer] = useState(5);

  // Handle Traffic Light Timing Logic
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setSignalPhase((current) => 
            current === SIGNAL_PHASES.NS_GREEN ? SIGNAL_PHASES.EW_GREEN : SIGNAL_PHASES.NS_GREEN
          );
          return 5; // Reset to 5 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  // Main Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Initialize sample vehicle data
    // Approaches: 'N', 'S', 'E', 'W'
    // Lanes: 0 (Left/Left-only), 1 (Middle/Straight-only), 2 (Right/Straight & Right)
    let vehicles = [
      { id: 1, approach: 'S', lane: 0, progress: 0.1, speed: 0.005, color: '#3b82f6', turn: 'L' },
      { id: 2, approach: 'S', lane: 1, progress: 0.3, speed: 0.006, color: '#ef4444', turn: 'S' },
      { id: 3, approach: 'S', lane: 2, progress: 0.0, speed: 0.004, color: '#eab308', turn: 'R' },
      { id: 4, approach: 'N', lane: 1, progress: 0.2, speed: 0.005, color: '#10b981', turn: 'S' },
      { id: 5, approach: 'E', lane: 0, progress: 0.15, speed: 0.0045, color: '#a855f7', turn: 'L' },
      { id: 6, approach: 'W', lane: 2, progress: 0.4, speed: 0.006, color: '#3b82f6', turn: 'R' }
    ];

    const drawIntersection = () => {
      // 1. Background (Grass)
      ctx.fillStyle = '#457b3b';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Draw Roads (Gray Asphalt)
      ctx.fillStyle = '#7a7a7a';
      // Vertical Road
      ctx.fillRect(CENTER - ROAD_WIDTH / 2, 0, ROAD_WIDTH, CANVAS_SIZE);
      // Horizontal Road
      ctx.fillRect(0, CENTER - ROAD_WIDTH / 2, ROAD_WIDTH, CANVAS_SIZE);
      // Central Intersection Box
      ctx.fillRect(CENTER - ROAD_WIDTH / 2, CENTER - ROAD_WIDTH / 2, ROAD_WIDTH, ROAD_WIDTH);

      // 3. Lane Markings, Dividers, and Arrows
      drawAllRoadMarkings(ctx);

      // 4. Draw Traffic Light Structures
      drawTrafficLights(ctx, signalPhase);

      // 5. Update and Draw Vehicles
      vehicles = vehicles.map(vehicle => {
        let updatedVehicle = { ...vehicle };
        
        // Traffic light logic check before entering the intersection box
        const isNS = updatedVehicle.approach === 'N' || updatedVehicle.approach === 'S';
        const hasGreen = isNS ? signalPhase === SIGNAL_PHASES.NS_GREEN : signalPhase === SIGNAL_PHASES.EW_GREEN;

        // Progress threshold where vehicles stop at red light (just before center box)
        if (updatedVehicle.progress >= 0.45 && updatedVehicle.progress < 0.5 && !hasGreen) {
          // Stay stopped
        } else {
          updatedVehicle.progress += updatedVehicle.speed;
          // Recycle vehicle once it clears the viewport edge
          if (updatedVehicle.progress > 1.2) {
            updatedVehicle.progress = -0.1;
            // Randomize a new lane/turn path variant on reset
            updatedVehicle.lane = Math.floor(Math.random() * 3);
            updatedVehicle.turn = updatedVehicle.lane === 0 ? 'L' : updatedVehicle.lane === 1 ? 'S' : Math.random() > 0.5 ? 'S' : 'R';
          }
        }

        drawVehicle(ctx, updatedVehicle);
        return updatedVehicle;
      });

      animationFrameId = requestAnimationFrame(drawIntersection);
    };

    drawIntersection();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [signalPhase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif', background: '#222', padding: '20px', borderRadius: '12px' }}>
      <div style={{ color: '#fff', marginBottom: '15px', fontSize: '1.2rem', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 5px 0' }}>4-Way Signalized Intersection</h2>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#aaa' }}>
          Signal Phase: <strong style={{ color: signalPhase === SIGNAL_PHASES.NS_GREEN ? '#4ade80' : '#f87171' }}>{signalPhase}</strong> | Next change in: <strong>{timer}s</strong>
        </p>
      </div>
      <canvas 
        ref={canvasRef} 
        width={CANVAS_SIZE} 
        height={CANVAS_SIZE} 
        style={{ border: '4px solid #444', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}

// --- CANVAS DRAWING HELPER FUNCTIONS ---

function drawAllRoadMarkings(ctx) {
  ctx.save();
  // We can cycle through 4 rotations to draw all 4 road branches identical layouts
  for (let i = 0; i < 4; i++) {
    ctx.translate(CENTER, CENTER);
    ctx.rotate((i * Math.PI) / 2);
    ctx.translate(-CENTER, -CENTER);

    const roadLeft = CENTER - ROAD_WIDTH / 2;
    
    // Draw solid yellow center divider line separating incoming (3 lanes) and outgoing (2 lanes)
    // Left side of road (from intersection perspective looking down) has 2 lanes, right side has 3 lanes
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(roadLeft + LANE_WIDTH * 2, CENTER + ROAD_WIDTH / 2);
    ctx.lineTo(roadLeft + LANE_WIDTH * 2, CANVAS_SIZE);
    ctx.stroke();

    // Draw dashed white lane separators
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 15]);

    // Outgoing lane line (separates the 2 outgoing lanes)
    ctx.beginPath();
    ctx.moveTo(roadLeft + LANE_WIDTH, CENTER + ROAD_WIDTH / 2);
    ctx.lineTo(roadLeft + LANE_WIDTH, CANVAS_SIZE);
    ctx.stroke();

    // Incoming lane lines (separates the 3 incoming lanes)
    ctx.beginPath();
    ctx.moveTo(roadLeft + LANE_WIDTH * 3, CENTER + ROAD_WIDTH / 2);
    ctx.lineTo(roadLeft + LANE_WIDTH * 3, CANVAS_SIZE);
    ctx.moveTo(roadLeft + LANE_WIDTH * 4, CENTER + ROAD_WIDTH / 2);
    ctx.lineTo(roadLeft + LANE_WIDTH * 4, CANVAS_SIZE);
    ctx.stroke();

    // White solid stop line for incoming lanes
    ctx.restore(); ctx.save(); // Reset transforms momentarily to handle crisp stop lines safely
    ctx.translate(CENTER, CENTER);
    ctx.rotate((i * Math.PI) / 2);
    ctx.translate(-CENTER, -CENTER);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(roadLeft + LANE_WIDTH * 2, CENTER + ROAD_WIDTH / 2);
    ctx.lineTo(roadLeft + ROAD_WIDTH, CENTER + ROAD_WIDTH / 2);
    ctx.stroke();

    // Draw Ground Directional Lane Arrows
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const arrowY = CENTER + ROAD_WIDTH / 2 + 50;

    // Left Lane (Lane index 0 from inside out: left turn only)
    drawArrow(ctx, roadLeft + LANE_WIDTH * 2.5, arrowY, 'L');
    // Middle Lane (Lane index 1: straight only)
    drawArrow(ctx, roadLeft + LANE_WIDTH * 3.5, arrowY, 'S');
    // Right Lane (Lane index 2: straight and right turn)
    drawArrow(ctx, roadLeft + LANE_WIDTH * 4.5, arrowY, 'R');
  }
  ctx.restore();
}

function drawArrow(ctx, x, y, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.8, 0.8);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (type === 'S') {
    ctx.beginPath();
    ctx.moveTo(0, 15); ctx.lineTo(0, -15);
    ctx.lineTo(-5, -7); ctx.moveTo(0, -15); ctx.lineTo(5, -7);
    ctx.stroke();
  } else if (type === 'L') {
    ctx.beginPath();
    ctx.moveTo(0, 15); ctx.lineTo(0, 0); ctx.quadraticCurveTo(0, -5, -10, -5);
    ctx.lineTo(-5, -10); ctx.moveTo(-10, -5); ctx.lineTo(-5, 0);
    ctx.stroke();
  } else if (type === 'R') {
    // Combination Straight + Right arrow layout
    ctx.beginPath();
    ctx.moveTo(-3, 15); ctx.lineTo(-3, -15); // straight stem
    ctx.lineTo(-8, -8); ctx.moveTo(-3, -15); ctx.lineTo(2, -8); 
    ctx.moveTo(-3, 5); ctx.quadraticCurveTo(-3, 0, 7, 0); // right branch
    ctx.lineTo(3, -4); ctx.moveTo(7, 0); ctx.lineTo(3, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrafficLights(ctx, phase) {
  const positions = [
    { x: CENTER + ROAD_WIDTH / 2 + 15, y: CENTER + ROAD_WIDTH / 2, isGreen: phase === SIGNAL_PHASES.NS_GREEN }, // South approach
    { x: CENTER - ROAD_WIDTH / 2 - 15, y: CENTER - ROAD_WIDTH / 2, isGreen: phase === SIGNAL_PHASES.NS_GREEN }, // North approach
    { x: CENTER + ROAD_WIDTH / 2, y: CENTER - ROAD_WIDTH / 2 - 15, isGreen: phase === SIGNAL_PHASES.EW_GREEN }, // East approach
    { x: CENTER - ROAD_WIDTH / 2, y: CENTER + ROAD_WIDTH / 2 + 15, isGreen: phase === SIGNAL_PHASES.EW_GREEN }  // West approach
  ];

  positions.forEach((light) => {
    ctx.save();
    // Housing Box
    ctx.fillStyle = '#222222';
    ctx.fillRect(light.x - 8, light.y - 8, 16, 16);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(light.x - 8, light.y - 8, 16, 16);
    
    // Light bulb color selection
    ctx.beginPath();
    ctx.arc(light.x, light.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = light.isGreen ? '#22c55e' : '#ef4444';
    ctx.fill();
    ctx.restore();
  });
}

function drawVehicle(ctx, vehicle) {
  const { approach, lane, progress, turn, color } = vehicle;
  
  // Resolve base coordinate transformations depending on entry cardinal directions
  let x = 0, y = 0, angle = 0;
  const startY = CANVAS_SIZE; 
  const stopY = CENTER + ROAD_WIDTH / 2;
  const endY = 0;

  // Track coordinates relative to a South approach framework, then project globally
  let currentY = startY - progress * CANVAS_SIZE;
  let currentX = (CENTER - ROAD_WIDTH / 2) + LANE_WIDTH * 2 + (lane * LANE_WIDTH) + LANE_WIDTH / 2;

  // Interpolate turning paths when vehicle passes inside center junction boundaries
  if (progress >= 0.5 && progress <= 0.75) {
    const t = (progress - 0.5) / 0.25; // 0 to 1 normalization across intersection center box
    const entryX = (CENTER - ROAD_WIDTH / 2) + LANE_WIDTH * 2 + (lane * LANE_WIDTH) + LANE_WIDTH / 2;
    const entryY = CENTER + ROAD_WIDTH / 2;

    if (turn === 'S') {
      currentY = entryY - t * ROAD_WIDTH;
      currentX = entryX;
      angle = 0;
    } else if (turn === 'L') {
      // Curve leftward to match target outbound lane (Outer lane 1)
      const targetX = CENTER - ROAD_WIDTH / 2 + LANE_WIDTH / 2;
      const targetY = CENTER + LANE_WIDTH / 2;
      currentX = entryX + (targetX - entryX) * t;
      currentY = entryY + (targetY - entryY) * t;
      angle = -Math.PI / 4 * t;
    } else if (turn === 'R') {
      // Curve rightward to match target outbound lane (Rightmost lane 0)
      const targetX = CENTER + ROAD_WIDTH / 2 - LANE_WIDTH / 2;
      const targetY = CENTER + ROAD_WIDTH / 2 - LANE_WIDTH * 1.5;
      currentX = entryX + (targetX - entryX) * t;
      currentY = entryY + (targetY - entryY) * t;
      angle = Math.PI / 4 * t;
    }
  } else if (progress > 0.75) {
    // Post-intersection outbound straight line movement trajectories
    const tOut = (progress - 0.75) / 0.45;
    if (turn === 'S') {
      currentX = (CENTER - ROAD_WIDTH / 2) + LANE_WIDTH * 2 + (lane * LANE_WIDTH) + LANE_WIDTH / 2;
      currentY = (CENTER - ROAD_WIDTH / 2) - tOut * (CANVAS_SIZE / 2);
      angle = 0;
    } else if (turn === 'L') {
      currentX = (CENTER - ROAD_WIDTH / 2) - tOut * (CANVAS_SIZE / 2);
      currentY = CENTER + LANE_WIDTH / 2;
      angle = -Math.PI / 2;
    } else if (turn === 'R') {
      currentX = (CENTER + ROAD_WIDTH / 2) + tOut * (CANVAS_SIZE / 2);
      currentY = CENTER + ROAD_WIDTH / 2 - LANE_WIDTH * 1.5;
      angle = Math.PI / 2;
    }
  }

  // Map local directional translation values to actual global orientation matrices
  ctx.save();
  ctx.translate(CENTER, CENTER);
  if (approach === 'N') ctx.rotate(Math.PI);
  if (approach === 'E') ctx.rotate(Math.PI / 2);
  if (approach === 'W') ctx.rotate(-Math.PI / 2);
  ctx.translate(-CENTER, -CENTER);

  // Draw Vehicle Body Rect
  ctx.translate(currentX, currentY);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-10, -18, 20, 36);
  
  // Windshield and highlights for visual flavor
  ctx.fillStyle = '#222';
  ctx.fillRect(-8, -10, 16, 6);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-6, 12, 4, 3); // Tail lights
  ctx.fillRect(2, 12, 4, 3);
  
  ctx.restore();
}
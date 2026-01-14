import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, Play, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';

export default function GamePage() {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('horny_high_score');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  const handleGameOver = (finalScore: number) => {
    setIsPlaying(false);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('horny_high_score', finalScore.toString());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-primary/20 pb-4 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono text-primary glow-text flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 md:w-10 md:h-10" />
              CYBER_RUNNER_V1
            </h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm md:text-base">
              Evade the bears. Collect the pump. Survive the dump.
            </p>
          </div>
          <div className="flex items-center gap-8 font-mono bg-card/50 p-4 rounded-lg border border-border">
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Current Run</div>
              <div className="text-2xl md:text-3xl text-primary font-bold tabular-nums">
                {score.toString().padStart(6, '0')}
              </div>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Best Run</div>
              <div className="text-xl md:text-2xl text-accent font-bold tabular-nums">
                {highScore.toString().padStart(6, '0')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Container */}
          <div className="lg:col-span-3 aspect-video bg-black border-2 border-primary/50 relative overflow-hidden rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.1)] ring-1 ring-white/10">
             {!isPlaying ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-8 text-center backdrop-blur-sm">
                 <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                   <Gamepad2 className="w-10 h-10 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">READY TO RUN?</h2>
                 <p className="text-gray-400 mb-8 max-w-md">
                   Tap or click to jump. The market moves fast. Don't get liquidated.
                 </p>
                 <Button 
                   onClick={() => setIsPlaying(true)} 
                   size="lg" 
                   className="text-xl px-12 py-8 bg-primary hover:bg-primary/90 text-black font-bold tracking-wider uppercase"
                 >
                   <Play className="w-6 h-6 mr-3 fill-current" />
                   Initialize Protocol
                 </Button>
               </div>
             ) : (
               <GameCanvas onScore={setScore} onGameOver={handleGameOver} />
             )}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1 bg-card/30 border border-border p-6 rounded-lg h-fit backdrop-blur-sm">
            <h3 className="font-bold text-primary mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-border pb-2">
              <Trophy className="w-5 h-5" />
              Top Operators
            </h3>
            
            <div className="space-y-3 font-mono text-sm">
              {[
                { name: "Satoshi_Naka", score: 9850 },
                { name: "Vitalik_B", score: 8720 },
                { name: "Diamond_Hands", score: 7650 },
                { name: "WAGMI_Warrior", score: 6200 },
                { name: "Moon_Boy_69", score: 5400 },
              ].map((player, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-primary/5 rounded border border-transparent hover:border-primary/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' : 
                      i === 1 ? 'bg-gray-400 text-black' : 
                      i === 2 ? 'bg-amber-700 text-black' : 'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{player.name}</span>
                  </div>
                  <span className="text-primary font-bold">{player.score.toLocaleString()}</span>
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground italic flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Global Leaderboard syncing...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Canvas Game Implementation
function GameCanvas({ onScore, onGameOver }: { onScore: (n: number) => void, onGameOver: (final: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    const SPEED = 5;
    
    // Game State
    let player = { x: 50, y: 200, width: 30, height: 30, dy: 0, grounded: false };
    let obstacles: { x: number, y: number, w: number, h: number }[] = [];
    let frameCount = 0;
    let isActive = true;
    scoreRef.current = 0;

    const handleJump = () => {
      if (player.grounded) {
        player.dy = JUMP_FORCE;
        player.grounded = false;
      }
    };

    const spawnObstacle = () => {
      const height = 40 + Math.random() * 60;
      obstacles.push({
        x: canvas.width,
        y: canvas.height - height,
        w: 30,
        h: height
      });
    };

    const update = () => {
      if (!isActive) return;

      // Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid Background
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i - (frameCount * SPEED) % 40, 0); ctx.lineTo(i - (frameCount * SPEED) % 40, canvas.height); }
      for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
      ctx.stroke();

      // Update Player
      player.dy += GRAVITY;
      player.y += player.dy;

      // Floor Collision
      if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.grounded = true;
      }

      // Draw Player (Yellow Box for now)
      ctx.fillStyle = '#EAB308';
      ctx.shadowColor = '#EAB308';
      ctx.shadowBlur = 10;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;

      // Update & Draw Obstacles
      if (frameCount % 100 === 0) spawnObstacle();

      for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= SPEED;

        // Draw Obstacle (Red)
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // Collision
        if (
          player.x < obs.x + obs.w &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.h &&
          player.y + player.height > obs.y
        ) {
          isActive = false;
          onGameOver(scoreRef.current);
        }

        // Score update
        if (obs.x + obs.w < player.x && !obs['passed' as keyof typeof obs]) {
          // @ts-ignore
          obs.passed = true;
          scoreRef.current += 100;
          onScore(scoreRef.current);
        }

        // Cleanup
        if (obs.x + obs.w < 0) obstacles.splice(i, 1);
      }

      frameCount++;
      requestRef.current = requestAnimationFrame(update);
    };

    // Input Listeners
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') handleJump(); };
    const onTouch = () => handleJump();
    const onClick = () => handleJump();

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('touchstart', onTouch);
    canvas.addEventListener('click', onClick);

    // Start Loop
    requestRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('touchstart', onTouch);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={450} 
      className="w-full h-full object-contain cursor-pointer"
    />
  );
}


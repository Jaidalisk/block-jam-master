/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideBus, RotateCcw, Trophy, AlertCircle, Play, Timer, Coins, ShoppingCart, Video, Snowflake, HelpCircle, Zap, Gift, Settings, Volume2, VolumeX, Smartphone, ShieldCheck, ExternalLink, X } from 'lucide-react';
import { Color, Block, Bus, COLORS, COLOR_MAP, DOCK_CAPACITY, BUS_CAPACITY } from './types';

const GRID_SIZE = { rows: 8, cols: 6 };

export default function App() {
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost' | 'reviving'>('start');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dock, setDock] = useState<Block[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [currentBusIndex, setCurrentBusIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(100);
  const [timeLeft, setTimeLeft] = useState(90);
  const [shopOpen, setShopOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [hasRevivedWithAd, setHasRevivedWithAd] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Combo Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (comboTimer > 0) {
      timer = setInterval(() => {
        setComboTimer(prev => Math.max(0, prev - 10));
      }, 100);
    } else {
      setCombo(0);
    }
    return () => clearInterval(timer);
  }, [comboTimer]);

  // Check for daily reward on mount
  useEffect(() => {
    const lastReward = localStorage.getItem('last_reward');
    const today = new Date().toDateString();
    if (lastReward !== today) {
      setShowDailyReward(true);
    }
  }, []);

  const claimDailyReward = () => {
    setCoins(prev => prev + 100);
    localStorage.setItem('last_reward', new Date().toDateString());
    setShowDailyReward(false);
  };

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('lost');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Initialize Level
  const initLevel = useCallback((levelNum: any = 1) => {
    const n = typeof levelNum === 'number' ? levelNum : 1;
    const newBlocks: Block[] = [];
    const colorCounts: Record<string, number> = {};
    
    // Difficulty scaling
    const numColors = Math.min(COLORS.length, 3 + Math.floor(n / 2));
    const totalSets = 8 + n * 2;
    const activeColors = COLORS.slice(0, numColors);

    // Create blocks in sets of 3
    for (let i = 0; i < totalSets; i++) {
      const color = activeColors[i % numColors];
      for (let j = 0; j < BUS_CAPACITY; j++) {
        const isFrozen = n >= 3 && Math.random() < 0.15;
        const isMystery = n >= 5 && Math.random() < 0.1;
        
        newBlocks.push({
          id: `block-${n}-${i}-${j}`,
          x: 0,
          y: 0,
          color,
          status: 'board',
          isFrozen,
          isMystery,
        });
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }

    // Structured distribution
    const grid: (string | null)[][] = Array(GRID_SIZE.rows).fill(null).map(() => Array(GRID_SIZE.cols).fill(null));
    const shuffledBlocks = [...newBlocks].sort(() => Math.random() - 0.5);
    
    let blockIdx = 0;
    for (let y = GRID_SIZE.rows - 1; y >= 0 && blockIdx < shuffledBlocks.length; y--) {
      for (let x = 0; x < GRID_SIZE.cols && blockIdx < shuffledBlocks.length; x++) {
        if (Math.random() > 0.15 || y > GRID_SIZE.rows - 3) {
          const block = shuffledBlocks[blockIdx++];
          block.x = x;
          block.y = y;
          grid[y][x] = block.id;
        }
      }
    }

    // Generate buses
    const newBuses: Bus[] = [];
    Object.entries(colorCounts).forEach(([color, count]) => {
      const numBuses = Math.ceil(count / BUS_CAPACITY);
      for (let i = 0; i < numBuses; i++) {
        newBuses.push({
          id: `bus-${color}-${i}-${n}`,
          color: color as Color,
          capacity: BUS_CAPACITY,
          filled: 0,
        });
      }
    });

    // Shuffle buses
    for (let i = newBuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBuses[i], newBuses[j]] = [newBuses[j], newBuses[i]];
    }

    setBlocks(shuffledBlocks.filter(b => b.x !== undefined));
    setBuses(newBuses);
    setDock([]);
    setCurrentBusIndex(0);
    setLevel(n);
    setHasRevivedWithAd(false);
    setTimeLeft(Math.max(60, 100 - (n * 5))); // Tighter time limits as level increases
    setGameState('playing');
  }, []);

  const handleNextLevel = () => {
    initLevel(level + 1);
    setCoins(prev => prev + 50); // Reward for completion
  };

  const handleRetry = () => {
    initLevel(level);
  };

  const handleRevive = () => {
    if (hasRevivedWithAd && !adsRemoved) return; // Should be handled by UI visibility
    
    setIsWatchingAd(true);
    setGameState('reviving');
    
    // Simulate ad watching
    setTimeout(() => {
      setIsWatchingAd(false);
      setGameState('playing');
      setHasRevivedWithAd(true);
      
      // Clear half the dock to allow play to continue
      const newDock = [...dock];
      const removedBlocks = newDock.splice(0, Math.floor(DOCK_CAPACITY / 2));
      setDock(newDock);
      
      // Update blocks status back to board or just remove them
      const removedIds = removedBlocks.map(b => b.id);
      setBlocks(prev => prev.filter(b => !removedIds.includes(b.id)));
      
      setTimeLeft(30); // Hard set to 30 seconds for the final push
    }, 3000);
  };

  const handleCoinRevive = () => {
    const cost = 100;
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setGameState('playing');
      
      // Clear half the dock
      const newDock = [...dock];
      const removedBlocks = newDock.splice(0, Math.floor(DOCK_CAPACITY / 2));
      setDock(newDock);
      
      const removedIds = removedBlocks.map(b => b.id);
      setBlocks(prev => prev.filter(b => !removedIds.includes(b.id)));
      
      setTimeLeft(prev => prev + 45); // Coins give a bit more time than an ad
    }
  };

  const buyPowerUp = (cost: number, type: 'time' | 'clear') => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      if (type === 'time') {
        setTimeLeft(prev => prev + 30);
      } else if (type === 'clear') {
        // Clear 2 blocks from dock
        setDock(prev => prev.slice(2));
      }
      setShopOpen(false);
    }
  };

  const currentBus = buses[currentBusIndex];

  // Check if a block is blocked (nothing above it in the same column)
  const isBlocked = useCallback((block: Block) => {
    return blocks.some(b => b.status === 'board' && b.x === block.x && b.y < block.y);
  }, [blocks]);

  const handleBlockClick = (block: Block) => {
    if (gameState !== 'playing' || block.status !== 'board' || isBlocked(block)) return;

    if (block.isFrozen) {
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isFrozen: false } : b));
      return;
    }

    // Move to dock
    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, status: 'dock', isMystery: false } : b));
    setDock(prev => {
      if (prev.length >= DOCK_CAPACITY || prev.some(b => b.id === block.id)) return prev;
      return [...prev, { ...block, status: 'dock', isFrozen: false, isMystery: false }];
    });
  };

  // Logic to move blocks from dock to bus
  useEffect(() => {
    if (gameState !== 'playing' || !currentBus) return;

    const matchingBlockIndex = dock.findIndex(b => b.color === currentBus.color);
    
    if (matchingBlockIndex !== -1 && currentBus.filled < currentBus.capacity) {
      const timer = setTimeout(() => {
        const blockToMove = dock[matchingBlockIndex];
        
        // Update dock
        const newDock = [...dock];
        newDock.splice(matchingBlockIndex, 1);
        setDock(newDock);

        // Update bus
        setBuses(prev => prev.map((bus, idx) => 
          idx === currentBusIndex ? { ...bus, filled: bus.filled + 1 } : bus
        ));

        // Update block status
        setBlocks(prev => prev.map(b => b.id === blockToMove.id ? { ...b, status: 'bus' } : b));
        
        // Combo Logic
        const newCombo = combo + 1;
        setCombo(newCombo);
        setComboTimer(100); // 10 seconds (100 * 100ms)
        
        const comboBonus = Math.floor(newCombo / 2) * 5;
        setScore(s => s + 10 + comboBonus);
        if (newCombo % 3 === 0) setCoins(c => c + 1);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [dock, currentBus, currentBusIndex, gameState]);

  // Check if bus is full
  useEffect(() => {
    if (currentBus && currentBus.filled === currentBus.capacity) {
      const timer = setTimeout(() => {
        setCurrentBusIndex(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentBus]);

  // Check Win/Loss conditions
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (blocks.length > 0 && blocks.every(b => b.status === 'bus')) {
      setGameState('won');
    } else if (dock.length >= DOCK_CAPACITY) {
      // Check if any block in dock can move to current bus
      const canMove = currentBus && dock.some(b => b.color === currentBus.color);
      if (!canMove) {
        setGameState('lost');
      }
    }
  }, [blocks, dock, currentBus, gameState]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-[#252525] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <LucideBus size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight italic">BLOCK JAM MASTER</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Time</p>
            <p className={`text-xl font-bold font-mono ${timeLeft < 20 ? 'text-red-500 animate-pulse' : ''}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Level</p>
            <p className="text-xl font-bold font-mono">{level}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Coins</p>
            <div className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-400" />
              <p className="text-xl font-bold font-mono text-yellow-400">{coins}</p>
            </div>
          </div>
          <button 
            onClick={() => setShopOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"
          >
            <ShoppingCart size={20} />
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => initLevel(level)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4 gap-8">
        
        {/* Bus Station */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="relative w-full h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentBus ? (
                <motion.div
                  key={currentBus.id}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className="w-64 h-20 rounded-2xl border-4 border-white/20 flex items-center justify-between px-4 relative overflow-hidden"
                  style={{ backgroundColor: COLOR_MAP[currentBus.color] + '44' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  <LucideBus size={32} style={{ color: COLOR_MAP[currentBus.color] }} />
                  <div className="flex gap-2">
                    {Array.from({ length: currentBus.capacity }).map((_, i) => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-lg border-2 border-white/20 flex items-center justify-center"
                      >
                        {i < currentBus.filled && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-md shadow-lg"
                            style={{ backgroundColor: COLOR_MAP[currentBus.color] }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                gameState === 'won' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-400 font-bold text-2xl">
                    ALL BUSES DEPARTED!
                  </motion.div>
                )
              )}
            </AnimatePresence>
            
            {/* Next Bus Preview */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-50">
              {buses.slice(currentBusIndex + 1, currentBusIndex + 3).map((bus, i) => (
                <div 
                  key={bus.id} 
                  className="w-8 h-4 rounded-sm" 
                  style={{ backgroundColor: COLOR_MAP[bus.color] }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Combo Indicator */}
        <AnimatePresence>
          {combo > 1 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-1 rounded-full font-black italic shadow-xl">
                <Zap size={16} fill="currentColor" />
                {combo}X COMBO!
              </div>
              <div className="w-24 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${comboTimer}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-yellow-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div 
          className="relative bg-[#2a2a2a] rounded-3xl p-4 shadow-2xl border border-white/5"
          style={{ 
            width: GRID_SIZE.cols * 50 + 32, 
            height: GRID_SIZE.rows * 50 + 32,
          }}
        >
          <div className="grid grid-cols-6 grid-rows-8 gap-1 w-full h-full">
            {Array.from({ length: GRID_SIZE.rows * GRID_SIZE.cols }).map((_, i) => (
              <div key={i} className="w-11 h-11 rounded-lg bg-white/5 border border-white/5" />
            ))}
          </div>

          {blocks.filter(b => b.status === 'board').map(block => {
            const blocked = isBlocked(block);
            return (
              <motion.button
                key={block.id}
                layoutId={block.id}
                onClick={() => handleBlockClick(block)}
                className={`absolute w-11 h-11 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.3)] flex items-center justify-center transition-all cursor-pointer border-t border-white/20`}
                style={{
                  left: block.x * 50 + 16,
                  top: block.y * 50 + 16,
                  backgroundColor: block.isMystery ? '#444' : COLOR_MAP[block.color],
                  opacity: blocked ? 0.4 : 1,
                  filter: blocked ? 'grayscale(0.5)' : 'none',
                  zIndex: 10,
                }}
                whileHover={!blocked ? { scale: 1.05, y: -2 } : {}}
                whileTap={!blocked ? { scale: 0.95 } : {}}
              >
                {block.isFrozen && (
                  <div className="absolute inset-0 bg-blue-400/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                    <Snowflake size={20} className="text-white animate-pulse" />
                  </div>
                )}
                {block.isMystery && !blocked && (
                  <HelpCircle size={20} className="text-white/40" />
                )}
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 shadow-inner" />
              </motion.button>
            );
          })}
        </div>

        {/* Dock Area */}
        <motion.div 
          animate={dock.length >= DOCK_CAPACITY - 1 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={`w-full max-w-md p-4 rounded-2xl border transition-colors ${dock.length >= DOCK_CAPACITY - 1 ? 'bg-red-500/10 border-red-500/50' : 'bg-[#252525] border-white/10'} flex flex-col gap-2`}
        >
          <div className="flex justify-between items-center px-1">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${dock.length >= DOCK_CAPACITY - 1 ? 'text-red-400' : 'text-white/40'}`}>Waiting Dock</span>
            <span className={`text-[10px] font-mono ${dock.length >= DOCK_CAPACITY - 1 ? 'text-red-400' : 'text-white/40'}`}>{dock.length} / {DOCK_CAPACITY}</span>
          </div>
          <div className="flex gap-2 h-14 items-center justify-center bg-black/20 rounded-xl px-2">
            {Array.from({ length: DOCK_CAPACITY }).map((_, i) => (
              <div 
                key={i} 
                className="w-12 h-12 rounded-xl border-2 border-white/5 bg-white/5 flex items-center justify-center overflow-hidden"
              >
                {dock[i] && (
                  <motion.div
                    layoutId={dock[i].id}
                    className="w-10 h-10 rounded-lg shadow-md border-t border-white/20"
                    style={{ backgroundColor: COLOR_MAP[dock[i].color] }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center p-8 max-w-sm">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="inline-block p-6 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-500/20 mb-6"
              >
                <LucideBus size={64} className="text-black" />
              </motion.div>
              <h2 className="text-5xl font-black italic mb-2 tracking-tighter text-emerald-500">BLOCK JAM</h2>
              <p className="text-white/60 mb-8 text-sm leading-relaxed">
                Clear the board by matching blocks to their buses. Manage your dock space wisely!
              </p>
              <button 
                onClick={() => initLevel(1)}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-emerald-500/10"
              >
                <Play size={24} fill="currentColor" />
                START PLAYING
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'won' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[#1a1a1a] p-10 rounded-[40px] border border-emerald-500/30 text-center shadow-3xl">
              <Trophy size={80} className="text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-black mb-2">VICTORY!</h2>
              <p className="text-white/60 mb-8">You cleared all the blocks!</p>
              <button 
                onClick={handleNextLevel}
                className="px-12 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-transform"
              >
                NEXT LEVEL
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'lost' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-red-500/20 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[#1a1a1a] p-10 rounded-[40px] border border-red-500/30 text-center shadow-3xl max-w-sm w-full">
              <AlertCircle size={80} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-4xl font-black mb-2">GAME OVER!</h2>
              <p className="text-white/60 mb-8">
                {timeLeft === 0 ? "Time's up!" : "The dock is full."}
              </p>
              
              <div className="flex flex-col gap-3">
                {(!hasRevivedWithAd || adsRemoved) ? (
                  <button 
                    onClick={handleRevive}
                    className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Video size={20} />
                    WATCH AD TO REVIVE
                  </button>
                ) : (
                  <button 
                    onClick={handleCoinRevive}
                    disabled={coins < 100}
                    className="w-full py-4 bg-yellow-500 disabled:bg-white/10 disabled:text-white/20 text-black font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Coins size={20} />
                    REVIVE WITH 100 COINS
                  </button>
                )}
                
                <button 
                  onClick={handleRetry}
                  className="w-full py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all"
                >
                  RETRY LEVEL
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'reviving' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center"
          >
            <div className="w-64 h-36 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <LucideBus size={48} className="text-white/20" />
                </motion.div>
              </div>
              <p className="relative z-10 font-mono text-sm">SPONSORED AD CONTENT</p>
            </div>
            <h3 className="text-xl font-bold mb-2">Watching Advertisement...</h3>
            <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="h-full bg-emerald-500"
              />
            </div>
          </motion.div>
        )}

        {shopOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="bg-[#252525] p-8 rounded-[40px] border border-white/10 w-full max-w-sm relative">
              <button 
                onClick={() => setShopOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full text-white/40"
              >
                <X size={20} />
              </button>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic">SHOP</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full">
                  <Coins size={16} className="text-yellow-400" />
                  <span className="font-mono font-bold text-yellow-400">{coins}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                      <Timer size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Add 30s</p>
                      <p className="text-xs text-white/40">More time to think</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => buyPowerUp(50, 'time')}
                    disabled={coins < 50}
                    className="px-4 py-2 bg-emerald-500 disabled:bg-white/10 disabled:text-white/20 text-black font-bold rounded-xl transition-all"
                  >
                    50
                  </button>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Remove Ads</p>
                      <p className="text-xs text-white/40">Permanent upgrade</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (coins >= 500) {
                        setCoins(prev => prev - 500);
                        setAdsRemoved(true);
                        setShopOpen(false);
                      }
                    }}
                    disabled={coins < 500 || adsRemoved}
                    className="px-4 py-2 bg-emerald-500 disabled:bg-white/10 disabled:text-white/20 text-black font-bold rounded-xl transition-all"
                  >
                    {adsRemoved ? 'OWNED' : '500'}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShopOpen(false)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl transition-all"
              >
                BACK TO GAME
              </button>
            </div>
          </motion.div>
        )}

        {settingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="bg-[#252525] p-8 rounded-[40px] border border-white/10 w-full max-w-sm relative">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full text-white/40"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-black italic mb-8">SETTINGS</h2>

              <div className="flex flex-col gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                      {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </div>
                    <p className="font-bold">Sound Effects</p>
                  </div>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: soundEnabled ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                      <Smartphone size={24} />
                    </div>
                    <p className="font-bold">Haptic Feedback</p>
                  </div>
                  <button 
                    onClick={() => setVibrationEnabled(!vibrationEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${vibrationEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: vibrationEnabled ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                <div className="h-px bg-white/10 my-2" />

                <button 
                  onClick={() => setPrivacyOpen(true)}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="font-bold">Privacy Policy</p>
                  </div>
                  <ExternalLink size={18} className="text-white/20" />
                </button>

                <div className="text-center mt-4">
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">Game Version 1.0.4</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono mt-1">User ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
              </div>

              <button 
                onClick={() => setSettingsOpen(false)}
                className="w-full mt-8 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-transform"
              >
                SAVE & CLOSE
              </button>
            </div>
          </motion.div>
        )}

        {privacyOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-[#1a1a1a] p-8 rounded-[40px] border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic">PRIVACY POLICY</h2>
                <button 
                  onClick={() => setPrivacyOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/40"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-4 font-mono text-xs text-white/60 leading-relaxed space-y-4 custom-scrollbar">
                <p className="text-white font-bold text-sm">Last Updated: March 2024</p>
                <p>Welcome to Block Jam Master. Your privacy is important to us. This policy explains how we handle your data.</p>
                
                <h3 className="text-white font-bold uppercase tracking-widest mt-4">1. Data Collection</h3>
                <p>We collect minimal data to improve your experience, including high scores, level progress, and in-game currency balance. This data is stored locally on your device.</p>
                
                <h3 className="text-white font-bold uppercase tracking-widest mt-4">2. Advertising</h3>
                <p>We use third-party advertising partners (like Google AdMob) to serve ads. These partners may collect device identifiers to serve personalized ads. You can opt-out of personalized ads in your device settings.</p>
                
                <h3 className="text-white font-bold uppercase tracking-widest mt-4">3. In-App Purchases</h3>
                <p>All financial transactions are handled securely by the platform's app store. We do not store your credit card information.</p>
                
                <h3 className="text-white font-bold uppercase tracking-widest mt-4">4. Contact</h3>
                <p>For any questions regarding this policy, please contact support@blockjammaster.com</p>
              </div>

              <button 
                onClick={() => setPrivacyOpen(false)}
                className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all"
              >
                I UNDERSTAND
              </button>
            </div>
          </motion.div>
        )}
        {showDailyReward && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-[#1a1a1a] p-10 rounded-[40px] border-2 border-yellow-500/50 text-center shadow-2xl shadow-yellow-500/20 max-w-sm w-full">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse" />
                <Gift size={100} className="text-yellow-400 relative z-10" />
              </div>
              <h2 className="text-3xl font-black mb-2">DAILY REWARD!</h2>
              <p className="text-white/60 mb-8">Welcome back! Here's a little something to help you on your journey.</p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8 flex items-center justify-center gap-4">
                <Coins size={32} className="text-yellow-400" />
                <span className="text-4xl font-black text-yellow-400">+100</span>
              </div>

              <button 
                onClick={claimDailyReward}
                className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20"
              >
                CLAIM NOW
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Instructions */}
      <footer className="p-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
        Tap free blocks to move them to the dock
      </footer>
    </div>
  );
}

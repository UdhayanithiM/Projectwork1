"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Server, Cpu, Cloud, Terminal, Code2, Box, Layers, 
  RotateCcw, Trophy, Sparkles, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// The tech icons we will match
const ICONS = [Database, Server, Cpu, Cloud, Terminal, Code2, Box, Layers];

type CardType = {
  id: number;
  iconIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
};

export function NeuralMatrix() {
  const router = useRouter();
  const [cards, setCards] = useState<CardType[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  // Initialize Game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Create pairs, shuffle them, and map to card objects
    const shuffledCards = [...ICONS, ...ICONS]
      .map((_, index) => index % ICONS.length)
      .sort(() => Math.random() - 0.5)
      .map((iconIndex, index) => ({
        id: index,
        iconIndex,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffledCards);
    setMoves(0);
    setMatches(0);
    setFlippedIndices([]);
    setIsVictory(false);
    setIsLocked(false);
  };

  const handleCardClick = (index: number) => {
    // Prevent clicking if locked, already flipped, or matched
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);
      checkForMatch(newFlippedIndices, newCards);
    }
  };

  const checkForMatch = (currentFlipped: number[], currentCards: CardType[]) => {
    const [firstIndex, secondIndex] = currentFlipped;
    const isMatch = currentCards[firstIndex].iconIndex === currentCards[secondIndex].iconIndex;

    if (isMatch) {
      setTimeout(() => {
        const matchedCards = [...currentCards];
        matchedCards[firstIndex].isMatched = true;
        matchedCards[secondIndex].isMatched = true;
        setCards(matchedCards);
        setFlippedIndices([]);
        setMatches((m) => m + 1);
        setIsLocked(false);

        if (matches + 1 === ICONS.length) {
          setTimeout(() => setIsVictory(true), 500);
        }
      }, 500);
    } else {
      setTimeout(() => {
        const unflippedCards = [...currentCards];
        unflippedCards[firstIndex].isFlipped = false;
        unflippedCards[secondIndex].isFlipped = false;
        setCards(unflippedCards);
        setFlippedIndices([]);
        setIsLocked(false);
      }, 1000); // Wait 1 second before hiding them again
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      
      {/* Game Header Stats */}
      <GlassPanel className="w-full mb-8 p-4 flex justify-between items-center bg-black/40 border-primary/20">
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Moves</p>
            <p className="text-2xl font-mono text-white">{moves}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Matches</p>
            <p className="text-2xl font-mono text-primary">{matches} / {ICONS.length}</p>
          </div>
        </div>
        
        <Button onClick={initializeGame} variant="outline" className="border-white/10 hover:bg-white/5">
          <RotateCcw className="w-4 h-4 mr-2" /> Reboot Matrix
        </Button>
      </GlassPanel>

      {/* The Game Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full aspect-square md:aspect-auto md:h-[600px] perspective-1000">
        {cards.map((card, index) => {
          const Icon = ICONS[card.iconIndex];
          return (
            <motion.div
              key={card.id}
              className="relative w-full h-full cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => handleCardClick(index)}
            >
              {/* Front of Card (Hidden when flipped) */}
              <div 
                className={cn(
                  "absolute inset-0 backface-hidden rounded-xl border flex items-center justify-center transition-colors duration-300",
                  "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-primary/50 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Sparkles className="w-4 h-4 text-primary opacity-50" />
                </div>
              </div>

              {/* Back of Card (Revealed when flipped) */}
              <div 
                className={cn(
                  "absolute inset-0 backface-hidden rounded-xl border flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.2)]",
                  card.isMatched ? "bg-green-500/10 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "bg-primary/10 border-primary/50"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Icon className={cn("w-10 h-10 md:w-14 md:h-14 transition-all duration-500", card.isMatched ? "text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] scale-110" : "text-primary drop-shadow-[0_0_10px_rgba(124,58,237,0.8)]")} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Victory Overlay */}
      <AnimatePresence>
        {isVictory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <GlassPanel className="max-w-md w-full p-8 text-center border-primary/50 bg-black/60 shadow-[0_0_100px_rgba(124,58,237,0.3)] flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[50px] rounded-full" />
              
              <Trophy className="w-20 h-20 text-yellow-400 mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h2 className="text-4xl font-heading font-bold text-white mb-2 relative z-10">Matrix Solved!</h2>
              <p className="text-muted-foreground mb-8 relative z-10">
                You synchronized the nodes in <strong className="text-white">{moves} moves</strong>. Memory core stabilized.
              </p>
              
              <div className="flex gap-4 w-full relative z-10">
                <Button onClick={initializeGame} variant="outline" className="flex-1 border-white/10">
                  Play Again
                </Button>
                <Button onClick={() => router.push('/dashboard/achievements')} className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                  Claim Achievement
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
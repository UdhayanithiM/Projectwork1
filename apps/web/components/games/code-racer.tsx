"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Terminal, Play, RotateCcw, Trophy } from "lucide-react";

// The code snippet the user has to type
const CODE_SNIPPET = `function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}`;

export function CodeRacer() {
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the hidden input when the game starts
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleStart = () => {
    setUserInput("");
    setStartTime(Date.now());
    setEndTime(null);
    setIsActive(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isActive) return;
    
    const value = e.target.value;
    setUserInput(value);

    // Check if they finished typing the exact snippet
    if (value === CODE_SNIPPET) {
      setEndTime(Date.now());
      setIsActive(false);
    }
  };

  // Calculate WPM (Words per minute) based on 5 characters per word
  const calculateStats = () => {
    if (!startTime || !endTime) return { wpm: 0, accuracy: 0 };
    
    const timeInMinutes = (endTime - startTime) / 60000;
    const wordsTyped = CODE_SNIPPET.length / 5;
    const wpm = Math.round(wordsTyped / timeInMinutes);

    return { wpm, accuracy: 100 }; // Accuracy is 100% because they must match it exactly to finish
  };

  // Render the code with syntax highlighting for correct/incorrect characters
  const renderText = () => {
    return CODE_SNIPPET.split("").map((char, index) => {
      let color = "text-muted-foreground"; // Default gray
      
      if (index < userInput.length) {
        color = char === userInput[index] ? "text-green-400" : "text-red-500 bg-red-500/20";
      }

      // Add a cursor effect
      const isCursor = index === userInput.length && isActive;

      return (
        <span key={index} className={`${color} ${isCursor ? "border-l-2 border-primary animate-pulse" : ""}`}>
          {char === "\n" ? "↵\n" : char}
        </span>
      );
    });
  };

  const stats = calculateStats();

  return (
    <Card className="w-full max-w-3xl border-white/10 bg-[#0a0a0b] text-white mx-auto shadow-2xl">
      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
        <CardTitle className="flex items-center gap-2 text-lg font-mono">
          <Terminal className="h-5 w-5 text-primary" />
          Code Racer: Speed Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 relative">
        {/* Hidden textarea to capture mobile and desktop typing accurately */}
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleChange}
          disabled={!isActive}
          className="absolute inset-0 opacity-0 cursor-default"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="font-mono text-sm sm:text-base whitespace-pre-wrap leading-loose p-4 rounded-lg bg-black/50 border border-white/5 pointer-events-none select-none">
          {renderText()}
        </div>

        {/* Results Screen */}
        {endTime && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-lg animate-in fade-in duration-300">
            <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Assessment Complete!</h3>
            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Speed</p>
                <p className="text-4xl font-mono text-primary">{stats.wpm} <span className="text-sm">WPM</span></p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Accuracy</p>
                <p className="text-4xl font-mono text-green-400">100%</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-white/[0.02] border-t border-white/5 flex justify-between p-4">
        <p className="text-xs text-muted-foreground font-mono">
          {isActive ? "Typing in progress..." : "Click start to begin the trial."}
        </p>
        <Button 
          onClick={handleStart} 
          variant={endTime ? "outline" : "default"}
          className={endTime ? "border-white/10" : "bg-primary hover:bg-primary/90"}
        >
          {isActive ? (
             <><RotateCcw className="mr-2 h-4 w-4" /> Restart</>
          ) : endTime ? (
             <><RotateCcw className="mr-2 h-4 w-4" /> Try Again</>
          ) : (
             <><Play className="mr-2 h-4 w-4" /> Start Challenge</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
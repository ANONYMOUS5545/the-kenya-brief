"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Square, Volume2 } from "lucide-react";

type VocalizeButtonProps = {
  text: string;
};

export default function VocalizeButton({ text }: VocalizeButtonProps) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!supported) return null;

  const start = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-KE";
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
      <button
        type="button"
        onClick={speaking ? togglePause : start}
        className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
        aria-label={speaking && !paused ? "Pause article audio" : "Listen to article"}
      >
        {speaking && !paused ? <Pause size={16} /> : <Volume2 size={16} />}
        {speaking && !paused ? "Pause" : paused ? "Resume" : "Vocalize"}
      </button>
      {speaking && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition-colors hover:bg-white"
          aria-label="Stop article audio"
        >
          <Square size={14} />
        </button>
      )}
      <span className="hidden text-xs font-medium text-gray-500 sm:inline">
        Listen to this story
      </span>
    </div>
  );
}

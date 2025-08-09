import { useCallback, useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";

/**
 * A hook that cycles through an array of words with configurable timing
 * and automatic pausing when tab is hidden or element is hovered
 * @param words Array of words to cycle through
 * @param rotateMs Time in milliseconds between word changes
 * @param pauseOnHover Whether to pause cycling when hovered (default: true)
 * @returns [currentWord, isHovered, setIsHovered]
 */
export function useWordCycle(
  words: string[],
  rotateMs: number,
  pauseOnHover = true
): [string, boolean, (hovered: boolean) => void] {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cycle words using interval
  useInterval(
    () => {
      setIndex((current) => (current + 1) % words.length);
    },
    // Pause if hovered, tab hidden, or words/timing changed
    (!pauseOnHover || (!isHovered && isTabVisible)) ? rotateMs : null
  );

  const handleHover = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  return [words[index], isHovered, handleHover];
}

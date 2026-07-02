'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getPose, loadPoseLibrary, type PoseLibrary, type SignPose } from './pose-library';

const HandAvatar = dynamic(() => import('./HandAvatar').then((m) => m.HandAvatar), { ssr: false });

interface TextToSignAvatarProps {
  /** The text (captions) to translate into signs. */
  text: string;
  /** Callback fired when the animation sequence finishes */
  onFinish?: () => void;
  /** Whether to loop the playback continuously */
  loop?: boolean;
}

/**
 * Tokenizes text into uppercase letters/numbers for fingerspelling.
 */
function tokenize(text: string): string[] {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .split('');
}

/**
 * Renders a 3D avatar that sequentially plays back signs for the provided text.
 */
export function TextToSignAvatar({ text, onFinish, loop = false }: TextToSignAvatarProps) {
  const [library, setLibrary] = useState<PoseLibrary | null | undefined>(undefined);
  const [currentPose, setCurrentPose] = useState<SignPose | null>(null);

  const poseIndexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let cancelled = false;
    void loadPoseLibrary().then((lib) => {
      if (!cancelled) setLibrary(lib);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever text updates, tokenize it and only animate NEW words.
  // We assume that if the text shrinks or changes dramatically (not a prefix),
  // it's a new utterance, so we reset the index.
  useEffect(() => {
    if (!library) return;

    const newWords = tokenize(text);
    const oldWords = wordsRef.current;

    // If the text became empty, do nothing so the current animation can finish naturally.
    if (newWords.length === 0 && oldWords.length > 0) {
      return;
    }

    // Check if newWords is an extension of oldWords (interim speech updates)
    let isExtension = true;
    for (let i = 0; i < Math.min(oldWords.length, newWords.length); i++) {
      if (oldWords[i] !== newWords[i]) {
        isExtension = false;
        break;
      }
    }

    if (!isExtension || newWords.length < oldWords.length) {
      // It's a completely new sentence or a correction. Reset index.
      poseIndexRef.current = 0;
    }

    wordsRef.current = newWords;

    // Start playback loop if not already running
    const playNext = () => {
      if (poseIndexRef.current >= wordsRef.current.length) {
        if (loop && wordsRef.current.length > 0) {
          setCurrentPose(null);
          timeoutRef.current = setTimeout(() => {
            poseIndexRef.current = 0;
            playNext();
          }, 1000); // 1s rest between loops
          return;
        }

        // Reached the end. Rest pose (null).
        setCurrentPose(null);
        timeoutRef.current = null;
        if (wordsRef.current.length > 0) {
          onFinishRef.current?.();
          wordsRef.current = []; // Clear so we don't trigger finish again
        }
        return;
      }

      const word = wordsRef.current[poseIndexRef.current];
      const pose = getPose(library, word);

      setCurrentPose(pose); // Will be null if word is unknown, but we still wait.
      poseIndexRef.current++;

      // Calculate dynamic speed based on how far behind the avatar is
      const remaining = wordsRef.current.length - poseIndexRef.current;
      let delay = 700; // Base speed (slower for readability)
      if (remaining > 15) {
        delay = 350; // Fast catch-up
      } else if (remaining > 8) {
        delay = 500; // Moderate catch-up
      }

      timeoutRef.current = setTimeout(playNext, delay);
    };

    if (!timeoutRef.current && poseIndexRef.current < wordsRef.current.length) {
      playNext();
    }

    return () => {
      // We don't clear timeout here because we want the loop to finish naturally
      // But if the component unmounts, we should clear it.
    };
  }, [text, library]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  if (library === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas/40 backdrop-blur-md text-sm text-muted">
        Loading Avatar...
      </div>
    );
  }

  if (library === null) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-canvas/40 backdrop-blur-md p-2 text-center text-xs text-muted">
        <span>Avatar poses</span>
        <span>not generated.</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-canvas/40 backdrop-blur-md">
      <HandAvatar pose={currentPose} />
    </div>
  );
}

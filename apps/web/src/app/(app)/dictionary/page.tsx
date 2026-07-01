'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, X, BookA, GraduationCap } from 'lucide-react';
import { ISL_VOCABULARY, displayLabel } from '@/lib/sign/vocabulary';
import { PageHeader } from '@/components/PageHeader';
import { SignPoseView } from '@/components/SignPoseView';
import { TextToSignAvatar } from '@/lib/avatar/TextToSignAvatar';

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Alphabetically sort the vocabulary based on their display labels
  const allWords = [...ISL_VOCABULARY].sort((a, b) => 
    displayLabel(a).localeCompare(displayLabel(b))
  );

  const filtered = allWords.filter((word) => 
    displayLabel(word).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title="Dictionary" context="Browse the Indian Sign Language vocabulary" />

      <div className="mb-8">
        <Link 
          href="/learn" 
          className="group flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-signal/20 bg-signal/5 p-6 transition-all hover:bg-signal/10 hover:border-signal/30"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Learn ISL</h2>
              <p className="mt-1 text-sm text-muted max-w-md">Ready to master Indian Sign Language? Take our structured courses, practice your skills, and track your progress.</p>
            </div>
          </div>
          <div className="btn-primary whitespace-nowrap px-6 py-3 shrink-0">Start Learning</div>
        </Link>
      </div>

      <div className="mb-8 relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-muted" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a word..."
          className="block w-full rounded-xl border-line bg-surface py-3 pl-10 pr-4 focus:border-signal focus:ring-signal sm:text-sm shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((word) => (
          <button
            key={word}
            onClick={() => setSelectedWord(word)}
            className="flex min-h-[5rem] flex-col items-center justify-center rounded-2xl border-2 border-line bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-signal/40 hover:bg-aurora-soft hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-signal"
          >
            <BookA className="mb-2 h-6 w-6 text-muted opacity-50" />
            <span className="font-display font-semibold text-ink">
              {displayLabel(word)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted">
          <p>No words found matching &quot;{query}&quot;</p>
          <p className="mt-2 text-sm text-muted">
            Search for signs like &quot;hello&quot;, &quot;thank you&quot;, or &quot;help&quot; to see how they are performed in 3D.
          </p>
        </div>
      )}

      {/* Dictionary Modal */}
      {selectedWord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedWord(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-muted transition hover:bg-beacon hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="mb-4 text-center font-display text-3xl font-bold text-ink uppercase tracking-wide">
              {displayLabel(selectedWord)}
            </h2>

            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line shadow-inner h-[384px]">
              {/* By only mounting SignPoseView inside the modal, we ensure 
                  there is only ever ONE WebGL context active at a time! */}
              {selectedWord.length > 1 ? (
                <TextToSignAvatar text={selectedWord} loop />
              ) : (
                <SignPoseView label={selectedWord} />
              )}
            </div>

            <div className="mt-6 text-center text-sm text-muted">
              <p>The 3D Avatar is continuously looping this sign.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

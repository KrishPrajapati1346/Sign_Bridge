// SignBridge ISL recognition vocabulary (MVP — static signs).
//
// IMPORTANT: every label here MUST be verified against the ISLRTC Indian Sign
// Language dictionary, and ideally reviewed with a Deaf consultant, before this
// is used for anything beyond a prototype. This is a candidate starting set.
//
// To add or remove a label, edit ISL_VOCABULARY in @signbridge/shared-types —
// it is the single source of truth shared by collection, inference, and the
// Python trainer. This module just re-exports it plus friendly display labels.

import { ISL_VOCABULARY, type IslLabel } from '@signbridge/shared-types';

export { ISL_VOCABULARY };
export type { IslLabel };

/** Human-friendly display text for each label. */
export const LABEL_DISPLAY: Record<IslLabel, string> = {
  hello: 'Hello',
  yes: 'Yes',
  no: 'No',
  thank_you: 'Thank you',
  please: 'Please',
  help: 'Help',
  stop: 'Stop',
  i: 'I',
  you: 'You',
  good: 'Good',
  eat: 'Eat',
  drink: 'Drink',
  water: 'Water',
  name: 'Name',
  more: 'More',
  emergency: 'Emergency',
  sorry: 'Sorry',
  love: 'Love',
  family: 'Family',
  friend: 'Friend',
  time: 'Time',
  day: 'Day',
  night: 'Night',
  work: 'Work',
  school: 'School',
  home: 'Home',
  doctor: 'Doctor',
  hospital: 'Hospital',
  police: 'Police',
  wait: 'Wait',
  ready: 'Ready',
  who: 'Who',
  what: 'What',
  where: 'Where',
  when: 'When',
  why: 'Why',
  how: 'How',
  he: 'He',
  she: 'She',
  they: 'They',
  we: 'We',
  it: 'It',
  my: 'My',
  your: 'Your',
  his: 'His',
  her: 'Her',
  go: 'Go',
  come: 'Come',
  do: 'Do',
  make: 'Make',
  know: 'Know',
  think: 'Think',
  feel: 'Feel',
  see: 'See',
  want: 'Want',
  like: 'Like',
  give: 'Give',
  take: 'Take',
  need: 'Need',
  man: 'Man',
  woman: 'Woman',
  child: 'Child',
  book: 'Book',
  car: 'Car',
  house: 'House',
  money: 'Money',
  food: 'Food',
  job: 'Job',
  phone: 'Phone',
  people: 'People',
  city: 'City',
  big: 'Big',
  small: 'Small',
  hot: 'Hot',
  cold: 'Cold',
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fast: 'Fast',
  slow: 'Slow',
  very: 'Very',
  now: 'Now',
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  bye: 'Bye',
  fine: 'Fine',
  okay: 'Okay',
};

/**
 * Formats an arbitrary label for display: underscores → spaces, words
 * capitalized. Used as the fallback for labels that aren't in the curated
 * vocabulary — e.g. a model trained from a dataset of letters/words whose
 * labels come entirely from the trained model's labels.json.
 */
export function prettyLabel(raw: string): string {
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Display text for a label. Known vocabulary labels use their curated label;
 * anything else (including dataset-trained labels) is formatted generically, so
 * the recognizer works with arbitrary labels without code changes.
 */
export function displayLabel(label: string): string {
  return LABEL_DISPLAY[label as IslLabel] ?? prettyLabel(label);
}

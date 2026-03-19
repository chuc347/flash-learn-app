import { Flashcard } from '../data/vocabulary';

const CUSTOM_FLASHCARDS_KEY = 'custom_flashcards';

export function getCustomFlashcards(): Flashcard[] {
  try {
    const stored = localStorage.getItem(CUSTOM_FLASHCARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom flashcards:', error);
    return [];
  }
}

export function saveCustomFlashcards(flashcards: Flashcard[]): void {
  try {
    localStorage.setItem(CUSTOM_FLASHCARDS_KEY, JSON.stringify(flashcards));
  } catch (error) {
    console.error('Error saving custom flashcards:', error);
  }
}

export function addCustomFlashcard(flashcard: Flashcard): void {
  const current = getCustomFlashcards();
  saveCustomFlashcards([...current, flashcard]);
}

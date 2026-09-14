import { Lesson } from '@/lib/types/vocabulary';
import {
  getLessonsForLanguage,
  searchLessonsForLanguage,
} from './lessons/index';

/**
 * Predefined Vocabulary Lessons
 * Supports multiple languages via lib/data/lessons/. Defaults to English.
 */

export const predefinedLessons: Lesson[] = getLessonsForLanguage('english');

/**
 * Get predefined lessons for a specific language.
 * Falls back to English if language not found.
 */
export const getPredefinedLessons = (
  languageId: string = 'english'
): Lesson[] => {
  return getLessonsForLanguage(languageId);
};

/**
 * Search predefined lessons by title, description, or word content.
 */
export const searchPredefinedLessons = (
  query: string,
  languageId: string = 'english'
): Lesson[] => {
  return searchLessonsForLanguage(query, languageId);
};

/**
 * Get a predefined lesson by ID for a specific language.
 */
export const getPredefinedLessonById = (
  id: number,
  languageId: string = 'english'
): Lesson | undefined => {
  const lessons = getLessonsForLanguage(languageId);
  return lessons.find((lesson) => lesson.id === id);
};

/**
 * Get the lesson for a study-plan vocab topic in a target language.
 *
 * Vocab topics in `STUDY_PLAN_30` are always the English lesson title (lesson
 * titles are not translated per-language in fina's data — every language file
 * uses the same English titles). This resolves by English title first, then
 * maps to the same lesson `id` in the target language, so it still works if a
 * future language file ever does translate titles.
 */
export const getLessonForPlanTopic = (
  topic: string,
  languageId: string = 'english'
): Lesson | undefined => {
  const englishLessons = getLessonsForLanguage('english');
  const englishLesson = englishLessons.find((lesson) => lesson.title === topic);
  if (!englishLesson) return undefined;

  const targetLessons = getLessonsForLanguage(languageId);
  return (
    targetLessons.find((lesson) => lesson.id === englishLesson.id) ??
    targetLessons.find((lesson) => lesson.title === topic)
  );
};

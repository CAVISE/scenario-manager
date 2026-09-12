import { IMAGE_CATEGORIES } from '../constants/TelemetryModal.constants';
import { TabCategories } from '../types/TelemetryModalTypes';

export const categorizeImage = (filename: string): TabCategories => {
  const lower = filename.toLowerCase();

  for (const [, category] of Object.entries(IMAGE_CATEGORIES)) {
    if (category.patterns.some((pattern) => pattern.test(lower))) {
      return category.tab;
    }
  }
  return 'other';
};

export const formatImageName = (filename: string): string => {
  return filename
    .replace(/\.png$/i, '')
    .replace(/_/g, ' ')
    .trim();
};

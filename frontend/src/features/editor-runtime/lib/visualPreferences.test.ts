import { describe, expect, it } from 'vitest';
import { isEditorVisualVisible } from './visualPreferences';

const preferences = {
  showGrid: true,
  showRoutes: true,
  showLidarCoverage: true,
  reduceVisualLoad: false,
};

describe('isEditorVisualVisible', () => {
  it('hides optional 3D helpers in performance mode without changing preferences', () => {
    expect(isEditorVisualVisible(preferences, 'routes')).toBe(true);
    expect(
      isEditorVisualVisible(
        { ...preferences, reduceVisualLoad: true },
        'routes'
      )
    ).toBe(false);
  });
});

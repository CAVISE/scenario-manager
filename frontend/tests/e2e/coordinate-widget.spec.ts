import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

type DisplayedCoordinates = {
  editorX: number;
  editorY: number;
  carlaX: number;
  carlaY: number;
};

const COORDINATES_PATTERN =
  /Editor X\s*(-?\d+(?:\.\d+)?)\s*Y\s*(-?\d+(?:\.\d+)?)\s*Z\s*-?\d+(?:\.\d+)?\s*\| CARLA X\s*(-?\d+(?:\.\d+)?)\s*Y\s*(-?\d+(?:\.\d+)?)/;

async function moveCursorTo(
  canvas: Locator,
  point: { clientX: number; clientY: number }
) {
  await canvas.evaluate(
    (element, position) =>
      element.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: position.clientX,
          clientY: position.clientY,
          view: window,
        })
      ),
    point
  );
}

async function displayedCoordinates(page: Page): Promise<DisplayedCoordinates> {
  const text = await page.locator('.editor-coordinates.on-map').innerText();
  const match = text.match(COORDINATES_PATTERN);

  if (!match) {
    throw new Error(`Unable to parse coordinate widget: ${text}`);
  }

  return {
    editorX: Number(match[1]),
    editorY: Number(match[2]),
    carlaX: Number(match[3]),
    carlaY: Number(match[4]),
  };
}

async function findCoordinatesOnMap(
  page: Page,
  canvas: Locator,
  candidates: ReadonlyArray<{ clientX: number; clientY: number }>
) {
  const widget = page.locator('.editor-coordinates');

  for (const point of candidates) {
    await moveCursorTo(canvas, point);
    await page.waitForTimeout(100);

    if (
      await widget.evaluate((element) => element.classList.contains('on-map'))
    ) {
      return displayedCoordinates(page);
    }
  }

  throw new Error(
    'No road surface was found near the expected canvas position'
  );
}

test.describe('coordinate widget', () => {
  test('keeps CARLA coordinate deltas aligned with the editor axes', async ({
    page,
  }) => {
    await page.goto('/editor');
    await expect(page.locator('.sm-loader-root')).toHaveCount(0, {
      timeout: 30000,
    });

    const canvas = page.getByTestId('editor-canvas').locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(500);

    const first = await findCoordinatesOnMap(page, canvas, [
      { clientX: 640, clientY: 400 },
    ]);
    const second = await findCoordinatesOnMap(page, canvas, [
      { clientX: 642, clientY: 400 },
      { clientX: 638, clientY: 400 },
      { clientX: 640, clientY: 398 },
      { clientX: 640, clientY: 402 },
      { clientX: 644, clientY: 400 },
      { clientX: 636, clientY: 400 },
    ]);

    expect(second).not.toEqual(first);

    const editorDeltaX = second.editorX - first.editorX;
    const editorDeltaY = second.editorY - first.editorY;
    const carlaDeltaX = second.carlaX - first.carlaX;
    const carlaDeltaY = second.carlaY - first.carlaY;

    // The display rounds to two decimals, hence the small tolerance.
    expect(carlaDeltaX).toBeCloseTo(editorDeltaX, 1);
    expect(carlaDeltaY).toBeCloseTo(-editorDeltaY, 1);
  });
});

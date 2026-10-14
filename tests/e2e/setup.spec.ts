import { expect, test, type Page } from '@playwright/test';

// Match the image request, not Vite's JavaScript module request ending in ?import.
const waterAsset = /\/tile_73(?:-[\w-]+)?\.png$/;

async function openArena(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText('Arena ready', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Ocean arena with a pirate ship and a tropical island' }))
    .toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
}

test('menu supports keyboard navigation and restores focus after leaving', async ({ page }) => {
  await page.goto('/');
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Arena ready', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Open waters' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Main Menu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(play).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('five arena visits clean up canvas and window listeners without browser errors', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

  const cdp = await context.newCDPSession(page);
  const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
  const countWindowListeners = async () => {
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
    return listeners.length;
  };
  const initialListeners = await countWindowListeners();

  for (let visit = 0; visit < 5; visit += 1) {
    await openArena(page);
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect.poll(countWindowListeners).toBe(initialListeners);
  }

  expect(errors).toEqual([]);
  await cdp.detach();
});

test('leaving during asset loading cannot attach a stale canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let releaseAsset: () => void = () => {};
  const assetGate = new Promise<void>((resolve) => { releaseAsset = resolve; });
  await page.route(waterAsset, async (route) => {
    await assetGate;
    await route.continue();
  });

  await page.goto('/');
  const assetRequest = page.waitForRequest(waterAsset);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await assetRequest;
  await expect(page.getByText('Preparing the waters…')).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  const assetResponse = page.waitForResponse(waterAsset);
  releaseAsset();
  await assetResponse;
  await expect(page.locator('canvas')).toHaveCount(0);
  await openArena(page);
  expect(errors).toEqual([]);
});

test('asset failures show a retry action and recover', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(waterAsset, (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The arena could not load');
  await expect(page.locator('canvas')).toHaveCount(0);

  await page.unroute(waterAsset);
  await page.getByRole('button', { name: 'Try Again' }).click();
  await expect(page.getByText('Arena ready', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('arena fits portrait and landscape without changing its aspect ratio', async ({ page }) => {
  await page.goto('/');
  await openArena(page);

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const bounds = await page.locator('canvas').boundingBox();
      return bounds ? Math.abs(bounds.width / bounds.height - 16 / 9) : 1;
    }).toBeLessThan(0.01);

    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas).not.toBeNull();
    expect(canvas!.x).toBeGreaterThanOrEqual(0);
    expect(canvas!.y).toBeGreaterThanOrEqual(0);
    expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(viewport.width);
    expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByRole('button', { name: 'Main Menu' })).toBeInViewport();
  }
});

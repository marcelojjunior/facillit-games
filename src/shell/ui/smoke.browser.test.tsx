import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

// Proves the browser project runs in a real Chromium (T004).
it('renders a component in a real browser', async () => {
  const screen = await render(<button type="button">Ok</button>);
  await expect.element(screen.getByRole('button', { name: 'Ok' })).toBeVisible();
  expect(window.innerWidth).toBe(360);
});

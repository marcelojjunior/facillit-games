/**
 * One gesture adds at most one round (FR-017, research D11 of spec 003).
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ConfirmBar } from './ConfirmBar';

describe('ConfirmBar', () => {
  it('runs once for two clicks dispatched back to back', async () => {
    const onConfirm = vi.fn();
    const screen = await render(<ConfirmBar disabled={false} onConfirm={onConfirm} />);
    const button = screen.getByTestId('confirm-round').element();
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('confirm-round is not a button.');
    }

    // Same task, before React or the browser can repaint: the case a fast
    // double tap produces.
    button.click();
    button.click();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Released on the next frame, so the next deliberate tap works.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    button.click();
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('is disabled when there is nothing to confirm', async () => {
    const onConfirm = vi.fn();
    const screen = await render(<ConfirmBar disabled onConfirm={onConfirm} />);
    await expect.element(screen.getByTestId('confirm-round')).toBeDisabled();
  });
});

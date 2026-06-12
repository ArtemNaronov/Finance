import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMonthEndHint } from '../src/services/reminders.js';

describe('reminders', () => {
  it('returns hint when few days left and positive balance', () => {
    const hint = getMonthEndHint(5000, 3);
    assert.ok(hint?.includes('3'));
  });

  it('returns null when many days left', () => {
    assert.equal(getMonthEndHint(5000, 10), null);
  });
});

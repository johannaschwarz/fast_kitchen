import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newStep, moveStep, updateStep, isPlaceholder, stepPayload } from './recipeSteps.js';
test('moves preserve content, placeholder and sequential payload', () => {
    const a = newStep({ description: 'A', images: [3, 2] });
    const b = newStep({ description: 'B' });
    const empty = newStep();
    const moved = moveStep([a, b, empty], a.editorId, b.editorId, true);
    assert.deepEqual(moved, [b, a, empty]);
    assert.deepEqual(moveStep(moved, a.editorId, b.editorId, false), [a, b, empty]);
    assert.equal(moveStep(moved, a.editorId, empty.editorId, true), moved);
    assert.equal(moveStep(moved, a.editorId, a.editorId, true), moved);
    assert.deepEqual(stepPayload(moved), [{ order_id: 0, step: 'B', images: [] }, { order_id: 1, step: 'A', images: [3, 2] }]);
});
test('late image completion uses identity and latest state without restoring deleted rows', () => {
    const a = newStep({ description: 'A' });
    const b = newStep({ images: [1] });
    assert.equal(isPlaceholder(b), false);
    assert.equal(isPlaceholder(newStep({ pending: 1 })), false);
    const moved = moveStep([a, b], a.editorId, b.editorId, true);
    const edited = updateStep(moved, a.editorId, step => ({ ...step, description: 'new' }));
    const completed = updateStep(edited, a.editorId, step => ({ ...step, images: [...step.images, 2] }));
    assert.deepEqual(completed.map(step => step.description), ['', 'new']);
    assert.deepEqual(completed[1].images, [2]);
    assert.deepEqual(updateStep([b], a.editorId, () => a), [b]);
});

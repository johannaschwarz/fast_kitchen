import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { loadRecipeResults } from './loadRecipeResults.js';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

test('an older response cannot replace the current query results', async (t) => {
    const oldRequest = deferred();
    const currentRequest = deferred();
    t.mock.method(globalThis, 'fetch', (url) => (
        url === '/old' ? oldRequest.promise : currentRequest.promise
    ));
    let result;
    const setResult = (nextResult) => { result = nextResult; };

    const cleanup = loadRecipeResults('/old', 'old-query', setResult);
    cleanup();
    loadRecipeResults('/current', 'current-query', setResult);

    const recipes = [{ id_: 2, title: 'Soup' }];
    currentRequest.resolve({ json: async () => recipes });
    await setImmediate();
    assert.deepEqual(result, { key: 'current-query', recipes });

    oldRequest.resolve({ json: async () => [{ id_: 1, title: 'Old recipe' }] });
    await setImmediate();
    assert.deepEqual(result, { key: 'current-query', recipes });
});

test('cleanup also ignores a response whose JSON is still being read', async (t) => {
    const body = deferred();
    t.mock.method(globalThis, 'fetch', async () => ({ json: () => body.promise }));
    const setResult = t.mock.fn();

    const cleanup = loadRecipeResults('/recipes', 'query', setResult);
    await setImmediate();
    cleanup();
    body.resolve([{ id_: 1 }]);
    await setImmediate();

    assert.equal(setResult.mock.callCount(), 0);
});

test('a failed obsolete request does not report an error for the active query', async (t) => {
    const request = deferred();
    t.mock.method(globalThis, 'fetch', () => request.promise);
    const logError = t.mock.method(console, 'error', () => {});
    const setResult = t.mock.fn();

    const cleanup = loadRecipeResults('/recipes', 'query', setResult);
    cleanup();
    request.reject(new Error('Old request failed'));
    await setImmediate();

    assert.equal(setResult.mock.callCount(), 0);
    assert.equal(logError.mock.callCount(), 0);
});

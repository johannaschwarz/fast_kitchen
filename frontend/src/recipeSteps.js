let nextId = 0;
export const newStep = (values = {}) => ({ description: '', images: [], ...values, editorId: `step-${++nextId}` });
export const isPlaceholder = step => !step.description && !step.images.length && !step.pending;
export const updateStep = (steps, id, update) => steps.map(step => step.editorId === id ? update(step) : step);
export function moveStep(steps, id, target, after) {
    const source = steps.find(step => step.editorId === id);
    const destination = steps.find(step => step.editorId === target);
    if (!source || !destination || id === target || isPlaceholder(source) || isPlaceholder(destination)) return steps;
    const result = steps.filter(step => step !== source);
    result.splice(result.indexOf(destination) + (after ? 1 : 0), 0, source);
    return result;
}
export const stepPayload = steps => steps.filter(step => step.description.trim()).map((step, order_id) => ({ order_id, step: step.description.trim(), images: step.images }));

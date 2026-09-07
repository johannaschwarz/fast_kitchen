import assert from 'node:assert/strict';
import test from 'node:test';
import { getYeastConversion } from './yeastConversion.js';

const convert = (name, amount, unit = 'g') => getYeastConversion({ name, unit }, amount);

test('fresh yeast names convert to dry yeast in the ingredient language', () => {
    for (const name of ['fresh yeast', 'compressed yeast', 'cake yeast']) {
        assert.equal(convert(name, 21).text, '≈ 7 g dry yeast');
    }
    for (const name of ['frische Hefe', 'Frischhefe', 'Hefe, frisch', 'Bio-Frischhefe', 'Hefewürfel']) {
        assert.equal(convert(name, 21).text, '≈ 7 g Trockenhefe');
    }
});

test('dry yeast names convert to fresh yeast in either language', () => {
    for (const name of ['dry yeast', 'active dry yeast', 'instant yeast', 'dried yeast', 'quick-rise yeast', 'YEAST (DRY)']) {
        assert.equal(convert(name, 7).text, '≈ 21 g fresh yeast');
    }
    for (const name of ['Trockenhefe', 'Trockenbackhefe', 'Instanthefe', 'getrocknete Hefe', 'Hefe (trocken)', 'Bio-Trockenhefe']) {
        assert.equal(convert(name, 7).text, '≈ 21 g frische Hefe');
    }
});

test('unspecified or ambiguous yeast shows both conditional conversions', () => {
    for (const name of ['Hefe', 'Backhefe', 'frische Hefe oder Trockenhefe']) {
        assert.equal(convert(name, 21).text, 'Falls frisch: ≈ 7 g Trockenhefe\nFalls trocken: ≈ 63 g frische Hefe');
    }
    for (const name of ['yeast', 'fresh or dry yeast']) {
        assert.equal(convert(name, 21).text, 'If fresh: ≈ 7 g dry yeast\nIf dry: ≈ 63 g fresh yeast');
    }
    assert.equal(convert('Hefe', 0.0105, 'kg').text, 'Falls frisch: ≈ 3,5 g Trockenhefe\nFalls trocken: ≈ 31,5 g frische Hefe');
    assert.equal(convert('yeast', 42).text, 'If fresh: ≈ 14 g dry yeast\nIf dry: ≈ 126 g fresh yeast');
});

test('uses the current scaled amount and converts kilograms to grams before rounding', () => {
    assert.equal(convert('fresh yeast', 42).text, '≈ 14 g dry yeast');
    assert.equal(convert('fresh yeast', '10.5').text, '≈ 3.5 g dry yeast');
    assert.equal(convert('Trockenhefe', 0.007, 'kg').text, '≈ 21 g frische Hefe');
    assert.equal(convert('Frischhefe', 1).text, '≈ 0,33 g Trockenhefe');
    assert.equal(convert('fresh yeast', 0.01).text, '≈ < 0.01 g dry yeast');
});

test('does not substitute non-baking yeast or other ingredients', () => {
    for (const name of ['flour', 'Hefeflocken', 'Hefeextrakt', 'Bierhefe', 'nutritional yeast', "brewer’s yeast", 'yeast flakes', 'inactive yeast', 'yeast extract', 'Hefeteig', 'yeast-free flour', 'Mehl ohne Hefe']) {
        assert.equal(convert(name, 21), null, name);
    }
});

test('hides conversion for invalid amounts and unknown weight units', () => {
    for (const amount of [0, -1, NaN, Infinity, '', '.', 'abc', '7g', undefined, null, true]) {
        assert.equal(convert('Hefe', amount), null, String(amount));
    }
    for (const unit of ['pcs', 'tsp', 'tbsp', 'ml', 'l', '', undefined]) {
        assert.equal(getYeastConversion({ name: 'Hefe', unit }, 1), null, String(unit));
    }
    assert.equal(getYeastConversion({}, 1), null);
});

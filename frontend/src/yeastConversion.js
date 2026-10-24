// Approximate baking substitution: 7 g dry yeast replaces 21 g fresh yeast.
// https://www.oetker.de/inspiration/tipps-tricks/t/hefeteig-so-geht-er-perfekt-auf
const FRESH_TO_DRY_RATIO = 3;

export function getYeastConversion(ingredient, amount) {
    const name = ingredient.name?.normalize('NFKC').toLowerCase() ?? '';
    const german = /\b(?:hefe|trocken(?:back)?hefe|frischhefe|backhefe|instanthefe|hefewürfel)\b/u.test(name);
    if (!german && !/\byeast\b/u.test(name)) return null;

    // These are not interchangeable with baking yeast.
    if (/nutritional|brewer|extract|flakes|inactive|deactivated|nähr|nahr|bierhefe|flocken|extrakt|inaktiv|deaktiviert|hefefrei|yeast.free|ohne\s+hefe/u.test(name)) return null;

    const dry = /\b(?:dry|dried|instant(?:hefe)?|rapid[\s-]*rise|quick[\s-]*rise|trocken\w*|getrocknet\w*)\b/u.test(name);
    const fresh = /\b(?:fresh|compressed|cake|frisch\w*|hefewürfel)\b/u.test(name);
    const ambiguous = dry === fresh;

    // Volume and piece units do not specify a reliable weight for substitution.
    const unit = ingredient.unit?.trim().toLowerCase();
    if (unit !== 'g' && unit !== 'kg') return null;
    if (typeof amount !== 'number' && typeof amount !== 'string') return null;
    const weight = Number(amount) * (unit === 'kg' ? 1000 : 1);
    if (!Number.isFinite(weight) || weight <= 0) return null;

    const sourceTypes = ambiguous ? [false, true] : [dry];
    const conversions = sourceTypes.map(sourceIsDry => {
        const converted = sourceIsDry ? weight * FRESH_TO_DRY_RATIO : weight / FRESH_TO_DRY_RATIO;
        if (!Number.isFinite(converted)) return null;
        const formatted = converted < 0.01
            ? (german ? '< 0,01' : '< 0.01')
            : new Intl.NumberFormat(german ? 'de-DE' : 'en-GB', { maximumFractionDigits: 2 }).format(converted);
        const label = sourceIsDry ? 'frische Hefe' : 'Trockenhefe';
        const condition = ambiguous
            ? (sourceIsDry ? 'Falls trocken: ' : 'Falls frisch: ')
            : '';
        return `${condition}≈ ${formatted} g ${label}`;
    });
    if (conversions.includes(null)) return null;

    return {
        text: conversions.join('\n'),
        title: 'Faustregel: 3 g frische Hefe ≈ 1 g Trockenhefe.',
    };
}

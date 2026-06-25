export function normalizeSearchText(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .trim();
}

function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j += 1) dp[j] = j;
    
    for (let i = 1; i <= m; i += 1) {
        let prev = i - 1;
        dp[0] = i;
        for (let j = 1; j <= n; j += 1) {
            const tmp = dp[j];
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[j] = Math.min(
                dp[j] + 1,
                dp[j - 1] + 1,
                prev + cost
            );
            prev = tmp;
        }
    }
    return dp[n];
}

function isSubsequence(small, large) {
    if (!small.length) return true;
    let i = 0;
    for (let j = 0; j < large.length && i < small.length; j += 1) {
        if (large[j] === small[i]) i += 1;
    }
    return i === small.length;
}

export function scoreNameMatch(normQuery, normName) {
    if (!normQuery || !normName) return 0;
    
    if (normName.startsWith(normQuery)) {
        return 280 + Math.min(normQuery.length, 40);
    }
    
    if (normName.includes(normQuery)) {
        return 300 + Math.min(normQuery.length, 40);
    }
    
    const qTokens = normQuery.split(/\s+/).filter((t) => t.length > 0);
    const nameTokens = normName.split(/\s+/).filter((t) => t.length > 0);
    
    if (qTokens.length >= 2) {
        const allTokensIn = qTokens.every((t) => normName.includes(t));
        if (allTokensIn) return 250 + qTokens.length * 8;
    }
    
    for (const qt of qTokens) {
        if (qt.length < 2) continue;
        if (normName.includes(qt)) return 200 + qt.length;
    }
    
    let fuzzyBest = 0;
    for (const qt of qTokens) {
        if (qt.length < 3) continue;
        for (const nt of nameTokens) {
            if (nt.length < 2) continue;
            
            if (nt.startsWith(qt) || qt.startsWith(nt)) {
                fuzzyBest = Math.max(fuzzyBest, 160);
                continue;
            }
            
            const dist = levenshtein(qt, nt);
            const maxLen = Math.max(qt.length, nt.length);
            const threshold = Math.max(1, Math.floor(maxLen / 4));
            
            if (dist <= threshold) {
                fuzzyBest = Math.max(fuzzyBest, 140 - dist * 5);
            }
        }
    }
    
    if (fuzzyBest > 0) return fuzzyBest;
    
    const compactQ = normQuery.replace(/\s+/g, '');
    const compactN = normName.replace(/\s+/g, '');
    
    if (compactQ.length >= 2 && isSubsequence(compactQ, compactN)) {
        return 90;
    }
    
    return 0;
}

export function rankProductsBySearch(products, rawQuery, limit = 12) {
    const q = normalizeSearchText(rawQuery);
    if (!q) return [];
    
    const scored = products
        .map((p) => ({
            product: p,
            score: scoreNameMatch(q, normalizeSearchText(p.name))
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
        
    return scored.slice(0, limit).map((x) => x.product);
}

export function filterProductsBySearch(products, rawQuery) {
    return rankProductsBySearch(products, rawQuery, 9999);
}
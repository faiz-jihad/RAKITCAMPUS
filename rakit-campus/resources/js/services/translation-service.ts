/**
 * Translation Client Service — RAKIT Campus
 * High-performance batched dynamic translation with in-memory & sessionStorage caching.
 */

interface PendingItem {
    text: string;
    target: string;
    resolve: (translated: string) => void;
    reject: (err: any) => void;
}

class TranslationClient {
    private memoryCache = new Map<string, string>();
    private pendingQueue: PendingItem[] = [];
    private debounceTimer: number | null = null;
    private maxBatchSize = 40;

    constructor() {
        this.loadSessionCache();
    }

    private getCacheKey(text: string, target: string): string {
        return `tr_${target}_${text.trim()}`;
    }

    private loadSessionCache(): void {
        if (typeof window === 'undefined') return;
        try {
            const raw = sessionStorage.getItem('rakit_translations_cache');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'object') {
                    for (const [k, v] of Object.entries(parsed)) {
                        this.memoryCache.set(k, String(v));
                    }
                }
            }
        } catch {
            // Ignore storage quota or parse errors
        }
    }

    private persistSessionCache(): void {
        if (typeof window === 'undefined') return;
        try {
            const obj: Record<string, string> = {};
            // Store up to latest 500 items to avoid quota exceed
            let count = 0;
            for (const [k, v] of this.memoryCache.entries()) {
                if (count++ > 500) break;
                obj[k] = v;
            }
            sessionStorage.setItem('rakit_translations_cache', JSON.stringify(obj));
        } catch {
            // Ignore quota errors
        }
    }

    /**
     * Translate a single text string (debounced & batched behind the scenes).
     */
    public translate(text: string, target: 'en' | 'id' = 'en'): Promise<string> {
        const trimmed = text.trim();
        if (!trimmed || target === 'id') {
            return Promise.resolve(text);
        }

        const cacheKey = this.getCacheKey(trimmed, target);
        if (this.memoryCache.has(cacheKey)) {
            return Promise.resolve(this.memoryCache.get(cacheKey)!);
        }

        return new Promise<string>((resolve, reject) => {
            this.pendingQueue.push({ text: trimmed, target, resolve, reject });
            this.scheduleFlush();
        });
    }

    /**
     * Batch multiple texts immediately in a single promise.
     */
    public async translateBatch(texts: string[], target: 'en' | 'id' = 'en'): Promise<string[]> {
        if (!texts.length || target === 'id') {
            return texts;
        }

        const uncachedMap: { index: number; text: string }[] = [];
        const results = new Array<string>(texts.length);

        texts.forEach((txt, idx) => {
            const trimmed = txt.trim();
            if (!trimmed) {
                results[idx] = txt;
                return;
            }
            const key = this.getCacheKey(trimmed, target);
            if (this.memoryCache.has(key)) {
                results[idx] = this.memoryCache.get(key)!;
            } else {
                uncachedMap.push({ index: idx, text: trimmed });
            }
        });

        if (uncachedMap.length === 0) {
            return results;
        }

        try {
            const res = await fetch('/api/v1/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    texts: uncachedMap.map((item) => item.text),
                    target,
                }),
            });

            if (!res.ok) throw new Error('Translation API request failed');

            const json = await res.json();
            const translatedArray: string[] = Array.isArray(json.data) ? json.data : [];

            uncachedMap.forEach((item, i) => {
                const translated = translatedArray[i] || item.text;
                results[item.index] = translated;
                this.memoryCache.set(this.getCacheKey(item.text, target), translated);
            });

            this.persistSessionCache();
        } catch (e) {
            // Fail-safe fallback to original
            uncachedMap.forEach((item) => {
                results[item.index] = item.text;
            });
        }

        return results;
    }

    private scheduleFlush(): void {
        if (this.debounceTimer !== null) return;

        this.debounceTimer = window.setTimeout(() => {
            this.debounceTimer = null;
            this.flushQueue();
        }, 40);
    }

    private async flushQueue(): Promise<void> {
        if (this.pendingQueue.length === 0) return;

        const currentBatch = this.pendingQueue.splice(0, this.maxBatchSize);
        const target = currentBatch[0]?.target || 'en';
        const rawTexts = currentBatch.map((item) => item.text);

        try {
            const res = await fetch('/api/v1/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    texts: rawTexts,
                    target,
                }),
            });

            if (!res.ok) throw new Error('Translation batch failed');

            const json = await res.json();
            const translatedArray: string[] = Array.isArray(json.data) ? json.data : [];

            currentBatch.forEach((item, i) => {
                const translated = translatedArray[i] || item.text;
                this.memoryCache.set(this.getCacheKey(item.text, target), translated);
                item.resolve(translated);
            });

            this.persistSessionCache();
        } catch (e) {
            // Fail-safe: resolve with original text so UI doesn't crash or hang
            currentBatch.forEach((item) => item.resolve(item.text));
        }

        // If there's more in queue, process next tick
        if (this.pendingQueue.length > 0) {
            this.scheduleFlush();
        }
    }
}

export const translationService = new TranslationClient();

/**
 * Shared API & fetch utility for RAKIT Campus
 * Ensures CSRF tokens, requested-with headers, and JSON defaults are always sent.
 */

export function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';

    // 1. Try reading meta tag
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta?.content) {
        return meta.content;
    }

    // 2. Try reading cookie XSRF-TOKEN
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
        return decodeURIComponent(match[1]);
    }

    return '';
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getCsrfToken();
    const headers = new Headers(init?.headers || {});

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'XMLHttpRequest');
    }
    if (token) {
        if (!headers.has('X-CSRF-TOKEN')) {
            headers.set('X-CSRF-TOKEN', token);
        }
        if (!headers.has('X-XSRF-TOKEN')) {
            headers.set('X-XSRF-TOKEN', token);
        }
    }

    return fetch(input, {
        credentials: 'same-origin',
        ...init,
        headers,
    });
}

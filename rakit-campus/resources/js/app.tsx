import '../css/app.css';
import './echo';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { initializeLocale } from './hooks/use-locale';
import { GlobalJigsawLoader, checkJigsawTrigger } from './components/jigsaw-loading-screen';
import AppErrorBoundary from './components/app-error-boundary';

// Auto-recover from stale Vite deployment chunks (prevents blank screen)
window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
});

// Globally suppress top progress bar for Jigsaw flows and clean up #nprogress
router.on('before', (event: any) => {
    if (checkJigsawTrigger(event).allowed) {
        if (event.detail?.visit) {
            event.detail.visit.showProgress = false;
        }
        const np = document.getElementById('nprogress');
        if (np) {
            np.style.display = 'none';
            np.remove();
        }
    }
});

router.on('start', (event: any) => {
    if (checkJigsawTrigger(event).allowed) {
        if (event.detail?.visit) {
            event.detail.visit.showProgress = false;
        }
        const np = document.getElementById('nprogress');
        if (np) {
            np.style.display = 'none';
            np.remove();
        }
    }
});

router.on('navigate', () => {
    const path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/login' || path === '/register' || path.startsWith('/onboarding')) {
        const np = document.getElementById('nprogress');
        if (np) {
            np.style.display = 'none';
            np.remove();
        }
    }
});

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')).catch((error) => {
            const msg = String(error?.message || error || '');
            if (
                msg.includes('Failed to fetch dynamically imported module') ||
                msg.includes('Importing a module script failed') ||
                msg.includes('error loading dynamically imported module')
            ) {
                window.location.reload();
                return new Promise(() => {});
            }
            throw error;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppErrorBoundary>
                <App {...props} />
                <GlobalJigsawLoader />
            </AppErrorBoundary>
        );
    },
    progress: {
        color: '#2563eb',
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Initialize bilingual language setting on load...
initializeLocale();

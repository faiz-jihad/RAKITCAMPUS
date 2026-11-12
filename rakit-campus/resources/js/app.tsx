import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { GlobalJigsawLoader, checkJigsawTrigger } from './components/jigsaw-loading-screen';

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
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <GlobalJigsawLoader />
            </>
        );
    },
    progress: {
        color: '#2563eb',
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();

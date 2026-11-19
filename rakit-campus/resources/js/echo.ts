import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    if (import.meta.env.VITE_REVERB_APP_KEY) {
        const configuredHost = import.meta.env.VITE_REVERB_HOST;
        const host =
            configuredHost && configuredHost !== 'localhost'
                ? configuredHost
                : (window.location.hostname || 'localhost');

        const isHttps = window.location.protocol === 'https:';
        const forceTLS = (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https' || isHttps;
        const port = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : (forceTLS ? 443 : 80);

        try {
            window.Echo = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: forceTLS,
                enabledTransports: ['ws', 'wss'],
            });
        } catch (error) {
            console.error('Gagal menginisialisasi Laravel Echo:', error);
        }
    }
}

export default (typeof window !== 'undefined' ? window.Echo : null);

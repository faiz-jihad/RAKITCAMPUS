/**
 * Web Push & In-App Notification Manager for RAKIT Campus
 * Supports native Browser Notifications, Web Audio API chime, and permission lifecycle.
 */

export function isPushNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!isPushNotificationSupported()) return 'unsupported';
    return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!isPushNotificationSupported()) return 'unsupported';

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            sendBrowserNotification('Push Notifikasi Aktif', {
                body: 'Anda akan menerima pemberitahuan langsung saat ada undangan tim, tugas baru, atau update kompetisi.',
                icon: '/favicon.ico',
            });
            playNotificationChime();
        }
        return permission;
    } catch (err) {
        console.warn('Failed to request notification permission:', err);
        return 'denied';
    }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
    if (!isPushNotificationSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
        const notif = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            silent: false,
            ...options,
        });

        notif.onclick = () => {
            window.focus();
            notif.close();
        };

        return true;
    } catch (err) {
        console.warn('Error displaying browser notification:', err);
        return false;
    }
}

/**
 * Pure Web Audio API synthetic chime.
 * Generates an elegant two-tone chime without external audio assets.
 */
export function playNotificationChime(): void {
    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Tone 1: High harmonic C6 (1046.5 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tone 2: Harmonious E6 (1318.5 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.5, now + 0.1);
        gain2.gain.setValueAtTime(0.15, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.55);
    } catch {
        // AudioContext may be restricted by browser autoplay policy until user gesture
    }
}

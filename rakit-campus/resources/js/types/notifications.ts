export interface NotificationData {
    id: string;
    notification_type: string;
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    action_url?: string | null;
    action_text?: string | null;
    entity_type?: string | null;
    entity_id?: string | number | null;
    details?: Record<string, string>;
    created_at: string;
}

export interface NotificationItem {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferenceItem {
    key: string;
    name: string;
    description: string;
    mandatory_email: boolean;
    in_app: boolean;
    email: boolean;
}

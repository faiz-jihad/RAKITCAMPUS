<?php

namespace App\Events;

use App\Models\ClassMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewClassChatMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ClassMessage $message)
    {
        $this->message->loadMissing(['sender:id,name,avatar', 'recipient:id,name']);
    }

    /**
     * Broadcast on private channels for both recipient and sender.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('class-chat.' . $this->message->academic_class_id . '.' . $this->message->recipient_id),
            new PrivateChannel('class-chat.' . $this->message->academic_class_id . '.' . $this->message->sender_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'academic_class_id' => $this->message->academic_class_id,
            'sender_id' => $this->message->sender_id,
            'recipient_id' => $this->message->recipient_id,
            'sender_name' => $this->message->sender?->name ?? 'Pengguna',
            'sender_avatar' => $this->message->sender?->avatar,
            'message' => $this->message->message,
            'created_at' => $this->message->created_at?->toIso8601String(),
            'time' => $this->message->created_at ? $this->message->created_at->timezone('Asia/Jakarta')->format('H:i') : '',
        ];
    }
}


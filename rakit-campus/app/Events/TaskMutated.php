<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMutated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param int $teamId
     * @param string $action 'created' | 'updated' | 'deleted'
     * @param array $task
     */
    public function __construct(
        public int $teamId,
        public string $action,
        public array $task
    ) {}

    /**
     * Broadcast on the private channel of the workspace/team.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('workspace.' . $this->teamId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'task.mutated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'team_id' => $this->teamId,
            'action' => $this->action,
            'task' => $this->task,
        ];
    }
}


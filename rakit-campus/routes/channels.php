<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('class-chat.{classId}.{userId}', function ($user, $classId, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('workspace.{teamId}', function ($user, $teamId) {
    $team = \App\Models\Team::with('project.academicClass')->find($teamId);
    if (! $team) {
        return false;
    }

    if ($team->hasMember($user->id)) {
        return true;
    }

    if ($team->project?->academicClass?->lecturer_id === $user->id) {
        return true;
    }

    if ($user->isPlatformAdmin() || $user->isCampusAdmin($team->campus_id)) {
        return true;
    }

    return false;
});


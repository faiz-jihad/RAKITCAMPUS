<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('class-chat.{classId}.{userId}', function ($user, $classId, $userId) {
    return (int) $user->id === (int) $userId;
});


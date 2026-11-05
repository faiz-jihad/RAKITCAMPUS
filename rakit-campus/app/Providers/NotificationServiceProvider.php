<?php

namespace App\Providers;

use App\Contracts\Notifications\EmailDeliveryServiceInterface;
use App\Contracts\Notifications\NotificationChannelInterface;
use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationLogServiceInterface;
use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Contracts\Notifications\NotificationQueueServiceInterface;
use App\Contracts\Notifications\NotificationRecipientResolverInterface;
use App\Contracts\Notifications\NotificationServiceInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Services\Notifications\Channels\EmailNotificationChannel;
use App\Services\Notifications\Channels\InAppNotificationChannel;
use App\Services\Notifications\EmailDeliveryService;
use App\Services\Notifications\NotificationLogService;
use App\Services\Notifications\NotificationPreferenceService;
use App\Services\Notifications\NotificationQueueService;
use App\Services\Notifications\NotificationRecipientResolver;
use App\Services\Notifications\NotificationService;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Support\ServiceProvider;

class NotificationServiceProvider extends ServiceProvider
{
    /**
     * All of the container singletons that should be registered.
     */
    public array $singletons = [
        NotificationTemplateServiceInterface::class => NotificationTemplateService::class,
        NotificationLogServiceInterface::class => NotificationLogService::class,
        NotificationPreferenceServiceInterface::class => NotificationPreferenceService::class,
        NotificationRecipientResolverInterface::class => NotificationRecipientResolver::class,
        EmailDeliveryServiceInterface::class => EmailDeliveryService::class,
        NotificationQueueServiceInterface::class => NotificationQueueService::class,
        NotificationServiceInterface::class => NotificationService::class,
        NotificationCounterInterface::class => NotificationService::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Tagged notification channels for Open/Closed extensibility
        $this->app->tag([
            InAppNotificationChannel::class,
            EmailNotificationChannel::class,
        ], 'notification.channels');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

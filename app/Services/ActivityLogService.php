<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Log an activity.
     */
    public function log(
        string $module,
        string $action,
        ?Model $target = null,
        ?string $description = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'module' => $module,
            'action' => $action,
            'target_type' => $target ? get_class($target) : null,
            'target_id' => $target?->id,
            'description' => $description,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log a creation action.
     */
    public function logCreated(string $module, Model $target, ?string $description = null): ActivityLog
    {
        return $this->log($module, 'created', $target, $description);
    }

    /**
     * Log an update action.
     */
    public function logUpdated(string $module, Model $target, ?string $description = null): ActivityLog
    {
        return $this->log($module, 'updated', $target, $description);
    }

    /**
     * Log a deletion action.
     */
    public function logDeleted(string $module, Model $target, ?string $description = null): ActivityLog
    {
        return $this->log($module, 'deleted', $target, $description);
    }

    /**
     * Log a view action.
     */
    public function logViewed(string $module, ?Model $target = null, ?string $description = null): ActivityLog
    {
        return $this->log($module, 'viewed', $target, $description);
    }

    /**
     * Log a clock in action.
     */
    public function logClockIn(?string $description = null): ActivityLog
    {
        return $this->log('timecard', 'clock_in', null, $description);
    }

    /**
     * Log a clock out action.
     */
    public function logClockOut(?string $description = null): ActivityLog
    {
        return $this->log('timecard', 'clock_out', null, $description);
    }

    /**
     * Get activity logs for a user within a date range.
     * Useful for estimating work hours when clock-in was forgotten.
     */
    public function getUserActivityForDate(int $userId, string $date): array
    {
        $startOfDay = $date . ' 00:00:00';
        $endOfDay = $date . ' 23:59:59';

        $logs = ActivityLog::forUser($userId)
            ->betweenDates($startOfDay, $endOfDay)
            ->orderBy('created_at')
            ->get();

        $firstActivity = $logs->first();
        $lastActivity = $logs->last();

        return [
            'first_activity_at' => $firstActivity?->created_at,
            'last_activity_at' => $lastActivity?->created_at,
            'activity_count' => $logs->count(),
            'logs' => $logs,
        ];
    }
}

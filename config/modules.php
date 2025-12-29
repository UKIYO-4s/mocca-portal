<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Enabled Modules
    |--------------------------------------------------------------------------
    |
    | This configuration controls which modules are enabled in the application.
    | Set to true to enable a module, false to disable it.
    |
    */
    'enabled' => [
        'reservation' => true,      // 予約管理
        'checklist' => true,        // チェックリスト
        'inventory' => true,        // 備品管理
        'timecard' => true,         // タイムカード
        'announcement' => true,     // お知らせ
        'shift' => true,            // シフト管理
        'google_calendar' => false, // Googleカレンダー（後で有効化）
        'two_factor_auth' => false, // 2FA（後で有効化）
    ],
];

<?php

return [
    // Shared links that nobody opens for this many days are deleted (pickerplay:prune-shares)
    'share_expiry_days' => (int) env('SHARE_EXPIRY_DAYS', 365),

    // Max entries a single wheel may contain
    'max_entries' => (int) env('MAX_WHEEL_ENTRIES', 5000),

    // Max upload size for images in kilobytes
    'max_upload_kb' => (int) env('MAX_UPLOAD_KB', 4096),

    // Initial admin account created by the seeder
    'admin_email' => env('ADMIN_EMAIL', 'admin@pickerplay.com'),
    'admin_password' => env('ADMIN_PASSWORD', 'ChangeMe@123'),

    // Folder (inside /public) where the built React app lives
    'spa_path' => env('SPA_PATH', 'spa'),
];

<?php

namespace App\Console\Commands;

use App\Models\Wheel;
use Illuminate\Console\Command;

class PruneShares extends Command
{
    protected $signature = 'pickerplay:prune-shares {--dry-run}';
    protected $description = 'Delete shared wheel links that have not been opened within the expiry window';

    public function handle(): int
    {
        $days = (int) config('pickerplay.share_expiry_days', 365);
        $cutoff = now()->subDays($days);
        $query = Wheel::where('kind', 'shared')->where('is_featured', false)
            ->where(fn ($q) => $q->where('last_viewed_at', '<', $cutoff)
                ->orWhere(fn ($q2) => $q2->whereNull('last_viewed_at')->where('created_at', '<', $cutoff)));

        $count = $query->count();
        if ($this->option('dry-run')) {
            $this->info("{$count} share link(s) would be deleted (unused for {$days} days).");

            return self::SUCCESS;
        }
        $query->chunkById(500, fn ($rows) => Wheel::whereIn('id', $rows->pluck('id'))->delete());
        $this->info("Deleted {$count} share link(s) unused for {$days} days.");

        return self::SUCCESS;
    }
}

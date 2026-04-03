CREATE TABLE `cron_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_name` text NOT NULL,
	`success` integer DEFAULT false NOT NULL,
	`status_code` integer,
	`processed_count` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer,
	`error_message` text,
	`run_date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

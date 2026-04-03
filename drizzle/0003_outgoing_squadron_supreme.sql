CREATE TABLE `incident_acks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_id` text NOT NULL,
	`incident_type` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`acknowledged_by_user_id` integer,
	`assigned_to_user_id` integer,
	`acknowledged_at` integer,
	`resolved_at` integer,
	`sla_due_at` integer,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`acknowledged_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `incident_acks_incident_id_unique` ON `incident_acks` (`incident_id`);
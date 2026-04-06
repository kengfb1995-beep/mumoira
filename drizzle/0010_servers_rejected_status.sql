-- Add 'rejected' to servers status enum
-- SQLite/D1 requires recreating the table to change enum values
ALTER TABLE `servers` RENAME TO `servers_old`;
CREATE TABLE `servers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `version` text NOT NULL,
  `exp` text NOT NULL,
  `drop` text NOT NULL,
  `open_beta_date` integer,
  `alpha_test_date` integer,
  `website_url` text NOT NULL,
  `content` text DEFAULT '' NOT NULL,
  `seo_keywords` text DEFAULT '' NOT NULL,
  `slug` text DEFAULT '' NOT NULL,
  `banner_url` text,
  `vip_package_type` text DEFAULT 'none' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
INSERT INTO `servers` (`id`, `user_id`, `name`, `version`, `exp`, `drop`, `open_beta_date`, `alpha_test_date`, `website_url`, `content`, `seo_keywords`, `slug`, `banner_url`, `vip_package_type`, `status`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `name`, `version`, `exp`, `drop`, `open_beta_date`, `alpha_test_date`, `website_url`, `content`, `seo_keywords`, `slug`, `banner_url`, `vip_package_type`, `status`, `created_at`, `updated_at` FROM `servers_old`;
DROP TABLE `servers_old`;

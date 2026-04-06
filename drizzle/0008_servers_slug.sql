-- Add slug column and populate with URL-safe slugs from server names
ALTER TABLE `servers` ADD `slug` text NOT NULL DEFAULT '';
UPDATE `servers` SET `slug` = lower(replace(replace(replace(replace(replace(replace(replace(trim(`name`),' ','-'),'--','-'),'/','-'),':','-'),'.','-'),',','-'),'''','')) WHERE `slug` = '';

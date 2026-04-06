-- Step 2: deduplicate slugs (append id to any slug that appears more than once)
UPDATE `servers`
SET `slug` = `slug` || '-' || `id`
WHERE `id` IN (
  SELECT `id` FROM `servers`
  WHERE `slug` IN (
    SELECT `slug` FROM `servers` GROUP BY `slug` HAVING count(*) > 1
  )
);

-- Step 3: add unique constraint
CREATE UNIQUE INDEX `servers_slug_unique` ON `servers` (`slug`);

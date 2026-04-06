ALTER TABLE `posts` ADD `slug` text NOT NULL DEFAULT '';

UPDATE `posts`
SET `slug` = lower(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(trim(`title`), ' ', '-'),
            '--', '-'
          ),
          '/', '-'
        ),
        ':', '-'
      ),
      '.', '-'
    ),
    ',', '-'
  )
)
WHERE `slug` = '';

UPDATE `posts`
SET `slug` = `slug` || '-' || `id`
WHERE EXISTS (
  SELECT 1
  FROM `posts` p2
  WHERE p2.`id` <> `posts`.`id`
    AND p2.`slug` = `posts`.`slug`
);

CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);

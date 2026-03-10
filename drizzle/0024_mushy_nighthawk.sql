ALTER TABLE `form_responses` ADD `lastActivityAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `form_responses` ADD `abandonmentNotifiedAt` timestamp;
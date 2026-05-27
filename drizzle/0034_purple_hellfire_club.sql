CREATE TABLE `revoked_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revoked_tokens_id` PRIMARY KEY(`id`)
);

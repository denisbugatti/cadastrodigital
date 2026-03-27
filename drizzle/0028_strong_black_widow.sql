CREATE TABLE `google_oauth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`googleEmail` varchar(320) NOT NULL,
	`googleName` varchar(500),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`scope` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_oauth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_oauth_tokens_staffUserId_unique` UNIQUE(`staffUserId`)
);

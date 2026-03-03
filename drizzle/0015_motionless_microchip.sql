CREATE TABLE `staff_push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_push_subscriptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `staff_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(500) NOT NULL,
	`body` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`link` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_notifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE `staff_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`notificationType` varchar(50) NOT NULL,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_notification_preferences_id` PRIMARY KEY(`id`)
);

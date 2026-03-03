CREATE TABLE `response_folder_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`folderId` int NOT NULL,
	`staffUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `response_folder_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`color` varchar(30) DEFAULT '#6366f1',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_folders_id` PRIMARY KEY(`id`)
);

CREATE TABLE `form_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`staffUserId` int NOT NULL,
	`assignedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_assignments_id` PRIMARY KEY(`id`)
);

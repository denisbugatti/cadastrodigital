CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`url` text NOT NULL,
	`filename` varchar(500) NOT NULL,
	`mimeType` varchar(255),
	`sizeBytes` int,
	`uploadedBy` int,
	`formId` int,
	`responseId` int,
	`context` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`respondentName` varchar(500),
	`respondentEmail` varchar(320),
	`answers` json NOT NULL,
	`isComplete` boolean NOT NULL DEFAULT false,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timeSpentSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`snapshot` json NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`questions` json NOT NULL,
	`design` json NOT NULL,
	`webhook` json,
	`sharing` json,
	`workspaceId` varchar(255),
	`status` enum('draft','published','closed') NOT NULL DEFAULT 'draft',
	`responseCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `forms_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`description` text,
	`designDefaults` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);

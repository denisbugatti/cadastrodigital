CREATE TABLE `client_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpfCnpj` varchar(20) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(500) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `client_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_users_cpfCnpj_unique` UNIQUE(`cpfCnpj`)
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`role` enum('diretor','gerente','corretor') NOT NULL,
	`invitedBy` int NOT NULL,
	`name` varchar(500),
	`phone` varchar(50),
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `response_validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`questionId` varchar(100) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`justification` text,
	`validatedBy` int,
	`validatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('master','diretor','gerente','corretor') NOT NULL,
	`permission` varchar(100) NOT NULL,
	`granted` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(500) NOT NULL,
	`phone` varchar(50),
	`role` enum('master','diretor','gerente','corretor') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`invitedBy` int,
	`teamId` int,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `staff_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `corretores` ADD `staffUserId` int;--> statement-breakpoint
ALTER TABLE `form_responses` ADD `respondentCpfCnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `form_responses` ADD `validationStatus` enum('pending','in_review','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `form_responses` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `form_responses` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `form_responses` ADD `reviewNotes` text;--> statement-breakpoint
ALTER TABLE `forms` ADD `assignedCorretorId` int;
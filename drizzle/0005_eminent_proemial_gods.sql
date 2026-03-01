CREATE TABLE `corretores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `corretores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_corretores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`corretorId` int NOT NULL,
	`notifyOnSubmission` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_corretores_id` PRIMARY KEY(`id`)
);

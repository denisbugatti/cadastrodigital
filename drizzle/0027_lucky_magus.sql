CREATE TABLE `integration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`responseId` int NOT NULL,
	`integrationType` varchar(50) NOT NULL,
	`status` enum('pending','success','failure','retrying') NOT NULL DEFAULT 'pending',
	`httpStatus` int,
	`errorMessage` text,
	`requestPayload` json,
	`responseBody` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`nextRetryAt` timestamp,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_logs_id` PRIMARY KEY(`id`)
);

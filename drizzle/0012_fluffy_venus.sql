CREATE TABLE `email_cadence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`formId` int NOT NULL,
	`cadenceType` enum('abandono','reprovacao') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(500),
	`rejectionReason` text,
	`sequenceNumber` int NOT NULL DEFAULT 0,
	`maxSequence` int NOT NULL DEFAULT 24,
	`nextSendAt` timestamp,
	`lastSentAt` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`stoppedReason` enum('completed','form_completed','form_approved','manual','max_reached'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_cadence_id` PRIMARY KEY(`id`)
);

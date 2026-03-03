CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`formId` int NOT NULL,
	`activityType` enum('response_created','response_completed','validation_started','field_approved','field_rejected','overall_approved','overall_rejected','cadence_started','cadence_email_sent','cadence_stopped','follow_up_sent','pdf_generated','rejection_email_sent','approval_email_sent','protocol_email_sent') NOT NULL,
	`description` text,
	`metadata` json,
	`performedBy` int,
	`performedByName` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);

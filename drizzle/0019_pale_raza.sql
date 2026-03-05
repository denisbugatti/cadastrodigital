CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(100) NOT NULL,
	`category` enum('form','staff','response','access','settings') NOT NULL,
	`staffUserId` int,
	`staffName` varchar(500),
	`staffRole` varchar(50),
	`targetType` varchar(100),
	`targetId` int,
	`targetName` varchar(500),
	`details` json,
	`ipAddress` varchar(45),
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);

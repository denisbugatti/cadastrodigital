ALTER TABLE `form_responses` ADD `protocolCode` varchar(20);--> statement-breakpoint
ALTER TABLE `form_responses` ADD CONSTRAINT `form_responses_protocolCode_unique` UNIQUE(`protocolCode`);
ALTER TABLE `form_responses` ADD `pdfKey` varchar(500);--> statement-breakpoint
ALTER TABLE `form_responses` ADD `pdfUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `form_responses` ADD `extraPages` json;
CREATE TABLE `credit_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`credits` int NOT NULL,
	`price` float NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn','spend','recharge','refund','bonus') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` text NOT NULL,
	`referenceId` varchar(128),
	`referenceType` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` text,
	`userAvatar` text,
	`title` varchar(256),
	`prompt` text,
	`style` varchar(64),
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`tags` json,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `gallery_items_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `gallery_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`galleryItemId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobType` enum('generate','edit','style_transfer','background_replace','object_remove','upscale') NOT NULL,
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`optimizedPrompt` text,
	`style` varchar(64),
	`aspectRatio` varchar(16) DEFAULT '1:1',
	`quality` enum('standard','hd','ultra') DEFAULT 'standard',
	`sourceImageUrl` text,
	`resultImageUrl` text,
	`resultImageKey` text,
	`thumbnailUrl` text,
	`creditCost` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`metadata` json,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `image_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','premium','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalGenerated` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;
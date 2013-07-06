DROP SCHEMA `med_data`;

CREATE SCHEMA `med_data` DEFAULT CHARACTER SET utf8;

CREATE TABLE `med_data`.`provider` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`med_id` INT NOT NULL,
	`name` VARCHAR(64) NOT NULL,
	`street` VARCHAR(128) NULL,
	`city` VARCHAR(64) NULL,
	`state` VARCHAR(2) NULL,
	`zip` INT NULL,
	`lat` FLOAT NULL,
	`lng` FLOAT NULL,
	`loc_from_zip` char(1),
	`region` INT NULL,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `med_id_UNIQUE` (`med_id` ASC),
	INDEX (`region`),
	INDEX (`state`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


CREATE TABLE `med_data`.`region` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`med_id` INT NOT NULL,
	`name` varchar(128) NOT NULL,
	`state` varchar(2) NOT NULL,
	`north` FLOAT NULL,
	`south` FLOAT NULL,
	`east` FLOAT NULL,
	`west` FLOAT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `med_id_UNIQUE` (`med_id`),
	INDEX (`state`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


CREATE TABLE `med_data`.`treatment` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`med_id` INT NOT NULL,
	`inpatient` char(1) NOT NULL,
	`internal_id` INT NOT NULL,
	`name` varchar(128) NOT NULL,
	PRIMARY KEY (`id`),
	INDEX (`med_id`,`inpatient`),
	UNIQUE KEY `internal_id_UNIQUE` (`internal_id`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


CREATE TABLE `med_data`.`items` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`provider` INT NOT NULL,
	`treatment` INT NOT NULL,
	`region` INT NOT NULL,
	`num` INT NULL,
	`submitted` FLOAT NULL,
	`paid` FLOAT NULL,
	PRIMARY KEY (`id`),
	INDEX (`provider`),
	INDEX (`treatment`),
	INDEX (`region`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


CREATE TABLE `med_data`.`proc` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`treatment` INT NOT NULL,
	`region` INT NOT NULL,
	`provider_count` INT NULL,
	`total_num` INT NULL,
	`total_submitted` FLOAT NULL,
	`total_paid` FLOAT NULL,
	`avg_submitted` FLOAT NULL,
	`avg_paid` FLOAT NULL,
	PRIMARY KEY (`id`),
	INDEX (`treatment`),
	INDEX (`region`),
	INDEX (`region`,`treatment`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


CREATE TABLE `med_data`.`zip` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`zipcode` INT NULL,
	`city` VARCHAR(64) NULL,
	`state` VARCHAR(2) NULL,
	`lat` FLOAT NULL,
	`lng` FLOAT NULL,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `zipcode_UNIQUE` (`zipcode` ASC),
	INDEX (`lat`),
	INDEX (`lng`),
	INDEX (`state`)
)  ENGINE=MYISAM DEFAULT CHARSET=utf8;


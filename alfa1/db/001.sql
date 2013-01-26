

drop database if exists semilla_semilla;
create database semilla_semilla;


use semilla_semilla;


drop table if exists config;
create table config(
	id int not null auto_increment primary key,
	field_name varchar(25) not null,
	field_value varchar(1000) not null default ''
) default charset utf8;

drop table if exists template;
create table template(
	id int not null auto_increment primary key,
	name varchar(50) not null,
	description varchar(255) not null default 'no description',
	folder varchar(255) not null /* template's folder name */
) default charset utf8;

insert into template (name, description, folder) values ('Default', 'Basic default application''s template', 'default');
insert into config (field_name, field_value) values ('app_path', '/trabajo/desgrabados/repo/alfa1/');

drop table if exists repos;
create table repos(
	id int not null auto_increment primary key,
	name varchar(255) not null,
	url varchar(1000)
) DEFAULT CHARSET=utf8;

drop table if exists contents;
create table contents(
	id int not null auto_increment primary key,
	name varchar(255) not null,
	kind int not null,
	id_repo int not null,
	created timestamp not null default current_timestamp
) DEFAULT CHARSET=utf8;

drop table if exists content_kinds;
create table content_kinds(
	id int not null primary key auto_increment,
	name varchar(50) unique not null
) default charset=utf8;
insert into content_kinds (name) values ('audio'), ('text'), ('video');

ALTER TABLE contents
ADD CONSTRAINT FK_contents_repos
FOREIGN KEY (id_repo) REFERENCES repos(id)  
ON DELETE CASCADE;

ALTER TABLE contents
ADD CONSTRAINT FK_contents_content_kinds
FOREIGN KEY (kind) REFERENCES content_kinds(id)  
ON DELETE CASCADE;


drop table if exists content_properties;
create table content_properties(
	id int not null primary key auto_increment,
	name varchar(50) unique not null,
	description varchar(255)
) default charset = utf8;

insert into content_properties (name, description) values ('type', 'Depending of the content''s kind, it can be of different types. For example, an "audio" can be of type "song" or "recorded interview".');
insert into content_properties (name, description) values ('author', 'The content''s author');
insert into content_properties (name, description) values ('creation date', 'When was the content created');
insert into content_properties (name, description) values ('format version', 'The content''s file format version. For internal use only.');


drop table if exists props_x_content;
create table props_x_content(
	id int not null primary key auto_increment,
	id_prop int not null,
	id_content int not null,
	val varchar(255)
) default charset = utf8;

ALTER TABLE props_x_content
ADD CONSTRAINT FK_props_x_content_content
FOREIGN KEY (id_content) REFERENCES contents(id)  
ON DELETE CASCADE;

ALTER TABLE props_x_content
ADD CONSTRAINT FK_props_x_content_content_properties
FOREIGN KEY (id_prop) REFERENCES content_properties(id)  
ON DELETE CASCADE;

drop table if exists processed;
create table processed(
	id int not null primary key auto_increment,
	id_content int not null,
	ver int not null default '1',
	hash varchar(32) not null,
	created timestamp not null default current_timestamp,
	full_object text not null
) default charset = utf8;

ALTER TABLE processed
ADD CONSTRAINT FK_processed_contents
FOREIGN KEY (id_content) REFERENCES contents(id)  
ON DELETE CASCADE;

drop table if exists raws;
create table raws(
	id int not null primary key auto_increment,
	url varchar(1000) not null,
	id_content int not null
) default charset utf8;

ALTER TABLE raws
ADD CONSTRAINT FK_raws_contents
FOREIGN KEY (id_content) REFERENCES contents(id)  
ON DELETE CASCADE;

drop table if exists users;
create table users(
	id int not null auto_increment primary key,
	username varchar(50) not null unique,
	password varchar(50) not null,
	name varchar(255) not null,
	mail varchar(255) not null unique
) default charset=utf8;

/* 1 siempre va a ser anon, y 2 siempre va a ser admin */
insert into users (username, password, name, mail) values ('anon', '', 'Anonymous','anon@internet.com');
insert into users (username, password, name, mail) values ('admin', '', 'Administrator','admin@semilla');

drop table if exists permission;
create table permission(
	id int not null auto_increment primary key,
	parent int,
	name varchar(50) not null,
	description varchar(255) not null,
	codename varchar(50) not null
) default charset=utf8;

ALTER TABLE permission
ADD CONSTRAINT FK_permission_permission
FOREIGN KEY (parent) REFERENCES permission(id)  
ON UPDATE CASCADE  
ON DELETE CASCADE;  

insert into permission(parent, codename, name, description) values (NULL, 'ROOT_ADMIN', 'Administration', 'Administrarion options.');
insert into permission(parent, codename, name, description) values (NULL, 'ROOT_UI', 'UI', 'User Interfase options');
insert into permission(parent, codename, name, description) values (1, 'ADMIN_ADD_REPOS', 'Add repos', 'The user can add linked repos to the database.');
insert into permission(parent, codename, name, description) values (1, 'ADMIN_MODIFY_REPOS', 'Modify repos', 'The user can modify or delete linked repos from the base.');
insert into permission(parent, codename, name, description) values (1, 'ADMIN_MODIFY_USERS', 'Modify users', 'The user can create, modify, or delete users.');


drop table if exists permission_user;
create table permission_user(
	id_permission int not null,
	id_user int not null,
	primary key(id_permission,id_user)
) default charset=utf8;

ALTER TABLE permission_user
ADD CONSTRAINT FK_permission_user_1
FOREIGN KEY (id_permission) REFERENCES permission(id)  
ON UPDATE CASCADE  
ON DELETE CASCADE;  

ALTER TABLE permission_user
ADD CONSTRAINT FK_permission_user_2
FOREIGN KEY (id_user) REFERENCES users(id)  
ON UPDATE CASCADE  
ON DELETE CASCADE;  

/* Asigno todos los permisos al usuario Administrador */
insert into permission_user(id_user, id_permission) select 2,id from permission;

/*
	usuario admin default
*/

grant ALL on semilla_semilla.* to semilla_admin@localhost;
set password for semilla_admin@localhost = password('semilla');


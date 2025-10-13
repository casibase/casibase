#!/bin/bash
if [ "${MYSQL_ROOT_PASSWORD}" = "" ] ;then MYSQL_ROOT_PASSWORD=123456 ;fi

service mariadb start

mysqladmin -u root password ${MYSQL_ROOT_PASSWORD}

export dataSourceName="root:${MYSQL_ROOT_PASSWORD}@tcp(127.0.0.1:3306)/"

exec /server --createDatabase=true
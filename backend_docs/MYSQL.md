# MySQL 

MySQL runs on a different server 23.88.54.94
But it's accessed via a Hetzner private network. Mysql runs on 10.0.0.3. The app runs on 10.0.0.2

Mysql has 2 users. 
Root has only access from localhost
The other user (see in the env) has access ONLY from 10.*. 
Do not mess thi sup!!

Mysql config is in `/etc/mysql/mysql.conf.d/mysqld.cnf`

# OddsScraper
オッズ情報をスクレイピングしてDBに格納するスクリプト

## 環境
```
evitch@evitch-ubuntu:~/keiba/OddsScraper$ node -v
v10.9.0
evitch@evitch-ubuntu:~/keiba/OddsScraper$ npm -v
6.2.0
evitch@evitch-ubuntu:~/keiba/OddsScraper$ mysql --version
mysql  Ver 14.14 Distrib 5.7.23, for Linux (x86_64) using  EditLine wrapper
```

## MySQLの準備
```
CREATE DB keiba;
CREATE TABLE keiba.odds
    (id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, 
    date TIMESTAMP, 
    race_id CHAR(16), 
    number INT, 
    name CHAR(16), 
    win FLOAT, 
    place FLOAT, 
    INDEX(id));
```

## 利用方法
```
$ npm install
$ node cron.js
```

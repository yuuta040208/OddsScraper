# OddsScraper
オッズ情報をスクレイピングしてDBに格納するスクリプト

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

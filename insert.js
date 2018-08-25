/**********************************
* 各種モジュールの読み込み
**********************************/
const mysql = require('mysql');
const fs = require('fs');

/**********************************
* メイン処理
**********************************/

/**
 * オッズ情報ファイルを読み込む
 */ 
const loadOddsInfo = function () {
    return new Promise(function (resolve, reject) {
        // racelist.jsonをロード
        const data = fs.readFileSync(__dirname + '/oddsinfo.json', 'utf-8');
        // JSON形式に変換
        const json = JSON.parse(data);

        resolve(json);
    });
};


/**
 * データをDBに挿入できる形に整える
 */ 
const arrangeData = function (data) {
    return new Promise(function (resolve, reject) {
        let dataSet = [];

        data.forEach(function(raceInfo) {
            raceInfo['race_data'].forEach(function(oddsInfo) {
                let array = [];

                array.push(raceInfo['race_id']);
                array.push(oddsInfo['number']);
                array.push(oddsInfo['name']);
                
                if(oddsInfo['win'] == null) {
                    array.push(0);
                } else {
                    array.push(oddsInfo['win']);
                }

                if(oddsInfo['place'] == null) {
                    array.push(0);
                } else {
                    array.push(oddsInfo['place']);
                }

                dataSet.push(array);
            });
        });

        fs.writeFileSync(__dirname + '/test.json', JSON.stringify(dataSet, null, '    '))

        resolve(dataSet);
    });
};

/**
 * データをDBに挿入する
 */ 
const insertDb = function (data) {
    return new Promise(function (resolve, reject) {
        // DBに接続
        const connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'unkoburiburi',
            database : 'keiba'
        });

        // クエリを実行
        if (data.length != 0) { 
            const query = 'INSERT INTO odds (race_id, number, name, win, place) VALUES ?';
            connection.query(query, [data], (err, rows) => {
                if(err) throw err;
                console.log('Insert complete.');
            });
        } else {
            console.log('No data.');
        }

        // DBから切断
        connection.end((err) => {
            if (err) throw err;
        });

        resolve();
    });
}


/**
 * メイン処理の実行順を定義する
 */
const main = function () {
    return new Promise(function (resolve, reject) {

    Promise.resolve()
        .then(function () {
            // ファイル読み込み
            return loadOddsInfo();
        })
        .then(function (results) {
            // データ整形
            return arrangeData(results);
        })
        .then(function (results) {
            // データ挿入
            return insertDb(results);
        })
        .then(function (results) {
            // 完了
            resolve();
        })
        .catch(function (err) {
            // エラー通知
            reject(err);
        });

    });
};

// メイン処理を実行
main();

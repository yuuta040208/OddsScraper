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
 * DBを検索する
 */ 
const selectDb = function (data) {
    return new Promise(function (resolve, reject) {
        // DBに接続
        const connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'unkoburiburi',
            database : 'keiba'
        });

        let dataList = [];

        function connect(raceId, limit, index) {
            // クエリを実行
            if (data.length != 0) { 
                const query = 'SELECT * FROM odds WHERE race_id=? ORDER BY id DESC LIMIT ?';
                connection.query(query, [raceId, limit], (err, rows) => {
                    if(err) throw err;
                    dataList.push(rows);
                });
            } else {
                console.log('No data.');
                process.exit(0);
            }

            if(index == data.length - 1) {
                // DBから切断
                connection.end((err) => {
                    if (err) throw err;
                });

                // ファイル保存
                fs.writeFileSync(__dirname + '/prevdata.json', JSON.stringify(dataList, null, '    '))

                resolve(data);
            }
        }

        function loopSleep(_loopLimit,_interval, _mainFunc){
            var loopLimit = _loopLimit;
            var interval = _interval;
            var mainFunc = _mainFunc;
            var i = 0;
            var loopFunc = function () {
                var result = mainFunc(i);
                if (result === false) {
                  // break機能
                  return;
                }
                i = i + 1;
                if (i < loopLimit) {
                  setTimeout(loopFunc, interval);
                }
            }
            loopFunc();
        }

        loopSleep(data.length, 100, function(i) {
            const raceId = data[i]['race_id'];
            const limit = data[i]['race_data'].length;
            connect(raceId, limit, i);
        });
    });
}


/**
 * 
 */ 
const arrangePrevData = function (now) {
    return new Promise(function (resolve, reject) {
        const data = fs.readFileSync(__dirname + '/prevdata.json', 'utf-8');
        const prev = JSON.parse(data);

        const prevToNow = {};

        prev.forEach((raceElem) => {
            let list = [];

            raceElem.forEach(elem => {
                const map = {
                    "number": elem['number'],
                    "name": elem['name'],
                    "win": elem['win'],
                    "place": elem['place']
                }

                list.push(map);
            });

            list.sort(function(a, b){
                if(a['number'] < b['number']) return -1;
                if(a['number'] > b['number']) return 1;
                return 0;
            });

            const raceId = raceElem[0]['race_id'];
            //const map = {};

            prevToNow[raceId] = list;
            //prevToNow.push(map);
        });

        // ファイル保存
        fs.writeFileSync(__dirname + '/test.json', JSON.stringify(prevToNow, null, '    '))

        resolve({
            "now": now,
            "prev": prevToNow
        });
    });
};


/**
 * オッズ情報を計算する
 */ 
const calculate = function (data) {
    return new Promise(function (resolve, reject) {
        const now = data['now'];
        const prev = data['prev'];

        fs.writeFileSync(__dirname + '/test.json', JSON.stringify(prev, null, '    '));

        const selectList = [];

        //console.log(prev[now[0]['race_id']]);

        now.forEach(nowElem => {
            const nowRaceId = nowElem['race_id'];
            const nowRaceData = nowElem['race_data'];

            nowRaceData.some((raceDataElem, index) => {
                if(index == 8) {
                    return true;
                }

                const nowWin = raceDataElem['win'];
                const nowPlace = raceDataElem['place'];
                const nowNum = raceDataElem['number'];
                const nowName = raceDataElem['name'];

                if(prev[nowRaceId] && prev[nowRaceId][nowNum - 1]) {
                    const prevWin = prev[nowRaceId][nowNum - 1]['win'];
                    const prevPlace = prev[nowRaceId][nowNum - 1]['place'];
                    const prevName = prev[nowRaceId][nowNum - 1]['name'];

                    // compare
                    function compare(prev, now) {
                        let per = 0;

                        if(1 <= prev && prev < 1.5) {
                            per = 0.9;
                        } else if(1.5 <= prev && prev < 2) {
                            per = 0.8;
                        } else if(2 <= prev && prev < 5) {
                            per = 0.7;
                        } else if(5 <= prev && prev < 10) {
                            per = 0.5;
                        } else if(10 <= prev) {
                            per = 0.4;
                        } else {
                            per = 1;
                        }

                        if(prev * per > now) {
                            return true;
                        } else {
                            return false;
                        }
                    }

                    if(compare(prevWin, nowWin)) {
                        selectList.push({
                            "race_id" : nowRaceId,
                            "number": nowNum,
                            "name": nowName,
                            "prev_win": prevWin,
                            "now_win": nowWin
                        });
                    }

                    if(compare(prevPlace, nowPlace)) {
                        selectList.push({
                            "race_id" : nowRaceId,
                            "number": nowNum,
                            "name": nowName,
                            "prev_place": prevPlace,
                            "now_place": nowPlace
                        });
                    }
                }

            });
        });

        console.log(selectList);

        resolve(selectList);
    });
};

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
            // データ検索
            return selectDb(results);
        })
        .then(function (results) {
            // データ検索
            return arrangePrevData(results);
        })
        .then(function (results) {
            // データ検索
            return calculate(results);
        })
        .then(function (results) {
            // ファイル保存
            fs.writeFileSync(__dirname + '/select.json', JSON.stringify(results, null, '    '));

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

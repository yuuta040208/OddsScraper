/**********************************
* 各種モジュールの読み込み
**********************************/
const fs = require('fs');
const moment = require('moment');

/**********************************
* メイン処理
**********************************/

/**
 * セレクト情報ファイルを読み込む
 */ 
const loadScoreInfo = function () {
    return new Promise(function (resolve, reject) {
        let fileName = moment().format('YYYYMMDD') + '.json';
        let fileList = fs.readdirSync(__dirname);

        let scoreList = [];

        if(fileList.indexOf(fileName) !== -1) {
            scoreList = fs.readFileSync(__dirname + '/' + fileName, 'utf-8');
            scoreList = JSON.parse(scoreList);
        } else {
            // ファイル保存
            fs.writeFileSync(__dirname + '/' + fileName + '.json', '');
        }

        resolve(scoreList);
    });
};


/**
 * オッズ情報ファイルを読み込む
 */ 
const loadOddsInfo = function (scoreList) {
    return new Promise(function (resolve, reject) {
        let oddsList = fs.readFileSync(__dirname + '/oddsInfo.json', 'utf-8');
        oddsList = JSON.parse(oddsList);

        if(scoreList.length === 0) {
            oddsList.forEach(oddsMap => {
                let raceList = oddsMap['race_data'];
                let subScoreList = [];

                raceList.forEach(raceMap => {
                    let scoreMap = {
                        "number": raceMap['number'],
                        "name": raceMap['name'],
                        "score": 0
                    }

                    subScoreList.push(scoreMap);
                });

                subScoreList.sort(function(a, b){
                    if(a.number < b.number) return -1;
                    if(a.number > b.number) return 1;
                    return 0;
                });

                scoreList.push({
                    "race_id": oddsMap['race_id'],
                    "race_data": subScoreList
                })
                
            });
        }
        
        resolve(scoreList);
    });
};


/**
 * ツイート情報ファイルを読み込む
 */ 
const loadSelectInfo = function (scoreList) {
    return new Promise(function (resolve, reject) {
        let selectList = fs.readFileSync(__dirname + '/select.json', 'utf-8');
        selectList = JSON.parse(selectList);

        selectList.forEach(selectMap => {
            let selectRaceId = selectMap['race_id'];

            scoreList.some((scoreMap, i) => {
                let scoreRaceId = scoreMap['race_id'];
                if(selectRaceId == scoreRaceId) {
                    scoreMap['race_data'].some((raceMap, j) => {
                        if(selectMap['number'] == raceMap['number']) {
                            scoreList[i]['race_data'][j]['score']++;

                            return true;
                        }
                    });

                    return true;
                }
            });
        });

        resolve(scoreList);
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
            return loadScoreInfo();
        })
        .then(function (results) {
            // ファイル読み込み
            return loadOddsInfo(results);
        })
        .then(function (results) {
            // ファイル読み込み
            return loadSelectInfo(results);
        })
        .then(function (results) {
            // ファイル保存
            fs.writeFileSync(__dirname + '/' + moment().format('YYYYMMDD') + '.json', JSON.stringify(results, null, '    '));

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

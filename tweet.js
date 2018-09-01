/**********************************
* 各種モジュールの読み込み
**********************************/
const fs = require('fs');
const moment = require('moment');
const twitter = require('twitter');

/**********************************
* メイン処理
**********************************/

/**
 * スコア情報を読み込む
 */ 
const loadScoreInfo = function () {
    return new Promise(function (resolve, reject) {
        let raceInfoList = fs.readFileSync(__dirname + '/raceinfo.json', 'utf-8');
        raceInfoList= JSON.parse(raceInfoList);

        let nowTime = Number(moment().format('HHmm'));
        let raceIdList = [];
        let tweetList = [];

        raceInfoList.forEach(raceInfoMap => {
            let raceTime = raceInfoMap['time'];
            
            if(nowTime + 30 >= raceTime && nowTime < raceTime) {
                raceIdList.push({
                    "race_id": raceInfoMap['url'].replace(/[^0-9]/g,''),
                    "race_name": raceInfoMap['title']
                });
            }
        });


        let scoreList = fs.readFileSync(__dirname + '/' + moment().format('YYYYMMDD') + '.json', 'utf-8');
        scoreList = JSON.parse(scoreList);

        raceIdList.forEach(raceIdMap => {
            let url = 'http://race.netkeiba.com/?pid=odds&id=c' + raceIdMap['race_id'];
            let raceInfo = createRaceInfo(raceIdMap['race_id']);
            let names = '';
            let tweet = '';

            scoreList.some(scoreMap => {
                let scoreRaceId = scoreMap['race_id'];

                if(raceIdMap['race_id'] == scoreRaceId) {
                    scoreMap['race_data'].forEach(raceMap => {
                        if(raceMap['score'] == 1) {
                            names = names + '◎ ' + '[' + raceMap['number'] + ']' + raceMap['name'] + '\n';
                        } else if(raceMap['score'] > 1) {
                            names = names + '○ ' + '[' + raceMap['number'] + ']' + raceMap['name'] + '\n';
                        }
                    });

                    return true;
                }
            });

            if(names != '') {
                tweet = raceInfo['hold'] + raceInfo['place'] + raceInfo['days'] + raceInfo['race'] + ' ' + raceIdMap['race_name'] + '\n'
                      + names
                      + url;
                

                tweetList.push(tweet);
            }
        });




        // let url = 'http://race.netkeiba.com/?pid=odds&id=c' + scoreMap['race_id'];
        // let raceInfo = createRaceInfo(raceId);
        // let names = '';
        // let tweet = '';

        // scoreList.some(scoreMap => {
        //     let scoreRaceId = scoreMap['race_id'];

        //     if(raceId == scoreRaceId) {
        //         scoreMap['race_data'].forEach(raceMap => {

        //             if(raceMap['score'] == 1) {
        //                 name = '◎ ' + '[' + raceMap['number'] + ']' + raceMap['name'];
        //             } else if(raceMap['score'] > 1) {
        //                 name = '○ ' + '[' + raceMap['number'] + ']' + raceMap['name'];
        //             }

        //             names = names + name + '\n';
        //         });

        //         return true;
        //     }
        // })

        // if(names !== '') {
        //     tweet = raceInfo['hold'] + raceInfo['place'] + raceInfo['days'] + raceInfo['race'] + '\n'
        //           + names
        //           + url;
        // }

        // scoreList['race_data'].forEach(elem => {
        //     let url = 'http://race.netkeiba.com/?pid=odds&id=c' + scoreList['race_id'];
        //     let name = '[' + elem['number'] + ']' + elem['name'];
        //     let odds = '';

        //     if(elem['prev_place']) {
        //         odds = '複勝オッズ「' + elem['prev_place'] + ' → ' + elem['now_place'] + '」';
        //     } else {
        //         odds = '単勝オッズ「' + elem['prev_win'] + ' → ' + elem['now_win'] + '」';
        //     }

        //     const raceInfo = createRaceInfo(elem['race_id']);

        //     let tweet = raceInfo['hold'] + raceInfo['place'] + raceInfo['days'] + raceInfo['race'] + ': ' + name + '\n'
        //               + odds + '\n'
        //               + url;

        //     tweetList.push(tweet); 
        // })

        function createRaceInfo(race_id) {
            const place = Number(race_id.slice(4, 6));
            const hold = Number(race_id.slice(6, 8));
            const days = Number(race_id.slice(8, 10));
            const race = Number(race_id.slice(10, 12));
            let placeStr = '';
            
            switch(place) {
                case 1:
                    placeStr = '札幌';
                    break;
                case 2:
                    placeStr = '函館';
                    break;
                case 3:
                    placeStr = '福島';
                    break;
                case 4:
                    placeStr = "新潟";
                    break;
                case 5:
                    placeStr = '東京';
                    break;
                case 6:
                    placeStr = '中山';
                    break;
                case 7:
                    placeStr = '中京';
                    break;
                case 8:
                    placeStr = '京都';
                    break;
                case 9:
                    placeStr = "阪神";
                    break;
                case 10:
                    placeStr = "小倉";
                    break;
            }

            return {
                "hold": hold + '回',
                "days": days + "日目",
                "place": placeStr,
                "race": race + "R"
            } 

        }

        resolve(tweetList);
    });
};


/**
 * 
 */ 
const execTweet = function (tweetList) {
    return new Promise(function (resolve, reject) {
        // if(tweet == '') {
        //     resolve();
        // }

        const client = new twitter({
            consumer_key        : "paDZkhd2x00poBSnWaJiWXpBk",
            consumer_secret     : "audxX2KLltpICvQgkFcbkAWCNqaTDNiQ1I476TrtNWYsTi38WJ",
            access_token_key    : "1000221648174264320-iG8RYkMLCUiiAWkLWUb6Q3GHRPs6u9",
            access_token_secret : "fK8p1E0jYu3gUvSy14XYxlN7OkWzOz2q08hMmzMNuRXaY" 
        });

        function run(tweet, index) {
            client.post('statuses/update',
                { status: tweet },
                function(error, tweet, response) {
                if (!error) {
                    console.log(tweet)
                }
            });

            if(index == tweetList.length - 1) {
                resolve();
            }
        }

        // client.post('statuses/update',
        //     {status: tweet},
        //     function(error, tweet, response) {
        //     if (!error) {
        //         console.log(tweet)
        //     }
        // })

        // resolve();

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

        loopSleep(tweetList.length, 500, function(i){
            run(tweetList[i], i);
        });
    });
};


/**
 * メイン処理の実行順を定義する
 */
const main = function () {
    return new Promise(function (resolve, reject) {

    Promise.resolve()
        .then(function () {
            return loadScoreInfo(process.argv[2]);
        })
        .then(function (results) {
            return execTweet(results);
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

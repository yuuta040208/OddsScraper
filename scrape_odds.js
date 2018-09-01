/**********************************
* 各種モジュールの読み込み
**********************************/
require('date-utils');
const puppeteer = require('puppeteer');
const fs = require('fs');

/**********************************
* メイン処理
**********************************/

/**
 * レース情報ファイルを読み込む
 */ 
const loadRaceInfo = function () {
    return new Promise(function (resolve, reject) {
        // racelist.jsonをロード
        const data = fs.readFileSync(__dirname + '/raceinfo.json', 'utf-8');
        // JSON形式に変換
        const json = JSON.parse(data);

        resolve(json);
    });
};


/**
 * スクレイピングするレースのURLを決定する
 */ 
const fixedScrapingUrls = function (data) {
    return new Promise(function (resolve, reject) {
        // 現在時刻を取得
        const date = new Date();
        let now = Number(date.toFormat('HH24MI'));
        
        // 曜日を取得して、金曜日だったら無条件でスクレイピング
        const week = date.getDay();
        if(week == 6) {
            now = 0;
        }

        let scrapingUrls = [];

        // スクレイピングするレースを決定
        data.forEach(function(elem) {
            if(elem['time'] > Number(now)) {
                // 現在時刻より前のレースはスクレイピングしない
                scrapingUrls.push(elem['url']);
            }
        });

        resolve(scrapingUrls);
    });
};


/**
 * オッズ情報をスクレイピングする
 */ 
const scrapeOddsInfo = function (data) {
    return new Promise(function (resolve, reject) {
        let oddsInfo = [];

        function run(url, index) {
        //data.forEach(function(url, index) {
            (async () => {
                const browser = await puppeteer.launch({
                    args: [
                        // sandboxの設定
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
                });

                // ヘッドレスブラウザの起動
                const page = await browser.newPage();

                // URLから数字のみ抽出
                let raceId = url.replace(/[^0-9]/g,'');

                // URLにアクセス
                await page.goto(url);

                // スクレイピング開始
                const scrapedData = await page.evaluate(() => {

                    // データを格納する変数
                    let list = [];
                    let map = {};

                    let flag = true;

                    // 指定したセレクタの要素を抽出
                    const url = document.querySelectorAll('table[id^="tblTansho"] td');
                    url.forEach(function(elem, index) {
                        switch(index % 6) {
                            // 馬番
                            case 2:
                                // マップを初期化
                                map = {};

                                map['number'] = Number(elem.textContent);
                                break;
                            // 馬名
                            case 3:
                                map['name'] = elem.textContent;
                                break;
                            // 単勝オッズ
                            case 4:
                                if(elem.textContent != '取消') {
                                    map['win'] = Number(elem.textContent);
                                } else {
                                    flag = false;
                                    map['win'] = Number(999);
                                }
                                //map['win'] = Number(elem.textContent);

                                break;
                            // 複勝オッズ
                            case 5:
                                // 数字のみ抽出してハイフンで分割
                                let text = elem.textContent.replace(/[^0-9^\.-]/g,'').split("-");
                                // 2で除算したものを格納
                                text = parseFloat(String(((Number(text[0]) + Number(text[1])) / 2).toFixed(1)));

                                map['place'] = Number(text);

                                // // リストに追加
                                // if(flag) {
                                //     list.push(map);
                                // }

                                list.push(map);

                                break;
                            default:
                                break;
                     }
                    });

                    return list;
                });
                

                //oddsInfo.push(scrapedData);

                const raceData = scrapedData;

                if(raceData.length != 0) {
                    oddsInfo.push({
                        'race_id': raceId,
                        'race_data': raceData
                    });

                    console.log(oddsInfo[oddsInfo.length - 1]);
                }

                // ヘッドレスブラウザの停止
                await browser.close();

                if(index == data.length - 1) {
                   resolve(oddsInfo);
                }
            })();
        //});
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

        loopSleep(data.length, 1000, function(i){
            run(data[i], i);
        });

    });
};


/**
 * オッズ情報をファイルに保存する
 */ 
const saveOddsInfo = function (data) {
    return new Promise(function (resolve, reject) {
        // ファイル保存
        fs.writeFileSync(__dirname + '/oddsinfo.json', JSON.stringify(data, null, '    '))

        resolve();
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
            return loadRaceInfo();
        })
        .then(function (results) {
            // スクレピングするURLを決定
            return fixedScrapingUrls(results);
        })
        .then(function (results) {
            // オッズ情報をスクレイピング
            return scrapeOddsInfo(results);
        })
        .then(function (results) {
            // ファイル保存
            return saveOddsInfo(results);
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

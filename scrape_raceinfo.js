/**********************************
* 各種モジュールの読み込み
**********************************/
const moment = require('moment');
const puppeteer = require('puppeteer');
const fs = require('fs');

/**********************************
* メイン処理
**********************************/
// コマンドライン引数を取得
let argWeek = 0;
if(process.argv.length < 3) {
    // 引数が指定されていない場合
    console.log('取得するレースの曜日を指定してください。');
    console.log('土曜日 = "0", 日曜日 = "1"');
    process.exit(1);
} else if (process.argv[2] != 0 && process.argv[2] != 1) {
    // 引数が正しく指定されていない場合
    console.log('引数が無効です。');
    console.log('土曜日 = 0, 日曜日 = 1');
    process.exit(1);
} else {
    if(moment().day() !== 0) {
        argWeek = process.argv[2] == 0 ? 6 : 7;
    } else {
        argWeek = process.argv[2] == 0 ? -1 : 0;
    }
    
}

// スクレイピング処理
(async () => {
    // ヘッドレスブラウザの設定
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    // ヘッドレスブラウザの起動
    const page = await browser.newPage();
    // URLにアクセス
    await page.goto('http://race.netkeiba.com/?pid=race_list&id=c' + moment().day(argWeek).format('MMDD'));

    console.log(moment().day(argWeek).format('MMDD'));

    // スクレイピング開始
    const scrapedData = await page.evaluate(() => {
        // 各レースのURLとレース名を取得
        let urlList = [];
        let urlSubList = [];
        let titleList = [];
        let titleSubList = [];

        const urlElem = document.querySelectorAll('div[id^="race_list_body"] div.racename a');
        urlElem.forEach(function(elem, index) {
            let text = elem.href;
            let title = elem.title;

            if(text.indexOf('race_old') != -1) {
                text = text.replace('race_old', 'odds');
            }

            urlSubList.push(text);
            titleSubList.push(title);

            if(index % 12 == 11) {
                urlList.push(urlSubList);
                urlSubList = [];

                titleList.push(titleSubList);
                titleSubList = [];
            }
        });

        // レース開始時間を取得
        let timeList = [];
        let timeSubList = [];

        const timeElem = document.querySelectorAll('div[id^="race_list_body"] div.racedata');
        timeElem.forEach(function(elem, index) {
            let text = elem.textContent;
            let time = text.replace(/[^0-9]/g,'').slice(0, 4);

            timeSubList.push(time);

            if(index % 12 == 11) {
                timeList.push(timeSubList);
                timeSubList = [];
            }
        });

        let returnList = [];

        urlList.forEach(function(urls, i) {
            urls.forEach(function(url, j) {
                returnList.push({
                    "url": url,
                    "title": titleList[i][j],
                    "time": timeList[i][j]
                });
            });
        });
        
        return returnList;
    });

    if(scrapedData.length == 0) {
        console.log('該当するレース情報が存在しませんでした。');
        process.exit(1);
    } else {
        console.log(scrapedData);

        // ファイル保存
        fs.writeFileSync(__dirname + '/raceinfo.json', JSON.stringify(scrapedData, null, '    '))
    }

    // ヘッドレスブラウザの停止
    await browser.close();
})();

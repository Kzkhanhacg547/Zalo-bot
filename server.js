const router = require("express").Router();
const { readdirSync, readFileSync } = require('fs-extra');
const path = require('path');
const log = require("./utils/logger");
const axios = require('axios');
const chalk = require('chalkercli');
const cchalk = require("chalk");
const chalkAnimation = require('chalkercli');
let str = String.raw`[▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]`;
let logo = String.raw`◆━━━━━━━━━━━━━━━◆━━━━━━━━━━━━━━━◆━━━━━━━━━━━━━━━◆
*                                                  *
*      ██╗░░██╗███████╗                            *
*      ██║░██╔╝╚════██║                            *
*      █████═╝░░░███╔═╝                            *
*      ██╔═██╗░██╔══╝░░                            *
*      ██║░╚██╗███████╗                            *
*      ╚═╝░░╚═╝╚══════╝                            *       
*                                                  *
*   → 𝐊𝐳 𝐀𝐏𝐈                                       *
*   → Phiên bản: 1.2.15                            *
*   → Tên: Kz Khánhh - 2007                        *
*   → FB: Kz Khánhh                                *
*                                                  *
◆━━━━━━━━━━━━━━━◆━━━━━━━━━━━━━━━◆━━━━━━━━━━━━━━━◆
`;

const karaoke = chalkAnimation.karaoke(str);
const rainbow2 = chalkAnimation.rainbow(logo);
setTimeout(async () => {
  await karaoke.start()
  await rainbow2.start()
  console.clear()
}, 100);

setTimeout(() => {
  karaoke.stop()
  rainbow2.stop()
}, 100);
    const rainbow = chalk.rainbow(`█░▄▀░░▀▀▀█
█▀▄░░░░▄▀░
▀░▀▀░░▀▀▀▀\n`).stop();

    rainbow.render();


let n = 0;

try {
    var i, j, m = 0;
    let srcPath = path.join(process.cwd(), "/docs/");
    const hosting = readdirSync(srcPath).filter((file) => file.endsWith(".js"));
    for (i of hosting) {
        var { index, name } = require(srcPath + i);
        router.get(name, index);
        m++
    }
    const getDirs = readdirSync(srcPath).filter((file) => !file.endsWith(".js") && !file.endsWith(".json"));
    for (var dir of getDirs) {
        fileName = readdirSync(path.join(process.cwd(), '/docs/' + dir + '/')).filter((file) => file.endsWith(".js") && file !== 'main.js');
        for (j of fileName) {
            var { index, name } = require(path.join(process.cwd(), '/docs/' + dir + '/') + j);
            router.get(name, index);
            m++
        }
    }
    log(`Đã load thành công ${n} file`, 'LOAD');
} catch (e) {
    console.log(e);
}



function loadAPIRoutes() {
  try {
    // ------------------------------------------------------------------------//
    // ------------------------/     Fodel public    /-------------------------//
    // ------------------------------------------------------------------------//
    const srcPathPublic = path.join(__dirname, "/public/");
    const hostingPublic = readdirSync(srcPathPublic).filter((file) => file.endsWith(".js"));
    for (const i of hostingPublic) {
      const { index, name } = require(path.join(srcPathPublic, i));
      router.get(name, index);
      n++
      console.log(i);
    }

    // ------------------------------------------------------------------------//
    // ------------------------/     Kz-API folder    /------------------------//
    // ------------------------------------------------------------------------//
    const srcPathKzAPI = path.join(__dirname, "/Kz-API/");
    const hostingKzAPI = readdirSync(srcPathKzAPI).filter((file) => file.endsWith(".js"));
    for (const i of hostingKzAPI) {
      const { index, name } = require(path.join(srcPathKzAPI, i));
      router.get(name, index);
      n++
     // console.log(`\x1b[38;5;33m[ Kz API ] \x1b[32m→\x1b[40m\x1b[1m\x1b[38;5;34m Đã tải thành công` + i);
    }

    // for 'post' folder
    const srcPathPost = path.join(__dirname, "/post/");
    const hostingPost = readdirSync(srcPathPost).filter((file) => file.endsWith(".js"));
    for (const j of hostingPost) {
      const { index, name } = require(path.join(srcPathPost, j));
      router.post(name, index);
      n++
      console.log('post/' + j);
    }

    // additional routes
    router.get('/altp_data', function (req, res) {
      const data = JSON.parse(readFileSync('./altp_data.json', "utf-8"));
      res.header("Content-Type", 'application/json');
      res.send(JSON.stringify(data, null, 4));
    });

    // ------------------------------------------------------------------------//
    // ----------------------------/     Fodel    /----------------------------//
    // ------------------------------------------------------------------------//
    const getDirs = readdirSync(srcPathPublic).filter((file) => !file.endsWith(".js") && !file.endsWith(".json"));
    for (const dir of getDirs) {
      const fileName = readdirSync(path.join(srcPathPublic, dir)).filter((file) => file.endsWith(".js"));
      for (const j of fileName) {
        const { index, name } = require(path.join(srcPathPublic, dir, j));
        router.get(name, index);
        n++
     //   console.log('\x1b[38;5;220m[ LOADING ] \x1b[33m→\x1b[40m\x1b[1m\x1b[38;5;161m Đã tải thành công ' + j);
      }
    }

    // for 'post' folder
    const getDirsPost = readdirSync(srcPathPost).filter((file) => !file.endsWith(".js") && !file.endsWith(".json"));
    for (const dir of getDirsPost) {
      const fileName = readdirSync(path.join(srcPathPost, dir)).filter((file) => file.endsWith(".js"));
      for (const j of fileName) {
        const { index, name } = require(path.join(srcPathPost, dir, j));
        router.post(name, index);
        n++
            //  console.log('\x1b[38;5;220m[ LOADING ] \x1b[33m→\x1b[38;5;197m Đã tải thành công POST/' + j);
            }
          }
          console.log(`\x1b[38;5;220m[ LOADING ] \x1b[33m→\x1b[38;5;197m Đã load thành công ${n} file API`);
        } catch (e) { console.log(e); }
  }


// Khởi động lần đầu
loadAPIRoutes();

// Tạo biến để kiểm soát việc thực hiện hoặc không thực hiện hành động
let isProgramActive = true;

// Hàm để khởi động lại chương trình
function restartProgram() {
  if (isProgramActive) {
    console.log("Restarting the program...");
    // Gọi hàm để tải lại API routes
    loadAPIRoutes();
  }
}
/*
// Thực hiện cuộc gọi API
const apiEndpoints = [
  'https://facebook.com/kzkhanh547',
  'https://4dd9ea6e-d5a6-4f8f-892c-ce90e4d539b9-00-11lae77drh9zo.janeway.replit.dev/',
  'https://87fe0029-a5c4-45a3-bc8e-2782d1b6c6f7-00-uabqti4gbjvq.pike.replit.dev/blog'
];

async function callAPI(url) {
  try {
    if (isProgramActive) {
      await axios.get(url);
      console.log(`Successfully accessed API at: ${url} \n`);
    }
  } catch (error) {
    if (isProgramActive) {
      console.error(`Error accessing API at ${url}:`, error.message);
    }
  }
}

function performAPICalls() {
  if (isProgramActive) {
    apiEndpoints.forEach(url => callAPI(url));
  }
}

// Lặp lại cuộc gọi API mỗi 5 phút (300000 milliseconds)
setInterval(performAPICalls, 300000);

// Lặp lại khởi động lại chương trình mỗi 5 phút (300000 milliseconds)
setInterval(restartProgram, 300000);

function startProgram() {
  // Đặt mã của bạn ở đây
  console.log("Chương trình đang chạy...");

  // Sau khi chạy xong, đợi một khoảng thời gian rồi khởi động lại chương trình
  setTimeout(restartProgram, 300000); // 5000 milliseconds = 5 seconds
}

function stopProgram() {
  isProgramActive = false;
  console.log("Chương trình đã được vô hiệu hóa.");
}

// Bắt đầu chương trình
startProgram();

// Dừng chương trình sau một khoảng thời gian (ví dụ: 10 phút)
setTimeout(stopProgram, 600000); // 600000 milliseconds = 10 minutes
*/
// -------------------------->      END     <------------------------------//

// Downloader
router.get('/download/facebook', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  let data = await fetchJson(`https://xorizn-downloads.vercel.app/api/downloads/facebook?url=${url}`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.result
  })
})
router.get('/download/mediafire', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  let data = await fetchJson(`https://xorizn-downloads.vercel.app/api/downloads/mediafire?url=${url}`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.result
  })
})
router.get('/download/tiktok', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  let data = await fetchJson(`https://xorizn-downloads.vercel.app/api/downloads/tiktok?url=${url}`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.result
  })
})
router.get('/download/soundcloud', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  let data = await fetchJson(`https://xorizn-downloads.vercel.app/api/downloads/soundcloud?url=${url}`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.result
  })
})
router.get('/download/twitter', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  let data = await fetchJson(`https://xorizn-downloads.vercel.app/api/downloads/twitter?url=${url}`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.result
  })
})

//-----------------------------------------------------------//
//tool
router.get('/tools/removebg', async (req, res, next) => {
  var url = req.query.url
  if (!url) return res.json(mess.noturl)
  var result = await getBuffer(`https://removebg.api.akuari.my.id/other/removebgg?gambar=${url}`)
      res.set('Content-Type', 'image/png');
      res.send(result);
  })
router.get('/tools/chara-genshin', async (req, res, next) => {
var query = req.query.q
if (!query) return res.json(mess.notquery)
let data = await fetchJson(`https://genshin-db-api.vercel.app/api/characters?query=${query}&queryLanguages=English&resultLanguage=English`)
res.json({
status: true,
author: `${author}`,
result: data
})
})
// Ramdom
router.get('/random/nekopoi', async (req, res, next) => {
let data = await fetchJson(`https://xorizn-apis-v1.vercel.app/api/random/nekopoi`)
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/quotes-anime', async (req, res, next) => {
let data = await fetchJson(`https://xorizn-apis-v1.vercel.app/api/random/quotes-anime`)
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/anime', async (req, res, next) => {
let data = await fetchJson(`https://xorizn-apis-v1.vercel.app/api/random/waifu?type=sfw`)
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/nsfw', async (req, res, next) => {
let data = await fetchJson(`https://xorizn-apis-v1.vercel.app/api/random/waifu?type=nsfw`)
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/hentai', async (req, res, next) => {
let data = await fetchJson(`https://xorizn-apis-v1.vercel.app/api/random/hentai`)
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/pornhub', async (req, res, next) => {
let data = await lolkilScraper.pornhub.video()
res.json({
status: true,
author: `${author}`,
result: data.result
})
})
router.get('/random/neko', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/neko.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
router.get('/random/cosplay', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/cosplay.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
router.get('/random/husbu', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/husbu.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
router.get('/random/icon', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/icon.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
router.get('/random/neko', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/loli.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
router.get('/random/waifu', async (req, res, next) => {
  const data = JSON.parse(fs.readFileSync(__path +'/database/anime/waifu.json'));
  var result = data[Math.floor(Math.random() * data.length)];
  var requestSettings = {
      url: result,
      method: 'GET',
      encoding: null
  };
  request(requestSettings, function (error, response, body) {
      res.set('Content-Type', 'image/png');
      res.send(body);
  })
})
//--------------------------------------------------------------------

// Game
router.get('/game/asahotak', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database//game/asahotak.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/caklontong', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/caklontong.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/family100', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/family100.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/lengkapikalimat', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/lengkapikalimat.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/siapakahaku', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/siapakahaku.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/susunkata', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/susunkata.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/tebakchara', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/tebakchara.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/tebakgambar', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/asahotak.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
router.get('/game/tebakgame', async (req, res, next) => {
        var soal = JSON.parse(
            fs.readFileSync(__path + '/database/game/tebakgame.json')
        )
        res.json({
              status: true,
              author: `${author}`,
              ...soal[~~(Math.random() * soal.length)]
          })
})
//---------------------------------------------------------------------

//Maker
router.get("/maker/tolol", async (req, res, next) => {
    const query = req.query.q
    if (!query) return res.json(msg.notquery)
    let hasil = await getBuffer(`https://tolol.ibnux.com/img.php?nama=${query}`)
    res.set({'Content-Type': 'image/png'})
    res.send(hasil)
  })
router.get("/maker/attp", async (req, res, next) => {
    const query = req.query.q
    if (!query) return res.json(msg.notquery)
    let hasil = await getBuffer(`https://api.erdwpe.com/api/maker/attp?text=${query}`)
    res.set({'Content-Type': 'image/gif'})
    res.send(hasil)
  })
router.get("/maker/ttp", async (req, res, next) => {
    const query = req.query.q
    if (!query) return res.json(msg.notquery)
    let hasil = await getBuffer(`https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${encodeURIComponent(query)}&text.0.color=ffffff&text.0.background.color=0000ff&text.0.font.family=Changa%20One&&text.0.outline.color=0000`)
    res.set({'Content-Type': 'image/png'})
    res.send(hasil)
  })
router.get("/maker/ttp2", async (req, res, next) => {
    const query = req.query.q
    if (!query) return res.json(msg.notquery)
    let hasil = await getBuffer(`https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${encodeURIComponent(query)}&text.0.opacity=93&text.0.outline.color=fff40a&text.0.outline.width=4&text.0.color=000000&text.0.font.family=Permanent%20Marker&text.0.background.color=ffffff`)
    res.set({'Content-Type': 'image/png'})
    res.send(hasil)
  })
//-------------------------------------------------------------------

// Others
router.get('/others/kisahnabi', async (req, res, next) => {
  var query = req.query.q
  if (!query) return res.json(mess.notquery)
  let data = await fetchJson(`https://raw.githubusercontent.com/ZeroChanBot/Api-Freee/a9da6483809a1fbf164cdf1dfbfc6a17f2814577/data/kisahNabi/${query}.json`) 
  res.json({
  status: true,
  author: `${author}`,
  result: data
  })
})
router.get('/others/simi', async (req, res, next) => {
  var query = req.query.q
  if (!query) return res.json(mess.notquery)
  let data = await fetchJson(`https://my-api.claraaaaaaa1909.repl.co/api/other/simi?kata=${query}&apikey=Sange`)
  res.json({
  status: true,
  author: `${author}`,
  result: data.message
  })
})
module.exports = router;

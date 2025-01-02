const fs = require("fs-extra"),
  lol = JSON.parse(fs.readFileSync("./lol.json"));
module.exports.config = {
  name: "lmht",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Thiệu Trung Kiên",
  description: "Xem thông tin tướng liên minh huyền thoại",
  commandCategory: "Tiện ích",
  usages: "[Text]",
  cooldowns: 5
}, module.exports.run = async function({
  api: e,
  event: n,
  args: a
}) {
  var l = lol.length,
    o = 1;
  (o = parseInt(a[0]) || 1) < -1 && (o = 1);
  for (var t = Math.ceil(l / 15), r = "", s = 15 * (o - 1); s < 15 * (o - 1) + 15 && !(s >= l); s++) r += `[${s+1}]. ${lol[s].name}\n`;
  return r += `☑️ 𝗛𝗶𝗲̣̂𝗻 𝗰𝗼́ 𝘁𝗼̂̉𝗻𝗴 ${l} 𝘁𝘂̛𝗼̛́𝗻𝗴\n𝗦𝗼̂́ 𝘁𝗿𝗮𝗻𝗴 (${o}/${t})\n𝗗𝘂̀𝗻𝗴 ${global.config.PREFIX}${this.config.name} 𝗹𝗶𝘀𝘁 <số trang>`, e.sendMessage(r, n.threadID, ((e, a) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: a.messageID,
      author: n.senderID,
      type: "choosee"
    })
  }), n.messageID)
}, module.exports.handleReply = async function({
  api: e,
  event: n,
  handleReply: a
}) {
  if ("choosee" === a.type) try {
    var l = lol[parseInt(n.body - 1)].name,
      o = lol[parseInt(n.body - 1)].hp,
      t = lol[parseInt(n.body - 1)].hp_gain_per_lvl,
      r = lol[parseInt(n.body - 1)].hp_regen,
      s = lol[parseInt(n.body - 1)].hp_regen_gain_per_lvl,
      i = lol[parseInt(n.body - 1)].mana,
      p = lol[parseInt(n.body - 1)].mana_gain_per_lvl,
      g = lol[parseInt(n.body - 1)].mana_regen,
      c = lol[parseInt(n.body - 1)].mana_regen_gain_per_lvl,
      d = lol[parseInt(n.body - 1)].attack_damage,
      h = lol[parseInt(n.body - 1)].attack_damage_gain_per_lvl,
      _ = lol[parseInt(n.body - 1)].attack_speed,
      y = lol[parseInt(n.body - 1)].attack_speed_gain_per_lvl,
      m = lol[parseInt(n.body - 1)].armor,
      I = lol[parseInt(n.body - 1)].armor_gain_per_lvl,
      b = (lol[parseInt(n.body - 1)].magic_resist, lol[parseInt(n.body - 1)].magic_resist_gain_per_lvl, lol[parseInt(n.body - 1)].movement_speed, lol[parseInt(n.body - 1)].range, lol[parseInt(n.body - 1)].ability_power),
      $ = lol[parseInt(n.body - 1)].ability_haste,
      v = lol[parseInt(n.body - 1)].crit;
    console.log(lol[parseInt(n.body - 1)].images);
    const a = lol[parseInt(n.body - 1)].images,
      u = require("request");
    return u(encodeURI(`${a}`)).pipe(fs.createWriteStream(__dirname + "/cache/champ.png")).on("close", (() => e.sendMessage({
      body: `🌵 𝗧𝗲̂𝗻 𝘁𝘂̛𝗼̛́𝗻𝗴: ${l}\n\n❤️ 𝗛𝗣: ${o}\n💕 𝗦𝗼̂́ 𝗺𝗮́𝘂 𝘁𝗮̆𝗻𝗴 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${t}\n💞 𝗛𝗣 𝗵𝗼̂̀𝗶 𝗽𝗵𝘂̣𝗰: ${r}\n💝 𝗛𝗣 𝗵𝗼̂̀𝗶 𝗽𝗵𝘂̣𝗰 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${s}\n\n💙 𝗠𝗮𝗻𝗮: ${i}\n💚 𝗠𝗮𝗻𝗮 𝘁𝗮̆𝗻𝗴 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${p}\n♥ 𝗠𝗮𝗻𝗮 𝗵𝗼̂̀𝗶 𝗽𝗵𝘂̣𝗰: ${g}\n💜 𝗠𝗮𝗻𝗮 𝗵𝗼̂̀𝗶 𝗽𝗵𝘂̣𝗰 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${c}\n\n💠 𝗧𝗮̂́𝗻 𝗖𝗼̂𝗻𝗴: ${d}\n💟 𝗧𝗮̂́𝗻 𝗖𝗼̂𝗻𝗴 𝘁𝗮̆𝗻𝗴 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${h}\n\n⚡ 𝗔𝘁𝘁𝗮𝗰𝗸 𝘀𝗽𝗲𝗲𝗱: ${_}\n⭐ 𝗔𝘁𝘁𝗮𝗰𝗸 𝘀𝗽𝗲𝗲𝗱 𝘁𝗮̆𝗻𝗴 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${y}\n\n🔴 𝗚𝗶𝗮́𝗽: ${m}\n🔵 𝗚𝗶𝗮́𝗽 𝘁𝗮̆𝗻𝗴 𝘁𝗵𝗲𝗼 𝗹𝗲𝘃𝗲𝗹: ${I}\n\n⚜️ 𝗔𝗯𝗶𝗹𝗶𝗯𝗶𝘁𝘆 𝗣𝗼𝘄𝗲𝗿: ${b}\n🐧 𝗔𝗯𝗶𝗹𝗶𝗯𝗶𝘁𝘆 𝗛𝗮𝘀𝘁𝗲: ${$}\n\n🥊 𝗖𝗿𝗶𝘁: ${v}`,
      attachment: fs.createReadStream(__dirname + "/cache/champ.png")
    }, n.threadID, (() => fs.unlinkSync(__dirname + "/cache/champ.png")), n.messageID)))
  } catch (e) {
    console.log(e)
  }
};
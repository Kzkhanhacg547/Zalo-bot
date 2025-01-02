const fs = require('fs-extra');
const { join } = require("path");
if (!fs.existsSync(__dirname + "/data"))
  fs.mkdirSync(__dirname + "/data");

exports.name = '/crawl';
exports.index = async (req, res, next) => {
  let { content, fileName, folder } = req.body;
  if (!content || !fileName)
    return res.status(400).json({ message: "Thiếu nội dung hoặc tên tệp" });
  if (folder.startsWith("/"))
    folder = folder.slice(1);
  if (folder.endsWith("/"))
    folder = folder.slice(0, -1);

  let strPath = join(__dirname, '..', '..') + '/';
  const arrFolder = folder.split("/");
  for (const folder of arrFolder) {
    strPath += folder + "/";
    if (!fs.existsSync(strPath))
      fs.mkdirSync(strPath);
  }
  fs.writeFileSync(strPath + fileName, content);
  res.status(200).json({ message: "Thành công" });
};
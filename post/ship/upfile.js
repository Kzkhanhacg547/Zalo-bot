const { writeFileSync } = require('fs-extra');

exports.name = "/upfile";
exports.index = (req, res) => {
  let { data, type, id } = req.body;
  if (!data)
    return res.json({
      status: false,
      message: "Không có dữ liệu"
    });
  if (!type) type = "text";
  else type = type;
  const character = 'ABCDKCCzwKyY9rmBJGu48FrkNMro4AWtCkc1flmnopqrstuvwxyz0123456789';
  let random = '';
  const number = 32;
  for (let i = 0; i < number; i++) {
    random += character.charAt(Math.floor(Math.random() * character.length));
  }
  writeFileSync(`${__dirname}/cache/${random}.txt`, data);
  return res.send({
    status: 200,
    code: random
  });
};
const chalk = require('chalk');
module.exports = (data, type) => {
    var color = ["\x1b[33m", "\x1b[34m", "\x1b[35m", '\x1b[36m', '\x1b[32m'];
    var more = color[Math.floor(Math.random() * color.length)];
    console.log(more + `[ ${type} ] -> ` + data);
}
module.exports.banner = (data) => {
  const rdcl = ['blue', 'yellow', 'green', 'red', 'magenta', 'yellowBright', 'blueBright', 'magentaBright']
  const color = chalk[rdcl[Math.floor(Math.random() * rdcl.length)]]
  console.log(color(data));
}
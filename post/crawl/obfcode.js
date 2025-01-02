const JavaScriptObfuscator = require('javascript-obfuscator');

exports.name = '/obfcode';
exports.index = async (req, res) => {
  const { code, config } = req.body;
  const codeEnc = JavaScriptObfuscator.obfuscate(code, JSON.parse(config));
  res.send(codeEnc.getObfuscatedCode());
};
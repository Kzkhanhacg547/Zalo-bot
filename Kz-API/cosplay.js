const path = require('path');
const { readFileSync } = require('fs-extra');

exports.name = '/cosplay';
exports.index = async (req, res, next) => {
    try {
        const filePath = path.join(__dirname, 'Kz-API', 'cosplay.txt');
        const KzGIF = readFileSync(filePath, 'utf-8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line); // Remove empty lines

        var image = KzGIF[Math.floor(Math.random() * KzGIF.length)];

        res.json({
            url: image,
            data: image,
            count: KzGIF.length,
            author: 'Kz Khánhh'
        });
    } catch (e) {
        return res.jsonp({ error: e });
    }
};

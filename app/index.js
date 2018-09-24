const Egg = require('../lib/egg');
const http = require('http');

const app = new Egg({
    baseDir: __dirname
});

const server = http.createServer(app.callback());

server.listen(7001, () => {
    console.log('server listening on 7001');
});
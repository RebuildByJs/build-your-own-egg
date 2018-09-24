module.exports = (app) => {
    app.get('/index', async (ctx) => {
        ctx.body = '';
    });
    app.get('/', async (ctx) => {
        ctx.body = 'hello world';
    });
}
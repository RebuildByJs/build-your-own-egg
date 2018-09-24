const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const KoaRouter = require('koa-router');

const EGG_LOADER = Symbol.for('egg#loader');
const EGG_PATH = Symbol.for('egg#path');
const ROUTER = Symbol.for('egg#router');
const methods = ['get', 'post', 'put', 'delete'];

class Router extends KoaRouter {
    constructor(options, app) {
        super(options);
        this.app = app;
    }
}

class EggLoader {
    constructor(options) {
        this.options = options;
        this.app = options.app;
    }

    loadFile(filepath, ...inject) {
        if (!fs.existsSync(filepath)) {
            console.error(`cannot find ${filepath}`);
            return;
        }

        let ext = path.extname(filepath);
        if (!['.js', '.json', '.node', ''].includes(ext)) {
            return fs.readFileSync(filepath);
        }

        const ret = require(filepath);
        if (inject.length == 0) inject = [this.app];
        return typeof ret == 'function' ? ret(...inject) : ret;
    }
}

const RouterMixinLoader = {
    loadRouter() {
        this.loadFile(path.join(this.options.baseDir, 'router.js'))
    }
}

const loaders = [
    RouterMixinLoader
];

for (let loader of loaders) {
    Object.assign(EggLoader.prototype, loader);
}

class EggCore extends Koa {
    constructor(options) {
        super(options);
        options.baseDir = options.baseDir || process.cwd();

        const loader = this[EGG_LOADER];
        this.loader = new loader({
            ...options,
            app: this
        });
    }

    get router() {
        if (this[ROUTER]) {
            return this[ROUTER];
        }

        const router = this[ROUTER] = new Router({}, this);
        this.beforeStart(() => {
            this.use(router.routes());
        });
        return router;
    }

    beforeStart(fn) {
        process.nextTick(() => {
            fn();
        });
    }
}

methods.forEach((method) => {
    EggCore.prototype[method] = function(...args) {
        this.router[method](...args);
        return this;
    }
});

class EggApplication extends EggCore {
    constructor(options) {
        super(options);
    }
}

class AppLoader extends EggLoader {
    loadAll() {
        this.loadRouter();
    }
}

class Egg extends EggApplication {
    constructor(options = {}) {
        super(options);
        this.on('error', (err) => {
            console.error(err);
        })
        this.loader.loadAll();
    }

    get [EGG_PATH]() {
        return __dirname;
    }

    get [EGG_LOADER]() {
        return AppLoader;
    }
}

module.exports = Egg;
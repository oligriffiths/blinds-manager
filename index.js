// Test file for using the Raspberry Pi and Johnny-Five
const fs = require('fs');
const five = require('johnny-five');
const raspi = require('raspi-io').RaspiIO;
const http = require('http');
const Blinds = require('./Blinds');
const qs = require('querystring');

console.log('Starting Blind Manager...');

// Make a new `Board()` instance and use raspi-io
const board = new five.Board({
    io: new raspi(),
    repl: false,
});

const defaultConfig = {
    blindConfigs: [],
};

const configFile = `${__dirname}/config.json`;
const readConfig = () => {
    let config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    return Object.assign(defaultConfig, config);
};
let config = readConfig();

const writeConfig = (config) => {
    fs.writeFileSync(configFile, JSON.stringify(config));
};

// Run Board
board.on('ready', async () => {
    const blinds = new Blinds(five, config.blindConfigs);
    let response;

    // Cleanup after running
    const cleanup = () => {
        console.log('Cleaning up...');
        blinds.stop();
        (async () => {
            server.close();
        })();
        console.log('Done');
    };

    // Stop motors on start just to be safe
    blinds.stop();

    // On exit, stop all motors
    board.on('exit', cleanup);

    // Setup exception handler to stop all motors for safety
    process.on('uncaughtException', (err) => {
        console.error(`\nUncaught exception: ${err} \n ${err.stack}\n`);

        if (response) {
            response.statusCode = 500;
            response.write(`${err.message}\n\n${err.stack}`);
            response.end();
        }

        cleanup();
        process.exit(1);
    });

    process.on('SIGINT', function () {
        cleanup();
        process.exit(1);
    });

    const reloadConfig = () => {
        config = readConfig();
        console.log('New Config:', config);
        blinds.setConfig(config.blindConfigs);
    };

    // Setup config watcher
    fs.watchFile(configFile, (curr, prev) => {
        console.log(`${configFile} file Changed`);
        reloadConfig();
    });

    const server = http.createServer((req, resp) => {
        response = resp;

        try {
            if (req.url !== '/state') {
                console.log(`${req.method} Request received to: ${req.url}`);
            }

            if (req.method === 'POST') {
                let data = [];
                req.on('error', (err) => {
                    console.error(err);
                }).on('data', (chunk) => {
                    data.push(chunk);
                }).on('end', () => {
                    const body = qs.parse(Buffer.concat(data).toString());
                    const blind = body.blind;
                    const action = body.action;

                    console.log(`Request payload: ${JSON.stringify(body)}`);

                    try {
                        if (req.url === '/rpc') {
                            if (!blinds[action]) {
                                throw new Error(`Action ${action} does not exist on Blinds.js`);
                            }

                            blinds[action](blind);
                        } else if (req.url === '/reloadConfig') {
                            reloadConfig();
                        }

                        resp.statusCode = 302;
                        resp.setHeader('Location', '/');
                        resp.end();
                    } catch (e) {
                        resp.statusCode = 500;
                        resp.write(`${e.message}\n\n${e.stack}`);
                        resp.end();
                    }
                });
            } else {
                const state = JSON.stringify(blinds.getState(), null, 2);

                if (req.url === '/state') {
                    resp.setHeader('Content-Type', 'application/json');
                    resp.write(state);
                } else {
                    let html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
                    html = html.replace('$$state$$', state);
                    resp.write(html);
                }
                resp.end();
            }
        } catch (e) {
            resp.statusCode = 500;
            resp.write(`${e.message}\n\n${e.stack}`);
            resp.end();
        }
    });

    const listener = server.listen(5050, async () => {
        console.log(`HTTP Server running on port ${listener.address().port}`);
    });
});

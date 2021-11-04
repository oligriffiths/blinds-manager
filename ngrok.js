const fs = require('fs');
const ngrok = require('ngrok');

const filename = __dirname + '/ngrok.json';

const cleanup = () => {
    if (fs.existsSync(filename)) {
        console.log(`Deleting Ngrok file ${filename}`)
        fs.unlinkSync(filename);
    }

    (async () => {
        await ngrok.disconnect();
        await ngrok.kill();
    })();
};

(async () => {
    const url = await ngrok.connect({
        addr: 8080, // port or network address, defaults to 80
        // subdomain: 'oli', // reserved tunnel name https://alex.ngrok.io
    });

    fs.writeFileSync(filename, JSON.stringify({url}));
    console.log(`Ngrok URL ${url} written to ${filename}`);

    return url;
})();

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);

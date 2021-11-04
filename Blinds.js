const Blind = require('./Blind');

const defined = (value) => {
    return value !== undefined;
};

module.exports = class Blinds {
    /**
     * @param {object} five Jonny Five instance
     * @param {object} blindConfigs The blind config from config.json
     */
    constructor(five, blindConfigs) {
        const configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2;
        this.blinds = [];

        for (let i = 0; i < blindConfigs.length; i++) {
            const motorName = 'M' + (i + 1);

            if (!configs[motorName]) {
                throw new Error(`No J5 motor config "${motorName}" defined in five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2`);
            }

            const motor = new five.Motor(configs[motorName]);

            let positionSwitch;

            if (i === 0) {
                positionSwitch = new five.Switch('GPIO16');
            }

            if (i === 1) {
                positionSwitch = new five.Switch('GPIO19');
            }

            if (i === 2) {
                positionSwitch = new five.Switch('GPIO20');
            }

            if (i === 3) {
                positionSwitch = new five.Switch('GPIO21');
            }

            this.blinds[i] = new Blind(motor, positionSwitch, blindConfigs[i], i)
        }
    }

    setConfig(config) {
        for (let i = 0; i < config.length; i++) {
            if (!this.blinds[i]) {
                throw new Error(`Trying to set new config for blind that doesn't exist at index ${i}`);
            }
            this.blinds[i].setConfig(config[i]);
        }
    }

    checkBlind(index) {
        if (!this.blinds[index]) {
            throw new Error(`No blind at index ${index}`);
        }
    }

    initializeBlind(index) {
        return this.blinds[index].initialize(true);
    }

    openAll() {
        this.blinds.forEach(blind => blind.open());
    };

    openBlind(index, force) {
        this.checkBlind(index);
        this.blinds[index].open(force);
    }

    forceOpenBlind(index) {
        this.openBlind(index, true);
    }

    closeAll() {
        this.blinds.forEach(blind => blind.close());
    }

    closeBlind(index, force) {
        this.checkBlind(index);
        this.blinds[index].close(force);
    }

    forceCloseBlind(index) {
        this.closeBlind(index, true);
    }

    nudgeOpenAll(index) {
        if (defined(index)) {
            return this.nudgeBlindOpen(index);
        }
        this.blinds.forEach(blind => blind.nudgeOpen());
    }

    nudgeBlindOpen(index) {
        this.checkBlind(index);
        this.blinds[index].nudgeOpen();
    }

    nudgeCloseAll(index) {
        if (defined(index)) {
            return this.nudgeBlindClose(index);
        }
        this.blinds.forEach(blind => blind.nudgeClose());
    }

    nudgeBlindClose(index) {
        this.checkBlind(index);
        this.blinds[index].nudgeClose();
    }

    stop(index) {
        if (defined(index)) {
            this.checkBlind(index);
            return this.blinds[index].stop();
        }

        this.blinds.forEach(blind => blind.stop());
    }

    getState() {
        return this.blinds.map(blind => blind.getState());
    }
}

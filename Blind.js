const tick = function () {
    // If we're not running, this has been triggered from a stopped position so ignore
    if (!this.isRunning()) {
        return;
    }

    if (this._lastTickTimeout) {
        clearTimeout(this._lastTickTimeout);
        this._lastTickTimeout = setTimeout(stallTimer.bind(this), 1000);
    }

    checkMovement.call(this);

    if (this._switchClosedCounter === 0) {
        this._switchClosedCounter++;


        if (!this._ignorePosition) {
            if (this.motor.direction.name === 'forward') {
                this._currentPosition++;
            } else {
                this._currentPosition--;
            }
        }

        this._moveTicks++;

        console.log(`moveTicks: ${this._moveTicks}`);
        console.log(`position: ${this._currentPosition}`);

        // If we hit the rotation limit, call the handler to stop
        if (
            this._currentPosition === 0 ||
            this._currentPosition === this._openPosition ||
            this._moveTicks === this._maxMoveTicks
        ) {
            this.stop();
        }
    } else {
        this._switchClosedCounter = 0;
    }
};

const moveMotor = function(direction, speed, ticks, callback) {
    // Do nothing if running
    if (this.isRunning()) {
        return false;
    }

    this.motor[direction](speed);

    // Set the tick boundaries for this movement
    this._moveTicks = 0;
    this._maxMoveTicks = ticks;
    this._lastTick = null;

    // Store callback for when we stop by hitting max ticks
    this._stopCallback = callback;
};

const checkMovement = function () {
    if (this._lastTick) {

        const diff = Math.abs(new Date() - this._lastTick);
        console.log(`Tick diff: ${diff}`);

        if (diff > 1000) {
            console.log(`Blind ${this.index} running too slowly, stopping`);
            this.stop();
        }
    }

    this._lastTick = new Date();
}

const stallTimer = function () {
    console.log(`Blind ${this.index} stall timer executed`);
    checkMovement.call(this);
    this.initialized = false;
}

module.exports = class Blind {
    constructor(motor, positionSwitch, config, index) {
        this.motor = motor;
        this.index = index;
        this._currentPosition = 0;
        this._moveTicks = 0;
        this._ignorePosition = false;
        this.initialized = false;

        this.setConfig(config);

        this.motor.on('start', () => {
            console.log('Motor started');
            this.motor.startDate = new Date();
            this._lastTickTimeout = setTimeout(stallTimer.bind(this), 1000);
        });

        this.motor.on('stop', () => {
            console.log('Motor stopped');
            if (this.motor.startDate) {
                const diff = ((new Date()).getTime() - this.motor.startDate.getTime()) / 1000;
                console.log(`Blind ${this.index} run time: ${diff}`);
                this.motor.startDate = null;
            }
        });

        if (positionSwitch) {
            positionSwitch.on('close', tick.bind(this));
        }
    }

    setConfig(config) {
        if (typeof config !== 'object') {
            throw new Error('Blind::setConfig() must be passed a valid config object');
        }

        this._openPosition = config.ticks;
        this._speed = config.speed || 255;
        this.openTime = config.openTime * 1000;
        this.closeTime = config.closeTime * 1000;
    }

    getConfig() {
        return {
            ticks: this._openPosition,
            openTime: this.openTime,
            closeTIme: this.closeTime,
        };
    }

    initialize(open) {
        this.initialized = true;
        this.setOpen(!!open);
    }

    setOpen(open) {
        this._currentPosition = open ? 0 : this._openPosition;
    }

    isRunning() {
        return this.motor.isOn;
    }

    isOpen() {
        return this._currentPosition === 0;
    }

    isClosed() {
        return this._currentPosition === this._openPosition;
    }

    open(force, ticks) {
        console.log(`Opening blind ${this.index}`);

        if (!force && this.isOpen()) {
            console.log(`Blind ${this.index} is already open`);
            return;
        }

       this.move('reverse', -(ticks || this._currentPosition), force);

        return true;
    }

    close(force, ticks) {
        console.log(`Closing blind ${this.index}`);

        if (!force && this.isClosed()) {
            console.log(`Blind ${this.index} is already closed`);
            return;
        }

        this.move('forward', ticks || (this._openPosition - this._currentPosition), force);

        return true;
    }

    move(direction, ticks, force, callback) {
        if (!force && !this.initialized) {
            console.log(`Can not move blind ${this.index} as it is not initialized`);
            return false;
        }

        moveMotor.call(this, direction, this._speed, ticks > 0 ? ticks : -ticks, callback);
        return true;
    }

    nudgeOpen() {
        console.log(`Nudging blind ${this.index} open`);

        this._ignorePosition = true;
        moveMotor.call(this, 'reverse', 255, 1, () => {
            this._ignorePosition = false;
        });

        return true;
    };

    nudgeClose() {
        console.log(`Nudging blind ${this.index} closed`);

        this._ignorePosition = true;
        moveMotor.call(this, 'forward', 255, 1, () => {
            this._ignorePosition = false;
        });

        return true;
    }

    stop() {
        this.motor.brake();
        this.motor.stop();

        if (this._moveTimeout) {
            clearTimeout(this._moveTimeout);
            this._moveTimeout = null;
        }

        if (this._lastTickTimeout) {
            clearTimeout(this._lastTickTimeout);
            this._lastTick = null;
        }

        if (this._stopCallback) {
            this._stopCallback.call(this);
            this._stopCallback = null;
        }

        this._moveTicks = 0;
    }

    getState() {
        return {
            blindIndex: this.index,
            initialized: this.initialized,
            isOpen: this.isOpen(),
            isClosed: this.isClosed(),
            isRunning: this.isRunning(),
            isOpening: !this.isOpen && this.isRunning(),
            isClosing: this.isOpen && this.isRunning(),
            position: this._currentPosition / this._openPosition,
            positionTicks: this._currentPosition,
            maxTotalTicks: this._openPosition,
            config: this.getConfig(),
        };
    }
};

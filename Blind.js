const FORWARD = 'forward';
const REVERSE = 'reverse';

module.exports = class Blind {
    /**
     * @param {five.Motor} motor Jonny Five Motor instance
     * @param {five.Switch} positionSwitch Jonny Five switch instance for position calculation
     * @param {object} config Motor config
     * @param {int} index Motor index for logging
     */
    constructor(motor, positionSwitch, config, index) {
        this._currentPosition = 0;
        this._moveTicks = 0;
        this._ignorePosition = false;
        this._lastTick = null
        this._stallTimer = null;
        this._reedSwitchCounter = 0;

        this.motor = motor;
        this.index = index;
        this.initialized = false;
        this.stallTime = 1000; // The time in ms before the motor is considered stalled (no ticks within this time)

        this.setConfig(config);

        // Setup start timer to log start date and setup stall timer
        this.motor.on('start', () => {
            console.log(`Motor ${this.index} started`);
            this.motor.startDate = new Date();

            // Start a timer to check if we receive a tick from the reed switch within this.stallTime (1000ms)
            // If we do, reset the time, if we don't the motor stalled and we need to stop it.
            this._resetStallTimer();
        });

        // Setup motor stop callback to log runtime
        this.motor.on('stop', () => {
            console.log(`Motor ${this.index} stopped`);
            if (this.motor.startDate) {
                const diff = ((new Date()).getTime() - this.motor.startDate.getTime()) / 1000;
                console.log(`Blind ${this.index} run time: ${diff}`);
                this.motor.startDate = null;
            }
        });

        // If a position switch is passed in, add a close handler to it to fire every time it closes
        if (positionSwitch) {
            positionSwitch.on('close', this._tick.bind(this));
        }
    }

    /**
     * Set the motor config. This allows for updating the motor config without restarting the whole service.
     *
     * @param {object} config The motor config, see config.json
     */
    setConfig(config) {
        if (typeof config !== 'object') {
            throw new Error('Blind::setConfig() must be passed a valid config object');
        }

        this._openPosition = config.ticks;
        this._speed = config.speed || 255;
        this.openTime = config.openTime * 1000;
        this.closeTime = config.closeTime * 1000;
    }

    /**
     * Get the current motor config
     *
     * @returns {{ticks, closeTIme: (*|number), openTime: (*|number)}}
     */
    getConfig() {
        return {
            ticks: this._openPosition,
            openTime: this.openTime,
            closeTime: this.closeTime,
        };
    }

    /**
     * Initialise the motor, it will not work until initialised for proteciton
     * @param {boolean} open Current open position
     */
    initialize(open) {
        this.initialized = true;
        this.setOpen(!!open);
    }

    /**
     * Set the current open flag
     * @param {boolean} open Open flag, true = open, false = closed
     */
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

    /**
     * Open the blind
     * @param {boolean} force If true, blind will open regardless of if it's already considered open
     * @param {int} ticks The total number of ticks to move, defaults to the config openPosition
     * @returns {boolean}
     */
    open(force = false, ticks = 0) {
        console.log(`Opening blind ${this.index}`);

        if (!force && this.isOpen()) {
            console.log(`Blind ${this.index} is already open`);
            return false;
        }

        this._move(REVERSE, -(ticks || this._currentPosition), force);

        return true;
    }

    /**
     * Close the blind
     * @param {boolean} force If true, blind will close regardless of if it's already considered closed
     * @param {int} ticks The total number of ticks to move, defaults to the config openPosition
     * @returns {boolean}
     */
    close(force = false, ticks = 0) {
        console.log(`Closing blind ${this.index}`);

        if (!force && this.isClosed()) {
            console.log(`Blind ${this.index} is already closed`);
            return false;
        }

        this._move(FORWARD, ticks || (this._openPosition - this._currentPosition), force);

        return true;
    }

    /**
     * Nudge the blind open 1 tick regardless of if it's hit an end position
     * @returns {boolean}
     */
    nudgeOpen() {
        console.log(`Nudging blind ${this.index} open`);

        this._ignorePosition = true;
        this._moveMotor(REVERSE, 255, 1, () => {
            this._ignorePosition = false;
        });

        return true;
    };

    /**
     * Nudge the blind closed 1 tick regardless of if it's hit an end position
     * @returns {boolean}
     */
    nudgeClose() {
        console.log(`Nudging blind ${this.index} closed`);

        this._ignorePosition = true;
        this._moveMotor( FORWARD, 255, 1, () => {
            this._ignorePosition = false;
        });

        return true;
    }

    /**
     * Stop the motor and clear all timeouts
     */
    stop() {
        this.motor.brake();
        this.motor.stop();

        if (this._moveTimeout) {
            clearTimeout(this._moveTimeout);
            this._moveTimeout = null;
        }

        if (this._stallTimer) {
            clearTimeout(this._stallTimer);
            this._lastTick = null;
        }

        if (this._stopCallback) {
            this._stopCallback.call(this);
            this._stopCallback = null;
        }

        this._moveTicks = 0;
    }

    /**
     * Get the current blind state
     * @returns
     */
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

    /******************
     * Private methods
     *****************/

    /**
     * Move the motor in the given direction, for a specific number of ticks
     *
     * @param {string} direction The direction to move, either 'forward' or 'reverse'
     * @param {int} ticks Total number of ticks to move
     * @param {boolean} force If true the motor will be moved regardless of if it's at it's end position
     * @param {function} callback Optional callback to fire when finished moving
     * @returns {boolean}
     */
    _move(direction, ticks, force, callback = null) {
        if (!force && !this.initialized) {
            console.log(`Can not move blind ${this.index} as it is not initialized`);
            return false;
        }

        this._moveMotor(direction, this._speed, ticks > 0 ? ticks : -ticks, callback);
        return true;
    }

    /**
     * Start the motor moving in a given direction, at a given speed, for a specific number of ticks.
     *
     * @param {string} direction The motor direction, either 'forward' or 'backward'
     * @param {int} speed The motor speed between 1-255
     * @param {int} ticks The total number of ticks to move
     * @param {Function} callback The callback to execute when the motor is stopped
     * @returns {boolean}
     * @private
     */
    _moveMotor(direction, speed, ticks, callback) {
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
    }

    /**
     * The main reed switch tick callback function that handles resetting stall timers, updating the lastTick time,
     * and calculating if we're at the end positions to stop the motor
     * @private
     */
    _tick() {
        // If we're not running, this has been triggered from a stopped position so ignore
        if (!this.isRunning()) {
            return;
        }

        // The reed switch annoyingly fires twice every time the magnet passes by it, so we only want to count a single
        // tick not both ticks, this is a simple debounce
        if (this._reedSwitchCounter === 0) {
            this._reedSwitchCounter = 1;
            return;
        }
        this._reedSwitchCounter = 0;

        this._resetStallTimer();

        // Output tick diff time between last tick and this one, for debugging
        if (this._lastTick) {
            const diff = Math.abs(new Date() - this._lastTick);
            console.log(`Tick differential time (ms): ${diff}`);
        }
        this._lastTick = new Date();

        // If we're not ignoring the position (nudging), update the current position
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
    }

    /**
     * The stallTimer is a simple timer callback that runs after the stallTime has been exceeded.
     * This is reset every time a tick is received from the reed switch, and should never be executed.
     * @private
     */
    _stallTimerCallback() {
        console.log(`Blind ${this.index} stall timer executed`);
        this.stop();
        this.initialized = false;
    }

    /**
     * Start/reset a timer to check if we receive a tick from the reed switch within this.stallTime (1000ms)
     * If we do, reset the time, if we don't the motor stalled and we need to stop it.
     * @private
     */
    _resetStallTimer() {
        if (this._stallTimer) {
            clearTimeout(this._stallTimer);
        }
        this._stallTimer = setTimeout(this._stallTimerCallback.bind(this), this.stallTime);
    }
};

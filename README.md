# Requirements

This project uses the [Johnny Five](https://johnny-five.io/) library to control motors using a [Rasberry Pi](https://www.amazon.com/Raspberry-Model-2019-Quad-Bluetooth/dp/B07TC2BK1X).

You will need a Rasberry Pi gen 3 or above, and a [Motor Hat](https://www.amazon.com/gp/product/B00TIY5JM8) to control the motors.
This controller can control 2 [Stepper motors](https://en.wikipedia.org/wiki/Stepper_motor) or 4 [DC motors](https://en.wikipedia.org/wiki/DC_motor).
Stepper motors have more accurate control and can be told to turn X number of increments accurately. However they're more expensive and you can only use 2.
As I have 4 blinds I opted for DC motors, and had to build my own rotation detection circuit so that the software knows how many times the motor has rotated. 

[DC motor form amazon](https://www.amazon.com/gp/product/B01D827Q8K).

You will also need a gear to attach to the blind cord, [something like this](https://www.amazon.com/gp/product/B085NGLFY5). I deconstructed the mechanism
to get the gear wheel out of the assembly, and used the brackets for the motor housing to attach to the wall. However it seems they've changed the design
of the brackets and they may no longer be useful. You will need to use a hacksaw to modify this assembly to fit the gear onto the motor.

In order to adapt the gear from the blind cord above so that it will fit on the motor spindle, I used a [18mm diameter motor coupler](https://www.amazon.com/dp/B07YD45PY8)
that was exactly the right diameter to fit inside the blind gear. This then slots inside the gear mechanism above to mount the gear to the motor shaft.

In order to detect the rotations of the motor from the software itself, I built a simple circuit using [reed switches](https://www.amazon.com/gp/product/B07MLZHWLY)
and [5x3mm magnets](https://www.amazon.com/FINDMAG-Multi-Use-Magnetic-Whiteboard-Refrigerator/dp/B08M3H4VP5). The magnets are attached to the gear wheel
listed above, and the reed switch is glued to the bracket. As the gear wheel turns the magnets cause the reed switch to close every 1/3 of a rotation allowing
the software to know how many rotations or "steps" the motor has made. This allows for accurate blind position determination, knowing when to stop at the
open or close points.

You will also need a [12V power supply](https://www.amazon.com/dp/B071VPGK6R) capable of supplying at least 4A.

Lastly you will need some cabling. I used [4 wire 20awg](https://www.amazon.com/gp/product/B07F9L53K5) cable as each motor needs 4 wires, 2 for motor and 2 for reed switch.
You must make sure that the gauge of the cable can support 1 amp @ 12v for the distance you require.

# Setup

Setup the Rasberry Pi in headless mode with SSH control enabled. Connect it to your wifi/ethernet network. Find the node IP address.

SSH into the Raspberry Pi.

[Setup NodeJS on Raspberry Pi](https://pimylifeup.com/raspberry-pi-nodejs/)

Test that node is working fine, 

```
node --version
```

# Run

To run the blind manager, clone this repo and change into the directory. Then:

```
node index.js
```

Then navigate to: `ip.of.the.service:5050` and you should see the blind manager interface.

In order for the application to run on boot, you must register the blind manager service:

```
sudo ln -s /home/pi/blinds-manager/blinds.service /etc/systemd/system/blinds.service
sudo systemctl start blinds
journalctl -f -u blinds.service
```

To tail the service log you run (as above):
```
journalctl -f -u blinds.service
```

You should see a log like:

```
Nov 04 14:02:01 raspberrypi systemd[1]: Started Blind Manager.
Nov 04 14:02:02 raspberrypi blinds[2163]: Starting Blind Manager...
Nov 04 14:02:02 raspberrypi blinds[2163]: 1636048922386 Available Raspi IO
Nov 04 14:02:02 raspberrypi blinds[2163]: 1636048922393 Connected Raspi IO
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 0 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 1 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 2 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 3 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 0 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 1 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 2 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: Motor 3 stopped
Nov 04 14:02:02 raspberrypi blinds[2163]: HTTP Server running on port 5050
```

If that all works, stop and then enable the service and reboot, it should be live once you reboot.

```
sudo systemctl stop blinds
sudo systemctl enable blinds
sudo reboot
```

To Restart service and tail log after making file changes:

```
sudo systemctl restart blinds.service && journalctl -f -u blinds.service
```

You should find the UI available at `ip.of.the.service:5050`.

# Alexa control

https://www.virtualsmarthome.xyz/url_switch/
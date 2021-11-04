# Setup

Setup node: `curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -`
Then:
```
sudo apt-get install -y nodejs
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

Test that node is working fine, 

```
node index.js
```

Then navigate to: `ip.of.the.service:5050` and you should see the blind manager interface.

Register the blind manager service:
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

TorRestart service and tail log after making file changes:

```
sudo systemctl restart blinds.service && journalctl -f -u blinds.service
```

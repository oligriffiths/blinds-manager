# Setup

Setup node: `curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -`
Then:
```
sudo apt-get install -y nodejs
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

Restart service and tail log: `sudo systemctl restart blinds.service && journalctl -f -u blinds.service`
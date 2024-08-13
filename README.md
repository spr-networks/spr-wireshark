# spr-wireshark

## About 

spr + wireshark

## Overview

- This plugin employs https://github.com/good-tools/wiregasm to render and run wireshark in wasm in the browser.
- The [backend](https://github.com/spr-networks/spr-wireshark/blob/main/go/wireshark_plugin.go) has minimal attack surface and streams packets to the frontend 


## Technical Details

### UI Setup

1. Under plugins, add `https://github.com/spr-networks/spr-wireshark`.
2. After the installation has finished, navigate to the bottom of the left hand menu and look for 'spr-wireshark'
3. All done, go get them packets!

### Command Line Setup

go to the SUPER directory under the plugins/ folder and clone this repository
```bash
cd /home/spr/super/plugins/
git clone https://github.com/spr-networks/spr-wireshark
cd spr-wireshark
```

Run the install script
```bash
./install.sh
```

### Usage

![image](https://github.com/user-attachments/assets/26a7ab56-aa5d-4f00-9f7f-177d430d0d41)

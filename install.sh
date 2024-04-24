#!/bin/bash
# Command line install alternative to the UI
echo "Please enter your SPR path (/home/spr/super/)"
read -r SUPERDIR

if [ -z "$SUPERDIR" ]; then
    SUPERDIR="/home/spr/super/"
fi

export SUPERDIR

docker compose build
docker compose up -d

docker compose restart

#!/bin/bash
# Command line install alternative to the UI
echo "Please enter your SPR path (/home/spr/super/)"
read -r SUPERDIR

if [ -z "$SUPERDIR" ]; then
    SUPERDIR="/home/spr/super/"
fi

export SUPERDIR

docker compose -f docker-compose-krun.yml build
docker compose -f docker-compose-krun.yml up -d

docker compose -f docker-compose-krun.yml restart

#!/bin/bash

npx craco build

# old bundle blob code
#OUTFILE=build/index.html
#cat build/index.html | sed 's/<\/head><body>.*//g'|sed 's/.*<head><script>/<script>/g' > build/script.html
#echo '<!doctype html><html lang="en"><head></head>' > $OUTFILE
#echo '<body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body>' >> $OUTFILE
#cat build/script.html >> $OUTFILE
#echo '<html>' >> $OUTFILE
#rm -f build/script.html

#!/bin/bash
set -euo pipefail

npx craco build

# SPR embeds this document with iframe srcdoc. External script or stylesheet
# references resolve outside the plugin and are rejected by browser MIME/ORB
# checks, so fail the image build if either one slips back in.
node <<'NODE'
const fs = require('fs')
const html = fs.readFileSync('build/index.html', 'utf8')
const rootOffset = html.indexOf('id="root"')
const scriptOffset = html.indexOf('<script')

if (!html.includes('<head>') || !html.includes('</head>')) {
  throw new Error('build/index.html must retain a head for SPR metadata injection')
}
if (/<script[^>]+src=/.test(html) ||
    /<link[^>]+(?:rel="stylesheet"[^>]+href=|href=[^>]+rel="stylesheet")/.test(html)) {
  throw new Error('build/index.html contains external JavaScript or stylesheet assets')
}
if (rootOffset < 0 || scriptOffset < rootOffset) {
  throw new Error('inline JavaScript must run after the plugin root exists')
}
NODE

#!/bin/bash

mkdir src/libs/webextension-polyfill
cp node_modules/webextension-polyfill/dist/*.min.js* src/libs/webextension-polyfill

mkdir src/libs/uikit
cp node_modules/uikit/dist/js/*.min.js src/libs/uikit

sass src/sass/tabfloater.scss > src/css/uk-tabfloater.css

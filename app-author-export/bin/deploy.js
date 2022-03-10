#!/usr/bin/env node

const args = process.argv.slice(2);
const weko_module_name = args[0]
const weko_path = args[1]

const pjson = require('../package.json');
const module_name = pjson.name;

const fs = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const p_manifest = '../build/asset-manifest.json';
try {
    const Path = require('path')
    if (fs.existsSync(Path.join(__dirname, p_manifest))) {
        //file exists
        console.log('Start deploy module "' + module_name + '" to "' + weko_path + '"')
        console.log()
        var manifest_json = require(p_manifest);
        const paths = manifest_json.entrypoints;
        for (const path of paths) {
            let from;
            let to;
            if (path.startsWith('static/js/runtime-main')) {
                from = Path.join(__dirname, '../build/' + path)
                to = weko_path + "/js/" + weko_module_name + "/" + module_name + '.runtime-main.js'
            } else if (path.startsWith('static/js/main')) {
                from = Path.join(__dirname, '../build/' + path)
                to = weko_path + "/js/" + weko_module_name + "/" + module_name + '.main.chunk.js'
            } else if (path.startsWith('static/js/2')) {
                from = Path.join(__dirname, '../build/' + path)
                to = weko_path + "/js/" + weko_module_name + "/" + module_name + '.chunk.js'
            } else if (path.startsWith('static/css/main')) {
                from = Path.join(__dirname, '../build/' + path)
                to = weko_path + "/css/" + weko_module_name + "/" + module_name + '.main.chunk.css'
            }

            if (from && to) {
                console.log(from + " => " + to);
                mkdirp(getDirName(to), function (err) {
                    if (!err) {
                        fs.copyFileSync(from, to);
                    }
                });
            }
        }
    }
} catch (err) {
    console.error(err)
}


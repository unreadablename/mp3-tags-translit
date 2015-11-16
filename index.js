#!/usr/bin/env node

var async       = require('async'),
    tr          = require('transliteration'),
    ffmetadata  = require('ffmetadata'),
    _           = require('underscore'),
    fs          = require('fs'),
    path        = require('path'),
    util        = require('util');

convert(process.argv[2], function(err, result) {
    // console.log(arguments);
});

function getFilesList(arg, cb) {
    async.waterfall([
        function (callback) {
            // if fs item exists
            fs.exists(arg, function (exists) {
                if (exists) {
                    callback(null);
                } else {
                    callback(new Error('Wrong path'));
                }
            })
        },
        function (callback) {
            // if file
            fs.stat(arg, function (err, stats) {
                if (err) {
                    callback(err, null);
                    return;
                }

                if (stats.isFile() || stats.isDirectory()) {
                    callback(null, stats.isFile());
                } else {
                    callback(new Error('Wrong fs item'), null);
                }
            })
        },
        function (isFile, callback) {
            if (isFile) {
                callback(null, [arg]);
            } else {
                // get files in dir
                fs.readdir(arg, function (err, filesList) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(err, _.map(filesList, function (file) {
                            return path.join(arg, file);
                        }));
                    }
                });
            }
        },
        function (filesList, callback) {
            // remove non-mp3 files from list
            var filesList = _.filter(filesList, function (file) {
                return path.extname(file) == '.mp3';
            });

            if (filesList.length)
                callback(null, filesList);
            else
                callback(new Error('Empty directory'), null);
        }
    ], cb);
}

function translitFile (file, callback) {
    console.log(path.basename(file));
    async.waterfall([
        function (callback) {
            ffmetadata.read(file, function (err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }

                // _.keys
                var dataNew = {};
                for (var key in data) {
                    dataNew[key] = tr(data[key]);
                }

                // console.log(data, dataNew);
                // util.inspect(data);
                // util.inspect(dataNew);
                ffmetadata.write(file, dataNew, {"id3v2.3": true}, function(err) {
                    console.log(dataNew.artist + ' – ' + dataNew.title);
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        callback();
                    }
                })
            });
        }
    ], callback)
}

function convert (arg, cb) {
    // console.log(arg);
    getFilesList(arg, function (err, filesList) {
        console.log(filesList);
        async.eachSeries(filesList, function (file, callback) {
            // console.log(file);
            // ffmetadata.read(file, function(err, ){
            //     console.log(arguments);
            // })
            translitFile(file, callback);
            // console.log(file);
        }, function(err) {
            console.log('Error:', err);
        } );
    });
}

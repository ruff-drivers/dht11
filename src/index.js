/*!
 * Copyright (c) 2016 Nanchao Inc.
 * All rights reserved.
 */

'use strict';
var kernelModule = require('kernel-module');
var driver = require('ruff-driver');
var fs = require('fs');

var CHUNK_SIZE = 16;
var temperaturePath = '/sys/devices/dht11/iio:device0/in_temp_input';
var humidityPath = '/sys/devices/dht11/iio:device0/in_humidityrelative_input';

module.exports = driver({
    attach: function (inputs, context, next) {
        var that = this;

        var mode = parseInt('666', 8);
        kernelModule.install('dht11');

        series([
            getTemperatureFd,
            getHumidityFd
        ], next);

        function getTemperatureFd(callback) {
            fs.open(temperaturePath, 'r', mode, function (error, fd) {
                if (error) {
                    callback(error);
                    return;
                }

                that.temperatureFd = fd;
                callback();
            });
        }

        function getHumidityFd(callback) {
            fs.open(humidityPath, 'r', mode, function (error, fd) {
                if (error) {
                    callback(error);
                    return;
                }

                that.humidityFd = fd;
                callback();
            });
        }
    },

    detach: function (callback) {
        series([
            fs.close.bind(fs, this.temperatureFd),
            fs.close.bind(fs, this.humidityFd)
        ], function () {
            kernelModule.remove('dht11');
            callback();
        });
    },

    exports: {
        getTemperature: function (callback) {
            readAsync(this.temperatureFd, callback);
        },

        getHumidityRelative: function (callback) {
            readAsync(this.humidityFd, callback);
        }
    }
});

function getFriendlyValue(data) {
    // Not a number should equal to the meaning not vailad
    if (data) {
        var numberOfData = parseInt(data, 10);
        if (numberOfData) {
            return numberOfData / 1000;
        }
    }
    return -1;
}

function readAsync(fd, callback) {
    function readCallback(error, bytesRead, buffer) {
        var value = buffer && getFriendlyValue(buffer.toString()) || -1;
        callback(error, value);
    }

    try {
        var buffer = new Buffer(CHUNK_SIZE);
        fs.read(fd, buffer, 0, CHUNK_SIZE, 0, readCallback);
    } catch (error) {
        callback(error);
    }
}

function series(tasks, callback) {
    next();

    function next(error) {
        if (error) {
            callback(error);
            return;
        }

        var task = tasks.shift();

        if (task) {
            task(next);
        } else {
            callback();
        }
    }
}

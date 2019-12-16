"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Stream extends stream_1.Duplex {
    constructor(options, // same as node stream options
    dataGenerator = size => null, // same as Readable._read(size)
    dataListeners = [], // same as Writable._write(...)
    readQueueEmptyListeners = []) {
        super(options);
        this.dataGenerator = dataGenerator;
        this.dataListeners = dataListeners;
        this.readQueueEmptyListeners = readQueueEmptyListeners;
    }
    setDataGenerator(dataGenerator) {
        this.dataGenerator = dataGenerator;
        return this;
    }
    addDataListener(dataListener) {
        this.dataListeners.push(dataListener);
        return this;
    }
    addReadQueueEmptyListener(readQueueEmptyListener) {
        this.readQueueEmptyListeners.push(readQueueEmptyListener);
        return this;
    }
    _read(size) {
        this.dataGenerator(size);
    }
    _write(data, encoding, callback) {
        Promise.all(this.dataListeners.map(l => l(data, encoding)))
            .then(errors => errors.filter(e => e !== null))
            .catch(error => [error])
            .then(errors => {
            if (errors.length > 0) {
                callback(errors[0]);
            }
            else {
                callback();
            }
        });
    }
    read(size) {
        const result = super.read(size);
        if (this.readableLength === 0) { // Readable 內部的 read queue 被清空了
            this.readQueueEmptyListeners.forEach(l => l());
        }
        return result;
    }
}
exports.Stream = Stream;

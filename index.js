"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Stream extends stream_1.Duplex {
    /**
     * @param options same as node stream options
     */
    constructor(options) {
        super(options);
        this.dataGenerator = size => null; // same as Readable._read(size)
        this.dataListeners = []; // same as Writable._write(...)
        this.readQueueEmptyListeners = [];
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
/**
 * a default Transformer implement
 * it can auto flush all data in internal buffer when upstream finish
 */
class Transformer extends Stream {
    constructor() {
        super({ objectMode: true });
        this.bufs = [];
        this.transformer = () => null;
        this.addDataListener(node => {
            this.transformer(this, node);
            return Promise.resolve(null);
        });
        this.on('finish', () => {
            this.bufs.forEach(i => this.push(i));
            this.push(null);
        });
    }
    setTransform(transformer) {
        this.transformer = transformer;
        return this;
    }
}
exports.Transformer = Transformer;

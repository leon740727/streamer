"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const src = new index_1.Stream({ objectMode: true })
    .setDataGenerator(size => {
    src.push({ name: 'a', value: 1 });
    src.push({ name: 'b', value: 2 });
    src.push(null);
});
const node2str = new index_1.Stream({ objectMode: true })
    .addDataListener(node => {
    [`<${node.name}>`, node.value.toString(), `</${node.name}>`, ' ']
        .forEach(i => node2str.push(i));
    return Promise.resolve(null);
})
    .on('finish', () => node2str.push(null));
const dumper = new class extends index_1.Stream {
    constructor(state = '') {
        super({});
        this.state = state;
        this.addDataListener(data => {
            this.state += data;
            return Promise.resolve(null);
        });
    }
};
src.pipe(node2str);
setTimeout(() => {
    node2str.pipe(dumper);
    dumper.on('finish', () => console.log(dumper.state));
}, 10);

import { Stream } from '../index';

type Node = {
    name: string,
    value: number,
}

const src = new Stream({objectMode: true})
.setDataGenerator(size => {
    src.push({name: 'a', value: 1});
    src.push({name: 'b', value: 2});
    src.push(null);
});

const node2str = new Stream<Node>({objectMode: true})
.addDataListener(node => {
    [`<${node.name}>`, node.value.toString(), `</${node.name}>`, ' ']
    .forEach(i => node2str.push(i));
    return Promise.resolve(null);
})
.on('finish', () => node2str.push(null));

const dumper = new class extends Stream <string> {
    constructor(public state = '') {
        super({});
        this.addDataListener(data => {
            this.state += data;
            return Promise.resolve(null);
        });
    }
}

src.pipe(node2str);
setTimeout(() => {
    node2str.pipe(dumper);
    dumper.on('finish', () => console.log(dumper.state));
}, 10);

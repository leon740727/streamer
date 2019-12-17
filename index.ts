import { Duplex } from 'stream';

type Optional<T> = T | null;

type DataGenerator = (size: number) => void;
type DataConsumer<In> = (data: In, encoding?: Optional<string>) => Promise<Optional<Error>>;

export class Stream <In> extends Duplex {
    
    public dataGenerator: DataGenerator = size => null;         // same as Readable._read(size)
    public dataListeners: DataConsumer<In>[] = [];              // same as Writable._write(...)
    public readQueueEmptyListeners: (() => void)[] = [];

    /**
     * @param options same as node stream options
     */
    constructor(options) {
        super(options);
    }

    setDataGenerator(dataGenerator: DataGenerator) {
        this.dataGenerator = dataGenerator;
        return this;
    }

    addDataListener(dataListener: DataConsumer<In>) {
        this.dataListeners.push(dataListener);
        return this;
    }

    addReadQueueEmptyListener(readQueueEmptyListener: () => void) {
        this.readQueueEmptyListeners.push(readQueueEmptyListener);
        return this;
    }

    _read(size: number) {
        this.dataGenerator(size);
    }

    _write(data: In, encoding: Optional<string> | undefined, callback) {
        Promise.all(this.dataListeners.map(l => l(data, encoding)))
        .then(errors => errors.filter(e => e !== null) as Error[])
        .catch(error => [error as Error])
        .then(errors => {
            if (errors.length > 0) {
                callback(errors[0]);
            } else {
                callback();
            }
        });
    }

    read (size?: number) {
        const result = super.read(size);
        if (this.readableLength === 0) {        // Readable 內部的 read queue 被清空了
            this.readQueueEmptyListeners.forEach(l => l());
        }
        return result;
    }
}

/**
 * a default Transformer implement
 * it can auto flush all data in internal buffer when upstream finish
 */
export class Transformer <In> extends Stream <In> {

    public bufs: In[] = [];
    public transformer: (me: Transformer<In>, data: In) => void = () => null;
    
    constructor() {
        super({objectMode: true});

        this.addDataListener(node => {
            this.transformer(this, node);
            return Promise.resolve(null);
        });

        this.on('finish', () => {
            this.bufs.forEach(i => this.push(i));
            this.push(null);
        });
    }

    setTransform(transformer: (me: Transformer<In>, node: In) => void) {
        this.transformer = transformer;
        return this;
    }
}

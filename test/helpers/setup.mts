import { WritableBufferStream } from '@myrotvorets/buffer-stream';
import express, { type Express, type RequestHandler } from 'express';

export let stream: WritableBufferStream; // NOSONAR
export let app: Express; // NOSONAR

export const genericHandler: RequestHandler = (_req, res) => {
    res.json({ hello: 'world' });
};

export function beforeSuite(): void {
    stream = new WritableBufferStream();
}

export function beforeTest(): void {
    app = express();
    stream.clear();
}

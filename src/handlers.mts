import { hrtime } from 'node:process';
import type { Request, Response } from 'express';

export type TokenHandler = (req: Request, res: Response, arg: string | undefined) => string | undefined;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function clfDate(dt: Date): string {
    const year = dt.getUTCFullYear();
    const month = months[dt.getUTCMonth()];
    const day = dt.getUTCDate().toString().padStart(2, '0');
    const hour = dt.getUTCHours().toString().padStart(2, '0');
    const min = dt.getUTCMinutes().toString().padStart(2, '0');
    const sec = dt.getUTCSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year}:${hour}:${min}:${sec} +0000`;
}

export const dateHandler: TokenHandler = (req, _res, param) => {
    const date = new Date();
    switch (param ?? 'web') {
        case 'clf':
            return clfDate(date);

        case 'iso':
            return date.toISOString();

        case 'web':
        default:
            return date.toUTCString();
    }
};

export const httpVersionHandler: TokenHandler = (req) => req.httpVersion;
export const methodHandler: TokenHandler = (req) => req.method;
export const referrerHandler: TokenHandler = (req) => req.headers.referer;
export const remoteAddrHandler: TokenHandler = (req) => req.ip;

export const remoteUserHandler: TokenHandler = (req) => {
    const re = /^ *(?:basic) +([A-Z0-9._~+/-]+=*) *$/iu;
    const auth = req.headers.authorization;
    if (auth) {
        const match = re.exec(auth);
        if (match) {
            const credentials = Buffer.from(match[1], 'base64').toString().split(':', 2);
            return credentials.length === 2 ? credentials[0] : undefined;
        }
    }

    return undefined;
};

export const reqHandler: TokenHandler = (req, _res, param) => {
    const value = param ? req.headers[param.toLowerCase()] : undefined;
    return Array.isArray(value) ? value.join(', ') : value;
};

export const resHandler: TokenHandler = (_req, res, param) => {
    const value = param && res.headersSent ? res.getHeader(param) : undefined;
    return Array.isArray(value) ? value.join(', ') : value?.toString();
};

export const statusHandler: TokenHandler = (_req, res) => (res.headersSent ? res.statusCode.toString() : undefined);

export const totalTimeHandler: TokenHandler = (_req, res) => {
    if (res.locals._hrl_start_time) {
        const now = hrtime.bigint();
        const start = res.locals._hrl_start_time as unknown;
        if (typeof start === 'bigint') {
            const diff = now - (res.locals._hrl_start_time as bigint);
            return Number(diff / BigInt(1e6)).toFixed(3);
        }
    }

    return undefined;
};

export const urlHandler: TokenHandler = (req) => req.originalUrl || req.url;
export const userAgentHandler: TokenHandler = (req) => req.headers['user-agent'];

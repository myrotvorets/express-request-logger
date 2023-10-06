import { hrtime, stdout } from 'node:process';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
    dateHandler,
    httpVersionHandler,
    methodHandler,
    referrerHandler,
    remoteAddrHandler,
    remoteUserHandler,
    reqHandler,
    resHandler,
    statusHandler,
    totalTimeHandler,
    urlHandler,
    userAgentHandler,
} from './handlers.mjs';

type TokenHandler = (req: Request, res: Response, arg: string | undefined) => string | undefined;

const tokens: Record<string, TokenHandler> = {
    date: dateHandler,
    'http-version': httpVersionHandler,
    method: methodHandler,
    referer: referrerHandler,
    referrer: referrerHandler,
    'remote-addr': remoteAddrHandler,
    'remote-user': remoteUserHandler,
    req: reqHandler,
    res: resHandler,
    status: statusHandler,
    'total-time': totalTimeHandler,
    url: urlHandler,
    'user-agent': userAgentHandler,
};

export type BeforeLogHook = (
    err: Error | undefined,
    req: Request,
    res: Response,
    line: string,
    tokens: Record<string, string | undefined>,
) => string;

export interface LoggerOptions {
    format?: string;
    stream?: NodeJS.WritableStream;
    beforeLogHook?: BeforeLogHook;
    mode?: 'normal' | 'immediate' | 'audit';
}

export function setTokenHandler(token: string, handler: TokenHandler | undefined): TokenHandler | undefined {
    const result = tokens[token];
    if (handler) {
        tokens[token] = handler;
    } else {
        delete tokens[token];
    }

    return result;
}

export function requestLogger(options: LoggerOptions = {}): RequestHandler {
    const format =
        options.format ??
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
    const stream = /* c8 ignore next */ options.stream ?? stdout;
    const beforeLogHook: BeforeLogHook = options.beforeLogHook ?? ((_err, _req, _res, line): string => line);
    const mode = options.mode ?? 'normal';

    const tokenRegex = /:([-\w]{2,})(?:\[([^\]]+)\])?/gu;

    return (req: Request, res: Response, next: NextFunction) => {
        res.locals._hrl_start_time = hrtime.bigint();

        const logRequest = (err?: Error): void => {
            res.removeListener('error', logRequest);
            res.removeListener('finish', logRequest);

            const logTokens: Record<string, string | undefined> = {};

            let logLine = format.replace(tokenRegex, (_, token: string, param: string | undefined) => {
                if (token in tokens) {
                    const value = tokens[token](req, res, param);
                    logTokens[token] = value;
                    return value || '-'; // NOSONAR
                }

                const paramStr = param ? `[${param}]` : '';
                return `:${token}${paramStr}`;
            });

            logLine = beforeLogHook(err, req, res, logLine, logTokens);
            if (logLine) {
                stream.write(`${logLine}\n`);
            }
        };

        if (mode === 'immediate' || mode === 'audit') {
            logRequest();
        }

        if (mode === 'audit' || mode === 'normal') {
            res.prependOnceListener('error', logRequest);
            res.prependOnceListener('finish', logRequest);
        }

        next();
    };
}

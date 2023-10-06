import { hrtime, stdout } from 'node:process';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
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

type PrivateLocals = Record<'_hrl_start_time', bigint>;

export type TokenHandler<
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Query,
    Locals extends Record<string, unknown> = Record<string, unknown>,
> = (
    req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
    res: Response<ResBody, Locals>,
    arg: string | undefined,
) => string | undefined;

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

export type BeforeLogHook<
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Query,
    Locals extends Record<string, unknown> = Record<string, unknown>,
> = (
    err: Error | undefined,
    req: Request<P, ResBody, ReqBody, ReqQuery, Locals & PrivateLocals>,
    res: Response<ResBody, Locals & PrivateLocals>,
    line: string,
    tokens: Record<string, string | undefined>,
) => string;

export interface LoggerOptions<
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Query,
    Locals extends Record<string, unknown> = Record<string, unknown>,
> {
    format?: string;
    stream?: NodeJS.WritableStream;
    beforeLogHook?: BeforeLogHook<P, ResBody, ReqBody, ReqQuery, Locals>;
    mode?: 'normal' | 'immediate' | 'audit';
}

export function setTokenHandler<
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Query,
    Locals extends Record<string, unknown> = Record<string, unknown>,
>(token: string, handler: TokenHandler<P, ResBody, ReqBody, ReqQuery, Locals> | undefined): TokenHandler | undefined {
    const result = tokens[token];
    if (handler) {
        tokens[token] = handler as TokenHandler;
    } else {
        delete tokens[token];
    }

    return result;
}

export function requestLogger<
    P = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Query,
    Locals extends Record<string, unknown> = Record<string, unknown>,
>(
    options: LoggerOptions<P, ResBody, ReqBody, ReqQuery, Locals> = {},
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals & PrivateLocals> {
    const format =
        options.format ??
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
    const stream = /* c8 ignore next */ options.stream ?? stdout;
    const beforeLogHook: typeof options.beforeLogHook =
        options.beforeLogHook ?? ((_err, _req, _res, line): string => line);
    const mode = options.mode ?? 'normal';

    const tokenRegex = /:([-\w]{2,})(?:\[([^\]]+)\])?/gu;

    return (
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals & PrivateLocals>,
        res: Response<ResBody, Locals & PrivateLocals>,
        next: NextFunction,
    ) => {
        res.locals._hrl_start_time = hrtime.bigint();

        const logRequest = (err?: Error): void => {
            res.removeListener('error', logRequest);
            res.removeListener('finish', logRequest);

            const logTokens: Record<string, string | undefined> = {};

            let logLine = format.replace(tokenRegex, (_, token: string, param: string | undefined) => {
                const paramStr = param ? `[${param}]` : '';
                if (token in tokens) {
                    const value = tokens[token](req as Request, res as Response, param);
                    const name = `${token}${paramStr}`;
                    logTokens[name] = value;
                    return value || '-'; // NOSONAR
                }

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

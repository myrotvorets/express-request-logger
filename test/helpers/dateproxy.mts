const origDate = global.Date;

const DateMock: ProxyHandler<DateConstructor> = {
    construct: function (target: DateConstructor, args: unknown[]): Date {
        if (args.length === 0) {
            return new target(Date.UTC(2020, 11, 30, 0, 0, 0, 0));
        }

        return new target(...(args as [number]));
    },
};

export function mockDate(): void {
    global.Date = new Proxy(global.Date, DateMock);
}

export function unmockDate(): void {
    global.Date = origDate;
}

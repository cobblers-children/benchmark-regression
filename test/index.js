'use strict';

const assert = require('assert');
const createRegressionBenchmark = require('..');

const benchmarks = createRegressionBenchmark(
    require('prom-client'),
    [
        'prom-client@11.1.2',
        'prom-client@11.1.1'
    ]
);

benchmarks.suite('registry', (suite) => {
    suite.add(
        'getMetricsAsJSON',
        (client, { registry }) => registry.getMetricsAsJSON(),
        { setup }
    );
    suite.add(
        'metrics',
        (client, { registry }) => registry.metrics(),
        { setup }
    );
});

benchmarks.add(
    'histogram#observe',
    (client, { histogram }) => histogram.observe(1, { a: 1, b: 1 }),
    { setup }
);

const selftest = createRegressionBenchmark(
    {}, []
);

selftest.suite('async support', (suite) => {
    suite.add(
        'async setup',
        (client, { completed }) => assert(completed),
        { setup: asyncSetup },
    );

    suite.add(
        'async fn',
        (client, ctx) => {
            assert(ctx.running !== true);
            ctx.running = true;

            return new Promise(resolve => setTimeout(() => {
                ctx.running = false;
                resolve();
            }, 100));
        },
        { setup: asyncSetup },
    );

    suite.add(
        'start callback',
        () => {
            assert.fail('run should have been skipped');
        },
        {
            setup: () => assert.fail('Setup should have been skipped'),
            start: (event) => {
                return (event.target.name !== 'async support ➭ start callback ➭ current');
            }
        },
    );
});

benchmarks.run()
    .then(() => selftest.run())
    .catch(err => {
        console.error(err.stack);
        process.exit(1);
    });

function setup(client) {
    const registry = new client.Registry();

    const histogram = new client.Histogram({
        name: 'histogram',
        help: 'histogram',
        labelNames: ['a', 'b'],
        registers: [registry]
    });

    histogram.observe(1, { a: 1, b: 1 });

    return {registry, histogram};
}

async function asyncSetup() {
    await new Promise(resolve => setTimeout(resolve, 300));

    return { completed: {} };
}

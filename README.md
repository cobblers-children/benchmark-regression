# Benchmark Regression [![NPM version](https://img.shields.io/npm/v/@clevernature/benchmark-regression.svg?style=flat)](https://www.npmjs.com/package/@clevernature/benchmark-api) [![Linux Build Status](https://img.shields.io/travis/nowells/benchmark-regression.svg?style=flat&label=Travis)](https://travis-ci.org/nowells/benchmark-regression)

Generates performance regression tests using [benchmarkjs](https://benchmarkjs.com/).

## Install

```
npm install --save-dev @clevernature/benchmark-regression
```

## Code

```js
const createRegressionBenchmark = require('@clevernature/benchmark-regression');
const currentClient = require('..');

const benchmarks = createRegressionBenchmark(currentClient, ['prom-client@11.1.2']);

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

benchmarks.add(
    'asynchronous',
    async (client, { histogram }) => {
        const result = await lookup();
        return result.name;
    },
    { setup }
);


benchmarks.add(
    'skippable',
    (client, { histogram }) => histogram.observe(1, { a: 1, b: 1 }),
    { 
        setup,
        start: (event) => (event.target.name !== 'prom-client@10.1.3') // function not supported or broken in this version
    }
);



benchmarks.run().catch(err => {
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
```

## Results

![Benchmark Results](https://github.com/nowells/benchmark-regression/raw/master/assets/results.png)

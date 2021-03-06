const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker({
    // namespace: "",
    // nodeID: "",

    logger: true,
    logLevel: "debug",
    logFormatter: "default",

    // transporter: "nats://nats:4222",

    /*
    cacher: {
        type: "Redis",
        options: {
            redis: {
                host: "192.168.2.124",
                db: 1
            }
        }
    },
    */

    serializer: null,

    requestTimeout: 0 * 1000,
    requestRetry: 0,
    maxCallLevel: 0,
    heartbeatInterval: 5,
    heartbeatTimeout: 15,

    disableBalancer: false,

    registry: {
        strategy: "RoundRobin",
        preferLocal: true
    },

    circuitBreaker: {
        enabled: false,
        maxFailures: 3,
        halfOpenTime: 10 * 1000,
        failureOnTimeout: true,
        failureOnReject: true
    },

    validation: true,
    validator: null,
    metrics: false,
    metricsRate: 1,
    statistics: false,
    internalActions: true,

    hotReload: true
});
broker.logger.info("Load services from folder", { folder: __dirname + "/services" });
broker.loadServices(__dirname + "/services");
broker.start();


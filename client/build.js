({
    baseUrl: ".",
    mainConfigFile: 'lib/requireConfig.js',
    dir: "dist",
    optimize: 'uglify2',
    generateSourceMaps: true,
    preserveLicenseComments: false,
    modules: [
        {
            name: 'app/components/start'
        }],
    paths: {
        "model/claim": "../server/model/claim",
        "model/claimEntry": "../server/model/claimEntry",
        "model/bill": "../server/model/bill",
        "model/billingItem": "../server/model/billingItem",
        "model/billingProfile": "../server/model/billingProfile",
        "model/billingStatus": "../server/model/billingStatus",
        "model/contact": "../server/model/contact",
        "model/notification": "../server/model/notification",
        "model/profiles": "../server/model/profiles",
        "model/states": "../server/model/states",
        "model/tags": "../server/model/tags",
        "shared/consts": "../server/shared/consts",
        "shared/dateUtils": "../server/shared/dateUtils",
        "shared/NumberUtils": "../server/shared/NumberUtils",
        "shared/objectUtils": "../server/shared/objectUtils"
    },
    optimizeCss: 'standard'
})
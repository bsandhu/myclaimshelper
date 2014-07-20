require.config({
    baseUrl: '/',
    paths: {
        'jquery'    : 'lib/jquery.min',
        'jquery-ui' : 'lib/jquery-ui.min',
        'knockout'  : 'lib/knockout',
        'KOMap'     : 'lib/knockout.mapping.min',
        'dropzone'  : 'lib/dropzone.amd',
        'knockout-jqueryui': 'lib/knockout.jqueryui.min'
    },
    shim: {
        'jquery-ui': {
            deps: ['jquery']
        },
        'knockout': {
            deps: ['jquery']
        },
        'knockout-jqueryui': {
            deps: ['knockout', 'jquery']
        },
        'KOMap': {
            deps: ['knockout'],
            exports: 'KOMap'
        }
    }
});


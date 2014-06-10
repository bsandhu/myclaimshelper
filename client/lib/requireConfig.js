require.config({
    baseUrl: '/',
    paths: {
        'jquery': 'lib/jquery.min',
        'jquery-ui': 'lib/jquery-ui.min',
        'knockout': 'lib/knockout',
        'knockout-jqueryui': 'lib/knockout.jqueryui.min',
        'KOMap': 'lib/knockout.mapping.min'
    },
    shim: {
        'jquery-ui': {
            deps: ['jquery']
        },
        'knockout': {
            deps: ['jquery']
        },
        'knockout-jqueryui': {
            deps: ['knockout']
        },
        'KOMap': {
            deps: ['knockout'],
            exports: 'KOMap'
        }
    }
});


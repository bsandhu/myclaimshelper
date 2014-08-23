require.config({
    baseUrl: '/',
    paths: {
        'jquery'    : 'lib/jquery.min',
        'knockout'  : 'lib/knockout',
        'KOMap'     : 'lib/knockout.mapping.min',   // Map KO <-> JSON
        'KOAmd'     : 'lib/knockout.amd.helpers',   // Load templates async
        'velocity'  : 'lib/jquery.velocity.min',    // JS animations
        'amplify'   : 'lib/amplify',                // Pub/sub
        'text'      : 'lib/require.text',           // Require plugin for html templates
        'Path'      : 'lib/path'
    },
    shim: {
        'velocity': {
            deps: ['jquery']
        },
        'knockout': {
            deps: ['jquery']
        },
        'KOMap': {
            deps: ['knockout'],
            exports: 'KOMap'
        },
        'KOAmd': {
            deps: ['knockout'],
            exports: 'KOAmd'
        },
        'amplify': {
            deps: ['jquery'],
            exports: 'amplify'
        },
        'Path' : {
            exports: 'Path'
        }
    }
});


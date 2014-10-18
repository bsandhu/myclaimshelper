require.config({
    baseUrl: '/',
    paths: {
        'jquery'    : 'lib/jquery.min',
        'hotkeys'   : 'lib/jquery.hotkeys',
        'knockout'  : 'lib/knockout',
        'KOMap'     : 'lib/knockout.mapping.min',   // Map KO <-> JSON
        'KOAmd'     : 'lib/knockout.amd.helpers',   // Load templates async
        'velocity'  : 'lib/jquery.velocity.min',    // JS animations
        'amplify'   : 'lib/amplify',                // Pub/sub
        'text'      : 'lib/require.text',           // Require plugin for html templates
        'Path'      : 'lib/path',
        'bootstrap' : 'lib/bootstrap',
        'wysiwyg'   : 'lib/bootstrap.wysiwyg',
        'async'     : 'lib/async',
        'datetimepicker' : 'lib/jquery.datetimepicker'
    },
    shim: {
        'velocity': {
            deps: ['jquery']
        },
        'datetimepicker': {
            deps: ['jquery']
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'wysiwyg' : {
            deps: ['jquery', 'bootstrap', 'hotkeys']
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


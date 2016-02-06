require.config({
    baseUrl: '/',
    paths: {
        'jquery': 'lib/jquery.min',
        'jqueryBase64': 'lib/jquery.base64',
        'jqueryui': 'lib/jquery.ui.min',
        'hotkeys': 'lib/jquery.hotkeys',
        'knockout': 'lib/knockout',
        'KOMap': 'lib/knockout.mapping.min',   // Map KO <-> JSON
        'KOAmd': 'lib/knockout.amd.helpers',   // Load templates async
        'velocity': 'lib/jquery.velocity.min', // JS animations
        'amplify': 'lib/amplify',              // Pub/sub
        'text': 'lib/require.text',            // Require plugin for html templates
        'Path': 'lib/path',
        'bootstrap': 'lib/bootstrap.min',
        'bootstrapTable' : 'lib/bootstrap.table',
        'bootbox' : 'lib/bootbox.min',
        'tableExport': 'lib/bootstrap.table.export',
        'kayalshriTableExport' : 'lib/kayalshri.table.export',
        'wysiwyg': 'lib/bootstrap.wysiwyg',
        'async': 'lib/async',
        'datetimepicker': 'lib/jquery.datetimepicker',
        'sortable': 'lib/sortable.min',
        'xeditable': 'lib/x-editable.min',
        'KOXeditable': 'lib/ko.xeditable',
        'socketio': 'lib/socket.io-1.2.0',
        'select2': 'lib/select2.min',
        'circliful': 'lib/jquery.circliful.min'
    },
    shim: {
        'circliful': {
            deps: ['jquery']
        },
        'bootbox': {
            deps: ['jquery', 'bootstrap']
        },
        'jqueryui': {
            deps: ['jquery']
        },
        'velocity': {
            deps: ['jquery']
        },
        'jqueryBase64': {
            deps: ['jquery']
        },
        'datetimepicker': {
            deps: ['jquery', 'jqueryui']
        },
        'kayalshriTableExport': {
            deps: ['jquery', 'jqueryBase64']
        },
        'tableExport': {
            deps: ['jquery', 'bootstrapTable', 'kayalshriTableExport']
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'bootstrapTable': {
            deps: ['jquery', 'bootstrap']
        },
        'sortable': {
            deps: ['jquery']
        },
        'wysiwyg': {
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
        'Path': {
            exports: 'Path'
        },
        'xeditable': {
            deps: ['bootstrap']
        },
        'KOXeditable': {
            deps: ['xeditable']
        },
        'socketio': {
            exports: 'io'
        }
    }
});


require.config({
    baseUrl: '/',
    paths: {
        'jquery'    : 'lib/jquery.min',
        'knockout'  : 'lib/knockout',
        'KOMap'     : 'lib/knockout.mapping.min',
        'dropzone'  : 'lib/dropzone.amd',
        'datatables': 'lib/jquery.dataTables',
        'velocity'  : 'lib/jquery.velocity.min',
        'amplify'   : 'lib/amplify'
    },
    shim: {
        'velocity': {
            deps: ['jquery']
        },
        'knockout': {
            deps: ['jquery']
        },
        'dataTables': {
            deps: ['jquery']
        },
        'KOMap': {
            deps: ['knockout'],
            exports: 'KOMap'
        },
        'amplify': {
            deps: ["jquery"],
            exports: "amplify"
        }
    }
});


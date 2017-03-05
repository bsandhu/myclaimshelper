let webpack = require('webpack');
var path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin')


module.exports = {
    // Webpack path resolution: https://webpack.github.io/docs/resolving.html
    entry: path.join(__dirname, 'app', 'components', 'start.js'),
    output: {
        path: path.join(path.resolve('.'), 'app', 'components'),
        filename: "client.[chunkhash].js"
    },
    plugins: [
        new webpack.ProvidePlugin({
            "$": "jquery",
            "jQuery": "jquery",
            "window.jQuery": "jquery",
            "window.amplify": "amplify"
        }),
        new HtmlWebpackPlugin({
            template: path.join('app', 'components', 'index.ejs'),
            inject: 'body'
        })
    ],
    resolve: {
        root: [
            path.resolve('.'), ,
            path.join(path.resolve('..'),
                'server')],
        // This is the default setting too, repeated for clarity
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.json'],
        alias: {
            'jquery': 'lib\\jquery-2.1.1.js',
            'jqueryBase64': 'lib\\jquery.base64.js',
            'jqueryui': 'lib\\jquery.ui.min.js',
            'hotkeys': 'lib\\jquery.hotkeys.js',
            'knockout': 'lib\\knockout.js',
            'KOMap': 'lib\\knockout.mapping.min.js',
            'KOAmd': 'lib\\knockout.amd.helpers.js',
            'velocity': 'lib\\jquery.velocity.min.js',
            'amplify': 'lib\\amplify.js',
            'Path': 'lib\\path.js',
            'bootstrap': 'lib\\bootstrap.min.js',
            'bootstrapTable': 'lib\\bootstrap.table.js',
            'bootstrapTableCustom': 'lib\\bootstrap.table.customization.js',
            'bootbox': 'lib\\bootbox.min.js',
            'tableExport': 'lib\\bootstrap.table.export.js',
            'kayalshriTableExport': 'lib\\kayalshri.table.export.js',
            'wysiwyg': 'lib\\bootstrap.wysiwyg.js',
            'datetimepicker': 'lib\\jquery.datetimepicker.js',
            'sortable': 'lib\\sortable.min.js',
            'xeditable': 'lib\\x-editable.min.js',
            'KOXeditable': 'lib\\ko.xeditable.js',
            'select2': 'lib\\select2.min.js',
            'circliful': 'lib\\jquery.circliful.min.js',
            'underscore': 'lib\\underscore.min.js',
            'maskedInput': 'lib\\jquery.mask.js',
            'loggly': 'lib\\loggly.tracker-2.1.min.js',
            'hopscotch': 'lib\\hopscotch.js'
        }
    },
    devtool: 'eval',
    resolveLoader: {
        // The loaders here are resolved relative to the resource which they are applied to.
        // This means they are not resolved relative the the configuration file. If you have loaders
        // installed from npm and your node_modules folder is not in a parent folder of all source files,
        // webpack cannot find the loader. You need to add the node_modules folder as absolute path
        // to the resolveLoader.root option.
        // - Webpack docs
        root: path.join(__dirname, "node_modules")
    },
    module: {
        loaders: [
            {test: /loggly/, loader: 'exports?_LTracker'},
            {test: /hopscotch/, loader: 'imports?jquery'},
            {test: /circliful/, loader: 'imports?jquery'},
            {test: /bootbox/, loader: 'imports?jquery,bootstrap'},
            {test: /jqueryui/, loader: 'imports?jquery'},
            {test: /velocity/, loader: 'imports?jquery'},
            {test: /maskedInput/, loader: 'imports?jquery'},
            {test: /jqueryBase64/, loader: 'imports?jquery'},
            {test: /datetimepicker/, loader: 'imports?jquery,jqueryui'},
            {test: /kayalshriTableExport/, loader: 'imports?jquery,jqueryBase64'},
            {test: /tableExport/, loader: 'imports?jquery,bootstrapTableCustom,bootstrapTable,kayalshriTableExport'},
            {test: /bootstrap/, loader: 'imports?jquery'},
            {test: /bootstrapTable/, loader: 'imports?jquery,bootstrap,bootstrapTableCustom'},
            {test: /sortable/, loader: 'imports?jquery'},
            {test: /wysiwyg/, loader: 'imports?jquery,bootstrap,hotkeys'},
            {test: /knockout/, loader: 'imports?jquery'},
            {test: /KOMap/, loader: 'imports?knockout!exports=KOMap'},
            {test: /KOAmd/, loader: 'imports?knockout!exports=KOAmd'},
            {test: /amplify/, loader: 'imports?jquery!exports?amplify'},
            {test: /path/, loader: 'exports?Path'},
            {test: /x-editable/, loader: 'imports?bootstrap,jquery'},
            {test: /ko.xeditable/, loader: 'imports?xeditable'},
            {
                test: /\.js$/,
                exclude: /(node_modules|lib)/,
                loader: 'babel-loader'
            }
        ]
    }
}
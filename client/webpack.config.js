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
        // This is the default setting too, repeated for clarity
        modules: [path.resolve('.'), 'node_modules'],
        extensions: ['.js', '.json'],
        alias: {
            'jquery': path.resolve(__dirname, 'lib/jquery-2.1.1.js'),
            'jqueryBase64': path.resolve(__dirname, 'lib/jquery.base64.js'),
            'jqueryui': path.resolve(__dirname, 'lib/jquery.ui.min.js'),
            'hotkeys': path.resolve(__dirname, 'lib/jquery.hotkeys.js'),
            'knockout': path.resolve(__dirname, 'lib/knockout.js'),
            'KOMap': path.resolve(__dirname, 'lib/knockout.mapping.min.js'),
            'KOAmd': path.resolve(__dirname, 'lib/knockout.amd.helpers.js'),
            'velocity': path.resolve(__dirname, 'lib/jquery.velocity.min.js'),
            'amplify': path.resolve(__dirname, 'lib/amplify.js'),
            'Path': path.resolve(__dirname, 'lib/path.js'),
            'bootstrap': path.resolve(__dirname, 'lib/bootstrap.min.js'),
            'bootstrapTable': path.resolve(__dirname, 'lib/bootstrap.table.js'),
            'bootstrapTableCustom': path.resolve(__dirname, 'lib/bootstrap.table.customization.js'),
            'bootbox': path.resolve(__dirname, 'lib/bootbox.min.js'),
            'tableExport': path.resolve(__dirname, 'lib/bootstrap.table.export.js'),
            'kayalshriTableExport': path.resolve(__dirname, 'lib/kayalshri.table.export.js'),
            'wysiwyg': path.resolve(__dirname, 'lib/bootstrap.wysiwyg.js'),
            'datetimepicker': path.resolve(__dirname, 'lib/jquery.datetimepicker.js'),
            'sortable': path.resolve(__dirname, 'lib/sortable.min.js'),
            'xeditable': path.resolve(__dirname, 'lib/x-editable.min.js'),
            'KOXeditable': path.resolve(__dirname, 'lib/ko.xeditable.js'),
            'select2': path.resolve(__dirname, 'lib/select2.min.js'),
            'circliful': path.resolve(__dirname, 'lib/jquery.circliful.min.js'),
            'underscore': path.resolve(__dirname, 'lib/underscore.min.js'),
            'maskedInput': path.resolve(__dirname, 'lib/jquery.mask.js'),
            'loggly': path.resolve(__dirname, 'lib/loggly.tracker-2.1.min.js'),
            'hopscotch': path.resolve(__dirname, 'lib/hopscotch.js')
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
        modules: [path.join(__dirname, "node_modules")]
    },
    module: {
        rules: [
            {test: /loggly/, loader: 'exports-loader?_LTracker'},
            {test: /hopscotch/, loader: 'imports-loader?jquery'},
            {test: /circliful/, loader: 'imports-loader?jquery'},
            {test: /bootbox/, loader: 'imports-loader?jquery,bootstrap'},
            {test: /jqueryui/, loader: 'imports-loader?jquery'},
            {test: /velocity/, loader: 'imports-loader?jquery'},
            {test: /maskedInput/, loader: 'imports-loader?jquery'},
            {test: /jqueryBase64/, loader: 'imports-loader?jquery'},
            {test: /datetimepicker/, loader: 'imports-loader?jquery,jqueryui'},
            {test: /kayalshriTableExport/, loader: 'imports-loader?jquery,jqueryBase64'},
            {test: /tableExport/, loader: 'imports-loader?jquery,bootstrapTableCustom,bootstrapTable,kayalshriTableExport'},
            {test: /bootstrap/, loader: 'imports-loader?jquery'},
            {test: /bootstrapTable/, loader: 'imports-loader?jquery,bootstrap,bootstrapTableCustom'},
            {test: /sortable/, loader: 'imports-loader?jquery'},
            {test: /wysiwyg/, loader: 'imports-loader?jquery,bootstrap,hotkeys'},
            {test: /knockout/, loader: 'imports-loader?jquery'},
            {test: /KOMap/, loader: 'imports-loader?knockout!exports=KOMap'},
            {test: /KOAmd/, loader: 'imports-loader?knockout!exports=KOAmd'},
            {test: /amplify/, loader: 'imports-loader?jquery!exports-loader?amplify'},
            {test: /path/, loader: 'exports-loader?Path'},
            {test: /x-editable/, loader: 'imports-loader?bootstrap,jquery'},
            {test: /ko.xeditable/, loader: 'imports-loader?xeditable'}
        ]
    }
}
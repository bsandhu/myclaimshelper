/*
 * bootstrap-table - v1.8.1 - 2015-05-29
 * https://github.com/wenzhixin/bootstrap-table
 * Copyright (c) 2015 zhixin wen
 * Licensed MIT License
 */
!function (a) {
    "use strict";
    var b = {json: "JSON", xml: "XML", png: "PNG", csv: "CSV", txt: "TXT", sql: "SQL", doc: "MS-Word", excel: "Ms-Excel", powerpoint: "Ms-Powerpoint", pdf: "PDF"};
    a.extend(a.fn.bootstrapTable.defaults, {showExport: !1, exportTypes: ["json", "xml", "csv", "txt", "sql", "excel"], exportOptions: {}});
    var c = a.fn.bootstrapTable.Constructor, d = c.prototype.initToolbar;
    c.prototype.initToolbar = function () {
        if (this.showToolbar = this.options.showExport, d.apply(this, Array.prototype.slice.apply(arguments)), this.options.showExport) {
            var c = this, e = this.$toolbar.find(">.btn-group"), f = e.find("div.export");
            if (!f.length) {
                f = a(['<div class="export btn-group">',
                    '<button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">',
                        'Export  ',
                        '<span class="caret"></span>',
                    "</button>",
                    '<ul class="dropdown-menu" role="menu">',
                    "</ul>",
                    "</div>"].join("")).appendTo(e);
                var g = f.find(".dropdown-menu"), h = this.options.exportTypes;
                if ("string" == typeof this.options.exportTypes) {
                    var i = this.options.exportTypes.slice(1, -1).replace(/ /g, "").split(",");
                    h = [], a.each(i, function (a, b) {
                        h.push(b.slice(1, -1))
                    })
                }
                a.each(h, function (a, c) {
                    b.hasOwnProperty(c) && g.append(['<li data-type="' + c + '">', '<a href="javascript:void(0)">', b[c], "</a>", "</li>"].join(""))
                }), g.find("li").click(function () {
                    c.$el.tableExport(a.extend({}, c.options.exportOptions, {type: a(this).data("type"), escape: !1}))
                })
            }
        }
    }
}(jQuery);
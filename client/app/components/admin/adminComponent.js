define(['jquery', 'knockout', 'app/utils/events', 'app/utils/ajaxUtils',
        'socketio',
        'text!app/components/admin/admin.tmpl.html'],

    function ($, ko, Events, ajaxUtils, io, viewHtml) {
        'use strict';

        function AdminVM(params) {
            console.log('Init AdminVM');
            this.msgs = ko.observableArray([]);
            this.unreadMsgCount = ko.observable(0);

            amplify.subscribe(Events.SHOW_MSGS, this, this.onShowMsgs);

            var host = "http://"+window.location.hostname;
            var socket = io(host);
            socket.on('broadcast', function (msg) {
                console.log('WS broadcast: ' + JSON.stringify(msg));
                if (msg.name == 'UnreadMsgCount') {

                }
                if (msg.name == 'NewMsg') {
                    this.msgs.push(msg);
                }
            }.bind(this));
        }

        AdminVM.prototype.onServerBroadcast = function () {
            ajaxUtils.post(
                '/notification/broadcast',
                JSON.stringify({msg: 'Hello from Mars'}),
                function onSuccess(response) {
                    console.log('Requested server broadcast');
                });
        }

        AdminVM.prototype.onShowMsgs = function () {
            $('#msgs-modal').modal('show');
            $.getJSON('notification/unreadMsgs')
                .done(function (resp) {
                    console.log('Loaded unread msgs: ' + JSON.stringify(resp));
                    this.msgs(resp.data);
                }.bind(this));
        }

        return {viewModel: AdminVM, template: viewHtml};
    });

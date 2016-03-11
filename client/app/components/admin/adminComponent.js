define(['jquery', 'knockout', 'amplify',
        'app/utils/events', 'app/utils/ajaxUtils',
        'socketio',
        'text!app/components/admin/admin.tmpl.html'],

    function ($, ko, amplify, Events, ajaxUtils, io, viewHtml) {
        'use strict';

        function AdminVM(params) {
            console.log('Init AdminVM');
            this.msgs = ko.observableArray([]);

            amplify.subscribe(Events.SHOW_MSGS, this, this.onShowMsgs);

            var host = "http://"+window.location.hostname;
            var socket = io(host);
            socket.on('broadcast', function (msg) {
                console.log('WS broadcast: ' + JSON.stringify(msg));
                if (msg.name == 'UnreadMsgCount') {
                    document.getElementById("msgAlertAudio").play();
                    amplify.publish(Events.UPDATE_UNREAD_MSGS_COUNT, msg.body);
                }
                if (msg.name == 'NewMsg') {
                    this.msgs.push(msg);
                }
            }.bind(this));

            this.getUnreadMsgCount();
        }

        AdminVM.prototype.closeModal = function () {
            $('#msgs-modal').modal('hide');
        }

        AdminVM.prototype.onMarkAllAsRead = function () {
            var _this = this;
            var unreadCount = this.msgs().length;
            ajaxUtils.post(
                '/notification/markAllAsRead',
                JSON.stringify({ids: []}),
                function onSuccess(response) {
                    console.log('Marked as read');
                    amplify.publish(Events.SHOW_MSGS);
                    _this.getUnreadMsgCount();
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Marked ' + unreadCount + ' msgs as read'});
                    _this.closeModal();
                });
        }

        AdminVM.prototype.getUnreadMsgCount = function () {
            $.getJSON('notification/unreadMsgCount')
                .done(function (resp) {
                    console.log('Unread msg count: ' + resp);
                    amplify.publish(Events.UPDATE_UNREAD_MSGS_COUNT, resp.data);
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

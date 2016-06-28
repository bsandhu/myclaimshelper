define(['jquery', 'knockout', 'amplify',
        'app/utils/events', 'app/utils/ajaxUtils',
        'socketio',
        'app/utils/session',
        'shared/consts',
        'text!app/components/admin/admin.tmpl.html'],

    function ($, ko, amplify, Events, ajaxUtils, io, Session, ServerConsts, viewHtml) {
        'use strict';

        var socket;

        function AdminVM(params) {
            console.log('Init AdminVM');
            this.msgs = ko.observableArray([]);
            this.ServerConsts = ServerConsts;

            amplify.subscribe(Events.SHOW_MSGS, this, this.onShowMsgs);

            var host = window.location.protocol + "//" + window.location.hostname;
            socket = io.connect(host);

            socket.on('connect', function() {
                console.log('WS connected');
            });

            socket.on(Session.getCurrentUserId(), function (msg) {
                console.log('WS broadcast: ' + JSON.stringify(msg));
                if (msg.name == 'UnreadMsgCount') {
                    document.getElementById("msgAlertAudio").play();
                    amplify.publish(Events.UPDATE_UNREAD_MSGS_COUNT, msg.body);
                }
                if (msg.name == 'NewMsg') {
                    this.msgs.push(msg);
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {});
                }
            }.bind(this));

            socket.emit('joinRoom', Session.getCurrentUserId());

            this.getUnreadMsgCount();
        }

        AdminVM.prototype.closeModal = function () {
            $('#msgs-modal').modal('hide');
            return true;
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
                JSON.stringify({msg: 'Email processed. mailEntry.mail.subject <a href="#/claimEntry/">Goto task</a>'}),
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

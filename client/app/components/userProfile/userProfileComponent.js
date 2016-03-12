define(['jquery', 'knockout', 'KOMap', 'amplify', 'Auth0Lock', 'app/utils/events', 'app/utils/session',
        'text!app/components/userProfile/userProfile.tmpl.html', 'model/profiles'],

    function ($, ko, KOMap, amplify, Auth0Lock, Events, Session, viewHtml, UserProfile) {
        'use strict';

        function UserProfileComponent(params) {
            console.log('Init UserProfile');
            this.userProfile = KOMap.fromJS(new UserProfile());
            this.setupEvListeners();

            this.login();
        }

        UserProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_USER_PROFILE, this, this.onShowUserProfile);
            amplify.subscribe(Events.SHOW_LOGIN, this, this.login);
        };

        UserProfileComponent.prototype.onShowUserProfile = function (evData) {
            console.log('UserProfileComponent - SHOW_USER_PROFILE ev ' + JSON.stringify(evData));
            $('#userProfileModal').modal();
        };

        UserProfileComponent.prototype.getCurrentUserId = function () {
            return amplify.store.sessionStorage(SessionKeys.USER_ID);
        };

        UserProfileComponent.prototype.login = function () {
            // Load and set in SessionStorage
            this.checkAndSetUserAuthProfile(this.loadUserProfile.bind(this));
        }

        /**
         * Note: Server will create a copy of default profile for new users
         */
        UserProfileComponent.prototype.loadUserProfile = function () {
            var userProfileId = Session.getCurrentUserId();
            var _this = this;

            return $.getJSON('/userProfile/' + userProfileId)
                .done(function (resp) {
                    console.debug('Loaded UserProfile ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.userProfile);
                    Session.setCurrentUserProfile(resp.data);
                    amplify.publish(Events.LOGIN);
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load UserProfile ' + JSON.stringify(resp));
                    if (resp.status = 401 && resp.statusText === 'TokenExpiredError') {
                        console.log('Token expired - resetting');
                        _this.login();
                        _this.onLogoff();
                    }
                });
        };

        UserProfileComponent.prototype.checkAndSetUserAuthProfile = function (onDone) {
            if (!Session.getCurrentUserAuthProfile()) {
                // Delegate to Auth0 service

                $.getJSON('/config')
                    .then(function (resp) {
                        return resp.data.Auth0;
                    })
                    .then(function (auth0Config) {
                        var lock = new Auth0Lock(auth0Config.id, auth0Config.domain);
                        lock.show(function (err, profile, token) {
                            if (err) {
                                alert('There was an error logging you in');
                                Session.setCurrentUserAuthProfile(null);
                                Session.setCurrentUserAuthToken(null);
                                Session.setCurrentUserId(null);
                                Session.setCurrentUserProfile(null);
                            } else {
                                Session.setCurrentUserAuthProfile(profile);
                                Session.setCurrentUserAuthToken(token);
                                Session.setCurrentUserId(profile.nickname);
                                onDone();
                            }
                        })
                    })
                    .fail(function (resp) {
                        console.error('Failed to load Config' + JSON.stringify(resp));
                    });
            } else {
                onDone();
            }
        };

        UserProfileComponent.prototype.onLogoff = function () {
            console.log('Logoff');
            Session.setCurrentUserAuthProfile(null);
            Session.setCurrentUserAuthToken(null);
            Session.setCurrentUserId(null);
            Session.setCurrentUserProfile(null);
            amplify.publish(Events.LOGOFF);
        };

        return {viewModel: UserProfileComponent, template: viewHtml};
    })
;

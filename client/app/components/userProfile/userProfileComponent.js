define(['jquery', 'knockout', 'KOMap', 'amplify', 'Auth0Lock', 'app/utils/events', 'app/utils/session',
        'text!app/components/userProfile/userProfile.tmpl.html', 'model/profiles'],

    function ($, ko, KOMap, amplify, Auth0Lock, Events, Session, viewHtml, UserProfile) {
        'use strict';

        function UserProfileComponent(params) {
            console.log('Init UserProfile');
            this.userProfile = KOMap.fromJS(new UserProfile());
            this.setupEvListeners();

            // Load and set in SessionStorage
            this.loadUserProfile(Session.getCurrentUserId());
            this.checkAndSetUserAuthProfile();
        }

        UserProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_USER_PROFILE, this, this.onShowUserProfile);
        };

        UserProfileComponent.prototype.onShowUserProfile = function (evData) {
            console.log('UserProfileComponent - SHOW_USER_PROFILE ev ' + JSON.stringify(evData));
            $('#userProfileModal').modal();
        };

        UserProfileComponent.prototype.getCurrentUserId = function () {
            return amplify.store.sessionStorage(SessionKeys.USER_ID);
        };

        UserProfileComponent.prototype.loadUserProfile = function (userProfileId) {
            return $.getJSON('/userProfile/' + userProfileId)
                .done(function (resp) {
                    console.debug('Loaded UserProfile ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.userProfile);
                    Session.setCurrentUserProfile(resp.data);
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load UserProfile ' + JSON.stringify(resp));
                });
        };

        UserProfileComponent.prototype.checkAndSetUserAuthProfile = function () {
            if (!Session.getCurrentUserAuthProfile()) {
                // Delegate to Auth0 service
                var lock = new Auth0Lock('KD77kbmhe7n3rtQq0ZYHTlkH2ooBu2Rq', 'myclaimshelper.auth0.com');

                lock.show(function (err, profile, token) {
                    if (err) {
                        alert('There was an error logging you in');
                        Session.setCurrentUserAuthProfile(null);
                        Session.setCurrentUserAuthToken(null);
                        Session.setCurrentUserId(null);
                    } else {
                        Session.setCurrentUserAuthProfile(profile);
                        Session.setCurrentUserAuthToken(token);
                        Session.setCurrentUserId(profile.nickname);
                    }
                });
            }
        };

        UserProfileComponent.prototype.onLogoff = function () {
            console.log('Logoff');
            Session.setCurrentUserAuthProfile(null);
            Session.setCurrentUserAuthToken(null);
            Session.setCurrentUserId(null);
            Session.setCurrentUserProfile(null);
        };

        return {viewModel: UserProfileComponent, template: viewHtml};
    });

define(['jquery', 'knockout', 'KOMap', 'amplify', 'app/utils/events', 'app/utils/session',
        'text!app/components/userProfile/userProfile.tmpl.html', 'model/profiles'],

    function ($, ko, KOMap, amplify, Events, Session, viewHtml, UserProfile) {
        'use strict';

        function UserProfileComponent(params) {
            console.log('Init UserProfile');
            this.userProfile = KOMap.fromJS(new UserProfile());
            this.setupEvListeners();

            // Load and set in SessionStorage
            this.loadUserProfile(Session.getCurrentUserId());
        }

        UserProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_USER_PROFILE, this, this.onShowUserProfile);
        };

        UserProfileComponent.prototype.onShowUserProfile = function (evData) {
            console.log('UserProfileComponent - SHOW_USER_PROFILE ev ' + JSON.stringify(evData));
            $('#userProfileModal').modal();
        };

        UserProfileComponent.prototype.getCurrentUserId = function(){
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_USER_ID);
        };

        UserProfileComponent.prototype.loadUserProfile = function(userProfileId){
            return $.getJSON('/userProfile/' + userProfileId)
                .done(function (resp) {
                    console.debug('Loaded UserProfile ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.userProfile);
                    Session.setCurrentUserProfile(resp.data);
                }.bind(this))
                .fail(function(resp){
                    console.error('Failed to load UserProfile ' + JSON.stringify(resp));
                });
        };

        return {viewModel: UserProfileComponent, template: viewHtml};
    });

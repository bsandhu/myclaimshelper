define(['jquery', 'knockout', 'KOMap', 'amplify', 'app/utils/events',
        'text!app/components/userProfile/userProfile.tmpl.html', 'model/Profiles'],

    function ($, ko, KOMap, amplify, Events, viewHtml, UserProfile) {
        'use strict';

        function UserProfileComponent(params) {
            console.log('Init UserProfile');
            this.userProfile = KOMap.fromJS(new UserProfile());
            this.setupEvListeners();
        }

        UserProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_USER_PROFILE, this, this.onShowUserProfile);
        };

        UserProfileComponent.prototype.onShowUserProfile = function (evData) {
            console.log('UserProfileComponent - SHOW_USER_PROFILE ev ' + JSON.stringify(evData));
            this.loadUserProfile(this.getCurrentUserId());
        };

        // TODO User Auth
        UserProfileComponent.prototype.getCurrentUserId = function(){
            return "TestUser";
        };

        UserProfileComponent.prototype.loadUserProfile = function(userProfileId){
            $.getJSON('/userProfile/' + userProfileId)
                .done(function (resp) {
                    console.log('Loaded UserProfile ' + JSON.stringify(resp.data));

                    // Populate with JSON data
                    KOMap.fromJS(resp.data, {}, this.userProfile);
                    $('#userProfileModal').modal();
                }.bind(this))
                .fail(function(resp){
                    console.error('Failed to load UserProfile ' + JSON.stringify(resp));
                });
        };

        return {viewModel: UserProfileComponent, template: viewHtml};
    });

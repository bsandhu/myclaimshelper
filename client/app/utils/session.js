define(['amplify', 'app/utils/sessionKeys'], function (amplify, SessionKeys) {

    return {
        setCurrentUserId: function (userId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_USER_ID, userId);
        },
        getCurrentUserId: function () {
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_USER_ID);
        },
        setCurrentUserProfile: function (profile) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_USER_PROFILE, profile);
        },
        getCurrentUserProfile: function () {
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_USER_PROFILE);
        }
    };
})

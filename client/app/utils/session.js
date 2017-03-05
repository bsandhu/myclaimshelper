define(['amplify', 'app/utils/sessionKeys'], function (amplify, SessionKeys) {

    return {

        /************ Contacts ************/

        clearContacts: function () {
            amplify.store.sessionStorage(SessionKeys.ALL_CONTACTS, null);
        },
        setContacts: function (contacts) {
            amplify.store.sessionStorage(SessionKeys.ALL_CONTACTS, contacts);
        },
        getContacts: function () {
            return amplify.store.sessionStorage(SessionKeys.ALL_CONTACTS) || [];
        },


        /************ User ************/

        setCurrentUserId: function (userId) {
            amplify.store.sessionStorage(SessionKeys.USER_ID, userId);
        },
        getCurrentUserId: function () {
            return amplify.store.sessionStorage(SessionKeys.USER_ID);
        },

        // Profile
        setCurrentUserProfile: function (profile) {
            amplify.store.sessionStorage(SessionKeys.USER_PROFILE, profile);
        },
        getCurrentUserProfile: function () {
            var profile = amplify.store.sessionStorage(SessionKeys.USER_PROFILE);
            if (profile)
            return profile;
        },

        // Auth profile
        setCurrentUserAuthProfile: function (profile) {
            amplify.store.sessionStorage(SessionKeys.USER_AUTH_PROFILE, profile);
        },
        getCurrentUserAuthProfile: function () {
            return amplify.store.sessionStorage(SessionKeys.USER_AUTH_PROFILE);
        },

        // Auth token
        setCurrentUserAuthToken: function (token) {
            amplify.store.sessionStorage(SessionKeys.USER_AUTH_TOKEN, token);
        },
        getCurrentUserAuthToken: function () {
            return amplify.store.sessionStorage(SessionKeys.USER_AUTH_TOKEN);
        },


        /************ Claim ************/

        getActiveClaimId: function () {
            var activeClaimId = amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID);
            console.assert(activeClaimId, 'No claim active in session');
            return activeClaimId;
        },

        getActiveClaim: function () {
            var activeClaim = amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_OBJ);
            console.assert(activeClaim, 'No claim active in session');
            return activeClaim;
        }
    };
});

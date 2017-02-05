define(['jquery', 'knockout', 'KOMap', 'amplify', 'bootbox',
        'app/utils/events', 'app/utils/session', 'app/utils/responsive',
        'text!app/components/userProfile/userProfile.tmpl.html', 'model/profiles',
        'app/utils/audit', 'app/utils/consts', 'app/utils/ajaxUtils'],

    function ($, ko, KOMap, amplify, bootbox, Events, Session, Responsive, viewHtml, UserProfile,
              Audit, Consts, AjaxUtils) {
        'use strict';

        function UserProfileComponent(params) {
            console.log('Init UserProfile');
            this.readyToRender = ko.observable(false);
            this.userProfile = KOMap.fromJS(new UserProfile());

            this.editingUserProfile = ko.observable(false);
            this.editingBillingProfile = ko.observable(false);

            this.billCodesTypesUnderEdit = ko.observableArray([]);
            this.billCodesUnderDelete = ko.observableArray([]);
            this.billCodeTypesDisplayed = ko.observableArray([]);
            this.codesInUse = [];
            this.setupEvListeners();

            this.newCode = ko.observable();
            this.newCodeDesc = ko.observable();
            this.isAddingNew = ko.observable(false);

            // *** Trigger login ****
            this.login();
        }

        UserProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_USER_PROFILE, this, this.onShowUserProfile);
            amplify.subscribe(Events.SHOW_LOGIN, this, this.login);
        };

        UserProfileComponent.prototype.onEditUserProfile = function (evData) {
            this.editingUserProfile(true);
            $('#userProfileStaticView').hide();
            $('#userProfileEditView').fadeToggle();
        }

        UserProfileComponent.prototype.onEditBillingProfile = function (evData) {
            this.editingBillingProfile(true);
            $('#billingProfileStaticView').hide();
            $('#billingProfileEditView').fadeToggle();
        }

        UserProfileComponent.prototype.onEditBillingCode = function (vm, codeType, ev) {
            vm.billCodesTypesUnderEdit.push(codeType);
        }

        UserProfileComponent.prototype.onAddNewCode = function (vm, codeType, ev) {
            var codes = vm.userProfile.billingProfile.codes;
            vm.isAddingNew(true);
        }

        UserProfileComponent.prototype.onShowBillingCodes = function (evData) {
            var userProfileModal = $('#userProfileModal');
            userProfileModal.modal('hide');
            this.loadCodes();
            setTimeout(function () {
                $('#billingCodesModal').modal();
            }, 300);
        }

        UserProfileComponent.prototype.onShowUserProfile = function (evData) {
            console.log('UserProfileComponent - SHOW_USER_PROFILE ev ' + JSON.stringify(evData));
            this.readyToRender(true);
            $('#userProfileModal').modal();
        };

        UserProfileComponent.prototype.onUserProfileClose = function (evData) {
            var userProfileModal = $('#userProfileModal');
            userProfileModal.modal('hide');
        };

        /**************************************************/
        /**** Billing codes ****/
        /**************************************************/

        UserProfileComponent.prototype.onToggleClick = function (vm, codeType) {
            console.log('Toggle ' + codeType);
            var isVisible = vm.billCodeTypesDisplayed().indexOf(codeType) >= 0;

            if (isVisible) {
                vm.billCodeTypesDisplayed([]);
            } else {
                vm.billCodeTypesDisplayed([codeType]);
                var elemId = '#' + codeType + 'Section';
                $(elemId).slideDown(300);
            }
            vm.stopEditingCodes();
        }

        UserProfileComponent.prototype.stopEditingCodes = function () {
            this.billCodesTypesUnderEdit([]);
            this.isAddingNew(null);
            this.newCode(null);
            this.newCodeDesc(null);
        }

        UserProfileComponent.prototype.isEditing = function (codeType) {
            return this.billCodesTypesUnderEdit().indexOf(codeType) >= 0;
        }

        /**** Deleting codes ****/

        UserProfileComponent.prototype.isDeleting = function (codeKey) {
            return this.billCodesUnderDelete().indexOf(codeKey) >= 0;
        }

        UserProfileComponent.prototype.onDeleteCode = function (codeKey) {
            this.billCodesUnderDelete.push(codeKey);
        }

        UserProfileComponent.prototype.isCodeInUse = function (codeKey) {
            return this.codesInUse.indexOf(codeKey) >= 0;
        }

        UserProfileComponent.prototype.loadCodes = function (codeKey) {
            var _this = this;
            $.getJSON('/billing/codes')
                .done(function (resp) {
                    console.info('Loaded billing codes');
                    _this.codesInUse = resp.data.codes;
                });
        }

        UserProfileComponent.prototype.onDeleteCodeConfirm = function (codeType, codeKey) {
            var codes = this.userProfile.billingProfile.codes[codeType];
            delete codes[codeKey];
            $('#' + codeKey + 'Code').hide();
        }

        UserProfileComponent.prototype.onDeleteCodeReject = function (codeKey) {
            // Remove from deletion tracker
            var array = this.billCodesUnderDelete();
            var i = array.indexOf(codeKey);
            if (i != -1) {
                array.splice(i, 1);
            }
            this.billCodesUnderDelete(array);
        }

        /**************************************************/
        /**** End - Billing codes ****/
        /**************************************************/


        UserProfileComponent.prototype.getCurrentUserId = function () {
            return amplify.store.sessionStorage(SessionKeys.USER_ID);
        };

        UserProfileComponent.prototype.login = function () {
            // Load and set in SessionStorage
            var onDoneFn = this.loadUserProfile.bind(this);
            this.checkAndSetUserAuthProfile(onDoneFn);
        }

        UserProfileComponent.prototype.onSaveBillingProfile = function () {
            let _this = this;
            this.editingBillingProfile(false);
            $('#billingProfileStaticView').fadeToggle();
            $('#billingProfileEditView').hide();

            let attrs = {};
            attrs = {
                'billingProfile.timeRate': Number(this.userProfile.billingProfile.timeRate()),
                'billingProfile.distanceRate': Number(this.userProfile.billingProfile.distanceRate()),
                'billingProfile.taxRate': Number(this.userProfile.billingProfile.taxRate())
            };

            AjaxUtils.post(
                '/userProfile/modify',
                JSON.stringify({id: Session.getCurrentUserId(), attrsAsJson: attrs}),
                function onSuccess(response) {
                    console.log("Saved billing profile");
                    refreshUserProfile.call(_this);
                },
                function onError(response) {
                    console.error("Failed to update profile");
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while saving Profile'});
                });
        }

        UserProfileComponent.prototype.onSaveUserProfile = function () {
            let _this = this;
            this.editingUserProfile(false);
            $('#userProfileStaticView').fadeToggle();
            $('#userProfileEditView').hide();

            var attrs = {};
            attrs = {
                'contactInfo.businessName': this.userProfile.contactInfo.businessName(),
                'contactInfo.streetAddress': this.userProfile.contactInfo.streetAddress(),
                'contactInfo.city': this.userProfile.contactInfo.city(),
                'contactInfo.zip': this.userProfile.contactInfo.zip(),
                'contactInfo.phone': this.userProfile.contactInfo.phone()
            };

            AjaxUtils.post(
                '/userProfile/modify',
                JSON.stringify({id: Session.getCurrentUserId(), attrsAsJson: attrs}),
                function onSuccess(response) {
                    console.log("Saved profile");
                    refreshUserProfile.call(_this);
                },
                function onError(response) {
                    console.error("Failed to update profile");
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while saving Profile'});
                });
        }

        UserProfileComponent.prototype.onSaveBillingCode = function (vm, codeType, ev) {
            vm.isAddingNew(false);

            // Manually add the new code
            let codesInType = vm.userProfile.billingProfile.codes[codeType];
            if (vm.newCode() != null) {
                codesInType[vm.newCode()] = vm.newCodeDesc();
            }
            let updates = KOMap.toJS(vm.userProfile.billingProfile.codes[codeType]);
            let codeTypeAttr = 'billingProfile.codes.' + codeType;
            console.log('Updated codes: ' + updates);

            let attrs = {};
            attrs[codeTypeAttr] = updates;
            AjaxUtils.post(
                '/userProfile/modify',
                JSON.stringify({id: Session.getCurrentUserId(), attrsAsJson: attrs}),
                function onSuccess(response) {
                    console.log("Saved billing code");
                    refreshUserProfile.call(vm);
                    vm.stopEditingCodes();

                    // Force re-render
                    var tmp = vm.billCodeTypesDisplayed();
                    vm.billCodeTypesDisplayed([]);
                    vm.billCodeTypesDisplayed(tmp);
                },
                function onError(response) {
                    console.error("Failed to update " + codeType);
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while saving ' + codeType});
                });
        }

        function refreshUserProfile() {
            let _this = this;
            $.getJSON('/userProfile/' + Session.getCurrentUserId())
                .done(function (resp) {
                    console.debug('Refreshed billing profile ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, _this.userProfile);
                    Session.setCurrentUserProfile(resp.data);
                })
        }

        /**
         * Note: Server will create a copy of default profile for new users
         */
        UserProfileComponent.prototype.loadUserProfile = function () {
            var userProfileId = Session.getCurrentUserId();
            var _this = this;

            return $.getJSON('/userProfile/' + userProfileId, true)
                .done(function (resp) {
                    console.debug('Loaded UserProfile ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.userProfile);

                    var userProfile = resp.data;
                    Session.setCurrentUserProfile(userProfile);
                    if (userProfile[Consts.CLAIMS_TOUR_PROFILE_KEY] == undefined ||
                        userProfile[Consts.CLAIMS_TOUR_PROFILE_KEY] == false) {
                        amplify.publish(Events.SHOW_WELCOME_MSG);
                    }
                    amplify.publish(Events.LOGGED_IN);
                    amplify.publish(Events.LOADED_USER_PROFILE);
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load UserProfile ' + JSON.stringify(resp));
                    Audit.error('ProfileLoadingError', {resp: JSON.stringify(resp)});
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
                $.getJSON('/config', true)
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
                                Audit.warn('LoginError', err);
                            } else {
                                Session.setCurrentUserAuthProfile(profile);
                                Session.setCurrentUserAuthToken(token);
                                Session.setCurrentUserId(profile.nickname);
                                Audit.info('LoggedIn', {deviceInfo: Responsive.deviceInfo()});
                                // If existing credentials are not found, wait till the profile
                                // is created to trigger LOGGED_IN ev
                                onDone();
                            }
                        })
                    })
                    .fail(function (resp) {
                        console.error('Failed to load Config' + JSON.stringify(resp));
                    });
            } else {
                amplify.publish(Events.LOGGED_IN);
                Audit.info('LoggedIn', {deviceInfo: Responsive.deviceInfo()});
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
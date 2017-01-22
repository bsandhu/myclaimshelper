let mongoUtils = require('./../../server/mongoUtils.js');
let ProfileService = require('./../../server/services/profileService.js');
let _ = require('underscore');
let jQuery = require('jquery-deferred');


function changeToNewContactsSchema() {
    mongoUtils.connect()
        .then(function (db) {
            let collection = db.collection(mongoUtils.CLAIMS_COL_NAME);

            collection
                .find({})
                .toArray(function (err, claims) {

                    let promises = _.map(claims, function (claim) {
                        claim.group = claim.owner;
                        claim.contacts = [];

                        if (!_.isEmpty(claim.insuredContactId)) {
                            claim.contacts.push({
                                category: 'Insured',
                                subCategory: 'Insured',
                                contactId: claim.insuredContactId
                            });
                        }
                        if (!_.isEmpty(claim.insuredAttorneyContactId)) {
                            claim.contacts.push({
                                category: 'Insured',
                                subCategory: 'Insured attorney',
                                contactId: claim.insuredAttorneyContactId
                            });
                        }
                        if (!_.isEmpty(claim.claimantContactId)) {
                            claim.contacts.push({
                                category: 'Claimant',
                                subCategory: 'Claimant',
                                contactId: claim.claimantContactId
                            });
                        }
                        if (!_.isEmpty(claim.claimantsAttorneyContactId)) {
                            claim.contacts.push({
                                category: 'Claimant',
                                subCategory: 'Claimant attorney',
                                contactId: claim.claimantsAttorneyContactId
                            });
                        }
                        if (!_.isEmpty(claim.insuranceCoContactId)) {
                            claim.contacts.push({
                                category: 'Other',
                                subCategory: 'Insurance co.',
                                contactId: claim.insuranceCoContactId
                            });
                        }

                        delete claim.insuredContactId;
                        delete claim.insuredAttorneyContactId;
                        delete claim.claimantContactId;
                        delete claim.claimantsAttorneyContactId;
                        delete claim.insuranceCoContactId;
                        delete claim.otherContactIds;

                        return mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME);
                    });

                    jQuery.when(promises).then(() => {
                        console.log('Finished.')
                    })
                });
        });
}

function changeToUserProfileSchema() {
    mongoUtils.connect()
        .then(function (db) {
            let collection = db.collection(mongoUtils.USERPROFILE_COL_NAME);

            collection
                .find({})
                .toArray(function (err, profiles) {
                    let promises = _.map(profiles, function (profile) {
                        profile.group = profile.owner;
                        profile.ingroups = [profile.owner, ProfileService.DEFAULT_GROUP];
                        profile.isBillingEnabled = true;

                        return mongoUtils.saveOrUpdateEntity(profile, mongoUtils.USERPROFILE_COL_NAME, false);
                    });

                    jQuery.when(promises).then(() => {
                        console.log('Finished updating userProfiles.')
                    })
                });
        });
}

// changeToNewContactsSchema();
changeToUserProfileSchema();
let mongoUtils = require('./../../server/mongoUtils.js');
let MongoClient = require('mongodb').MongoClient;
let ProfileService = require('./../../server/services/profileService.js');
let _ = require('underscore');
let jQuery = require('jquery-deferred');


function changeToClaimsSchema() {
    let seq = Promise.resolve();

    mongoUtils.connect()
        .then(function (db) {
            let collection = db.collection(mongoUtils.CLAIMS_COL_NAME);

            collection
                .find({})
                .toArray(function (err, claims) {

                    function process(claim) {
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

                        claim.isDeleted = false;
                        delete claim.insuredContactId;
                        delete claim.insuredAttorneyContactId;
                        delete claim.claimantContactId;
                        delete claim.claimantsAttorneyContactId;
                        delete claim.insuranceCoContactId;
                        delete claim.otherContactIds;

                        return mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME);
                    }

                    claims.forEach(claim => {
                        seq = seq.then(() => process(claim));
                    });
                });
        });

    return seq;
}

function changeToUserProfileSchema() {
    let seq = Promise.resolve();

    mongoUtils.connect()
        .then(function (db) {
            let collection = db.collection(mongoUtils.USERPROFILE_COL_NAME);

            collection
                .find({})
                .toArray(function (err, profiles) {
                    function process(profile) {
                        profile.group = profile.owner;
                        profile.ingroups = [profile.owner, ProfileService.DEFAULT_GROUP];
                        profile.isBillingEnabled = true;
                        profile.isClaimNoteEnabled = true;
                        profile.isClaimClaimantEnabled = true;
                        profile.isClaimDtEnabled = true;
                        profile.isClaimCoverageEnabled = true;
                        profile.isClaimCloseEnabled = true;
                        delete profile.isClaimDatesEnabled;

                        return mongoUtils.saveOrUpdateEntity(profile, mongoUtils.USERPROFILE_COL_NAME, false);
                    }

                    profiles.forEach(profile => {
                        seq = seq.then(() => process(profile));
                    });
                });
        });
}

function changeToContactsSchema() {
    let seq = Promise.resolve();

    mongoUtils.connect()
        .then(function (db) {
            let collection = db.collection(mongoUtils.CONTACTS_COL_NAME);

            collection
                .find({})
                .toArray(function (err, contacts) {
                    function process(contact) {
                        contact.group = contact.owner;

                        if (!contact.hasOwnProperty('addresses')) {
                            contact.addresses = [{
                                type: 'Work',
                                street: contact.streetAddress || '',
                                city: contact.city || '',
                                state: contact.state || '---',
                                zip: contact.zip || ''
                            }];
                        }
                        if (!contact.hasOwnProperty('emails')) {
                            contact.emails = [{
                                type: 'Work',
                                email: contact.email
                            }];
                        }
                        if (!contact.hasOwnProperty('phones')) {
                            contact.phones = [{
                                type: 'Work',
                                phone: contact.phone,
                                ext: contact.ext
                            }];
                            if (contact.cell != undefined && contact.cell != null && contact.cell != '') {
                                contact.phones.push({
                                    type: 'Cell',
                                    phone: contact.cell,
                                    ext: ''
                                })
                            }
                        }

                        delete contact.streetAddress;
                        delete contact.city;
                        delete contact.state;
                        delete contact.zip;
                        delete contact.email;
                        delete contact.phone;
                        delete contact.ext;
                        delete contact.cell;

                        return mongoUtils.saveOrUpdateEntity(contact, mongoUtils.CONTACTS_COL_NAME, false);
                    }

                    contacts.forEach(contact => {
                        seq = seq.then(() => process(contact));
                    });
                });
        });
}

//changeToClaimsSchema();
//changeToUserProfileSchema();
changeToContactsSchema();

define(['knockout', 'underscore', 'KOMap', 'model/contact', 'shared/consts'],
    function (ko, _, KOMap, Contact, Consts) {

        function _parseName(contact) {
                return (contact != null && contact != undefined && _.has(contact, 'name'))
                    ? contact.name
                    : 'None'
        }
        let isInsured = con => con.category == Consts.CONTACT_CATEGORY_INSURED && con.subCategory == Consts.CONTACT_SUBCATEGORY_INSURED;

        return {
            parseInsured: function (claim) {
                let insured = claim.contacts.find(isInsured);
                return (_.isObject(insured) && _.has(insured, 'contact'))
                    ? insured.contact
                    : undefined;
            },
            parseInsureds: function (claim) {
                let insureds = claim.contacts.filter(isInsured);
                return insureds.map(insured => {
                    return (_.isObject(insured) && _.has(insured, 'contact'))
                        ? insured.contact
                        : undefined;
                });
            },
            parseClaimant: function (claim) {
                let isClaimant = con => con.category == Consts.CONTACT_CATEGORY_CLAIMANT && con.subCategory == Consts.CONTACT_SUBCATEGORY_CLAIMANT;
                let claimant = claim.contacts.find(isClaimant);
                return (_.isObject(claimant) && _.has(claimant, 'contact'))
                    ? claimant.contact
                    : undefined;
            },
            parseName: _parseName,
            parseNames: (contacts = []) => {
                return contacts.map(_parseName).join(', ');
            },
            parsePhone: function (contact) {
                let phones = KOMap.toJS(contact.phones);
                if (phones.length >= 1) {
                    return phones[0].phone;
                }
            },
            parsePhone2: function (contact) {
                let phones = KOMap.toJS(contact.phones);
                if (phones.length >= 2) {
                    return phones[1].phone;
                }
            },
            initContact: function () {
                let contact = new Contact();
                let obsrv = KOMap.fromJS(contact);

                // Asserts
                if (ko.isObservable(obsrv)) {throw 'NOT expecting observable'};
                if (!ko.isObservable(obsrv.phones) && 'push' in obsrv.phones) {throw 'Expecting observable[]'};
                if (!ko.isObservable(obsrv.emails) && 'push' in obsrv.emails) {throw 'Expecting observable[]'};
                return obsrv;
            },
            /**
             * @param contact originally derived from KOMap.fromJS(new Contact())
             */
            reinitContact: function (contact) {
                for (let attr in contact) {
                    let isObservable = ko.isObservable(contact[attr]);

                    //Clean out
                    if (isObservable) {
                        console.log('Clearing contact attr: ' + attr);
                        let attrVal = contact[attr]();
                        let isArray = _.isArray(attrVal);
                        if (isArray) {
                            contact[attr]([]);
                        } else {
                            contact[attr](null);
                        }
                    }
                }
                // Add defaults
                contact.phones.push(KOMap.fromJS({type: 'Work', phone: '', ext: ''}));
                contact.emails.push(KOMap.fromJS({type: 'Work', email: ''}));
                contact.addresses.push(KOMap.fromJS({type: 'Work', street: '', city: '', state: '---', zip: ''}));
            },
            populateFromJSON: function (contactJSON) {
                // Populate with JSON data
                let contact = KOMap.fromJS(contactJSON, {}, new Contact());

                // Array needs to be observable for dynamic add/remove.
                // KOMap doesn't create an observable array
                contact.phones = ko.observableArray(contact.phones);
                contact.emails = ko.observableArray(contact.emails);
                contact.addresses = ko.observableArray(contact.addresses);
                return contact;
            }
        }
    });
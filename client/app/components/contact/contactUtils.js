define(['knockout', 'underscore', 'KOMap', 'model/contact'],
    function (ko, _, KOMap, Contact) {

        return {
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
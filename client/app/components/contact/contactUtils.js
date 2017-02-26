define(['knockout', 'underscore', 'KOMap'],
    function (ko, _, KOMap) {

        return {
            parsePhone: function (contact) {
                let phones = KOMap.toJS(contact.phones);
                if (phones.length >= 1){
                    return phones[0].phone;
                }
            },
            parsePhone2: function (contact) {
                let phones = KOMap.toJS(contact.phones);
                if (phones.length >= 2){
                    return phones[1].phone;
                }
            }
        }
    });
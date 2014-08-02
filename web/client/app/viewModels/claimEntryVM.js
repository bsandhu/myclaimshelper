define(['jquery', 'knockout', 'KOMap', 'model/claim', 'model/ClaimEntry',
        'app/utils/ajaxUtils', 'app/utils/events' ],
    function ($, ko, koMap, Claim, ClaimEntry, ajaxUtils, Events) {

        function ClaimEntryVM() {
            console.log('Init ClaimVM');
        }

        return ClaimEntryVM;
    });
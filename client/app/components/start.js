require(['jquery',
        'knockout',
        'KOAmd',
        'amplify',
        'app/components/appVM',
        'shared/dateUtils',
        'app/utils/session',
        'app/utils/audit',
        'hopscotch',
        'chart.js',

        'loggly',
        'bootbox',
        'app/utils/koDatetimePickerBinding',
        'app/utils/koWYSIWYGBinding',
        'app/utils/koTextTruncateBinding',
        'app/utils/koSortableBinding',
        'app/utils/koAutoComplete',
        'app/utils/koSelect2',
        'app/utils/koTaskEntryTag',
        'app/utils/koPhoneMask',
        'app/utils/koCcyMask',
        'app/utils/RefDataAutocomplete',
        'velocity',
        'bootstrap',
        'KOXeditable',
        'bootstrapTableCustom',
        'bootstrapTable',
        'tableExport',
        'circliful',
        'app/components/userProfile/userProfileComponent',
        'app/components/contact/contactComponent',
        'app/components/contact/addContactComponent',
        'app/components/contact/contactWidgetVM',
        'app/components/fileUpload/fileUploadComponent',
        'app/components/summary/summaryVM',
        'app/components/claimsList/claimsListVM',
        'app/components/notifier/notifierVM',
        'app/components/maps/mapsComponent',
        'app/components/maps/travelComponent',
        'app/components/statusEditor/statusEditorComponent',
        'app/components/stats/statsVM',
        'app/components/taskEntry/taskEntryVM',
        'app/components/claim/claimVM',
        'text-loader!app/components/claim/claim.tmpl.html',
        'text-loader!app/components/claim/claim.entries.tmpl.html',
        'text-loader!app/components/claim/claim.editor.tmpl.html',
        'app/components/admin/adminComponent',
        'app/components/billing/billingComponent',
        'app/components/billingItem/billingItemComponent',
        'app/components/billingProfile/billingProfileComponent',
        'app/components/form/formComponent'],
    function ($, ko, KOAmd, amplify, AppVM, DateUtils, Session, Audit, hopscotch, Chart) {
        console.log('Init App');

        // Chart.noConflict restores the Chart global variable to it's previous owner
        // The function returns what was previously Chart, allowing you to reassign.
        // var Chartjs = Chart.noConflict();
        DateUtils.enableJSONDateHandling();

        // Cleanup session
        Session.clearContacts();

        // Knockout AMD support setup
        ko.amdTemplateEngine.defaultRequireTextPluginName = "text";
        ko.amdTemplateEngine.defaultPath = "/";
        ko.amdTemplateEngine.defaultSuffix = ".tmpl.html";

        // Register components
        ko.components.register('user-profile-component', require('app/components/userProfile/userProfileComponent'));
        ko.components.register('contact-component', require('app/components/contact/contactComponent'));
        ko.components.register('add-contact-component', require('app/components/contact/addContactComponent'));
        ko.components.register('contact-widget-component', require('app/components/contact/contactWidgetVM'));
        ko.components.register('file-upload-component', require('app/components/fileUpload/fileUploadComponent'));
        ko.components.register('summary-component', require('app/components/summary/summaryVM'));

        ko.components.register('claims-component', require('app/components/claim/claimVM'));
        ko.components.register('claims-list-component', require('app/components/claimsList/claimsListVM'));
        ko.components.register('claim-selector-component', require('app/components/claimsList/claimSelectorVM'));
        ko.components.register('notifier-component', require('app/components/notifier/notifierVM'));
        ko.components.register('maps-component', require('app/components/maps/mapsComponent'));
        ko.components.register('travel-component', require('app/components/maps/travelComponent'));
        ko.components.register('status-editor-component', require('app/components/statusEditor/statusEditorComponent'));
        ko.components.register('stats-component', require('app/components/stats/statsVM'));
        ko.components.register('task-entry-component', require('app/components/taskEntry/taskEntryVM'));
        ko.components.register('admin-component', require('app/components/admin/adminComponent'));
        ko.components.register('billing-component', require('app/components/billing/billingComponent'));
        ko.components.register('billing-item-component', require('app/components/billingItem/billingItemComponent'));
        ko.components.register('billing-profile-component', require('app/components/billingProfile/billingProfileComponent'));
        ko.components.register('contact-sync-component', require('app/components/contactSync/contactSyncComponent'));
        ko.components.register('claim-form-component', require('app/components/form/formComponent'));

        // Knockout bindings init
        ko.applyBindings(new AppVM());

        // Start Loggly
        Audit.init();

        // Util fn(s)
        JSON.prettyPrint = function (str) {
            var maxLength = 80;
            return JSON.stringify(str).substring(0, maxLength);
        };
    });
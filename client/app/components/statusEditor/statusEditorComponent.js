define(['jquery', 'knockout', 'KOMap', 'amplify', 'text!app/components/statusEditor/statusEditorComponent.tmpl.html',
        'model/states', 'app/utils/events'],
    function ($, ko, KOMap, amplify, viewHtml, States, Events) {
        'use strict';

        function StatusEditorComponentVM(params) {
            console.log('Init Date editor widget');
            this.States = States;

            console.assert(params.statusValue, 'Expecting status observable to bind to');
            console.assert(params.entryId, 'Expecting Entry Id');

            this.state  = params.statusValue;
            this.entryId  = params.entryId;
            this.inEditMode = ko.observable(false);
            this.showEditable = ko.observable(false);
            this.addESCKeyListener();
        }

        StatusEditorComponentVM.prototype.addESCKeyListener = function () {
            $(document).keyup(function(e) {
                if (e.keyCode == 27) { // escape key maps to keycode `27`
                    this.inEditMode(false);
                }
            }.bind(this));
            $(window).click(function(){
                this.inEditMode(false);
            }.bind(this));
        };

        StatusEditorComponentVM.prototype.onMouseOver = function (evData, ev) {
            this.showEditable(true);
        };

        StatusEditorComponentVM.prototype.onMouseOut = function (evData, ev) {
            this.showEditable(false);
        };

        StatusEditorComponentVM.prototype.onClick = function (evData, ev) {
            ev.stopImmediatePropagation();
            this.inEditMode(true);
        };

        StatusEditorComponentVM.prototype.onDismissEditor = function (evData, ev) {
            this.inEditMode(false);
            ev.stopImmediatePropagation();
        };

        StatusEditorComponentVM.prototype.onUpdate = function (status, entry, ev) {
            ev.stopImmediatePropagation();
            console.log('Raise Claim Entry status update Ev. ' + this.entryId());
            amplify.publish(Events.UPDATE_CLAIM_ENTRY_STATUS, {'claimEntryId': this.entryId(), 'status': status});
        };

        return {viewModel: StatusEditorComponentVM, template: viewHtml};
    }
);
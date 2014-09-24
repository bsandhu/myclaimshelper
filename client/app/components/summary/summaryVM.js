define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'app/utils/dateUtils', 'app/utils/ajaxUtils',
        'text!app/components/summary/summary.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils, summaryView) {
        'use strict';

        function SummaryVM() {
            console.log('Init SummaryVM');

            this.DateUtils = DateUtils;

            // Summary dimensions meta data
            this.summaryDimensions = ko.observableArray([
                {description: 'Date Entered On',
                    dimension: 'entryDate',
                    isInSameGroup: this.DateUtils.isEqualIgnoringTime,
                    sortFn: function (entry1, entry2) {
                        var date1InMillis = entry1.entryDate ? entry1.entryDate().getTime() : 0;
                        var date2InMillis = entry2.entryDate ? entry2.entryDate().getTime() : 0;
                        return date1InMillis - date2InMillis;
                    }
                },
                {description: 'Date Due',
                    dimension: 'dueDate',
                    isInSameGroup: this.DateUtils.isEqualIgnoringTime,
                    sortFn: function (entry1, entry2) {
                        var date1InMillis = entry1.dueDate ? entry1.dueDate().getTime() : 0;
                        var date2InMillis = entry2.dueDate ? entry2.dueDate().getTime() : 0;
                        return date1InMillis - date2InMillis;
                    }
                },
                {description: 'Task Status',
                    dimension: 'status',
                    isInSameGroup: this.DateUtils.isEqualIgnoringTime,
                    sortFn: function (entry1, entry2) {
                        var status1 = entry1.status ? entry1.status() : States.None;
                        var status2 = entry2.status ? entry2.status() : States.None;

                        var todo = States.TODO;
                        var pending = States.Pending;
                        var complete = States.Complete;
                        var none = States.None;

                        var ordering = {todo: 1,
                            pending: 2,
                            complete: 3,
                            none: 4};
                        return ordering[status1] - ordering[status2];
                    }
                }
            ]);
            // Selected dimension
            this.summaryDimension = ko.observable();
            this.setupSummaryDimensionListener();
            this.summaryDimension(this.summaryDimensions()[0]);

            // Entry which was dropped on to
            // The drag ev carries the Entry being moved
            this.summaryDropTargetEntryId = ko.observable();
            this.summaryDropTargetDOMElement = undefined;
            this.summaryDimensionCounter = ko.observable();

            this.claimEntries = ko.observableArray([]);
        }

        SummaryVM.prototype.setupSummaryDimensionListener = function () {
            this.summaryDimension.subscribe(function (val) {
                console.log('Summary dimension changed ' + JSON.stringify(val));
                this.searchClaimEntries();
            }, this);
        };

        SummaryVM.prototype.sortByDimension = function (entriesArray) {
            entriesArray.sort(this.summaryDimension().sortFn);
        };

        SummaryVM.prototype.searchClaimEntries = function (query) {
            query = query || '{}';
            console.log('Searching for claim entries: ' + query);
            var _this = this;

            return $.getJSON('claimEntry/search/' + query)
                .done(function (res) {
                    console.log(JSON.stringify(res.data));

                    var tempArray = $.map(res.data, function (claimEntry) {
                        return KOMap.fromJS(claimEntry, {}, new ClaimEntry());
                    });

                    _this.sortByDimension(tempArray);
                    _this.claimEntries(tempArray);
                });
        };

        SummaryVM.prototype.valueChange = function (index) {
            if (index === 0) {
                return false;
            }
            var tempArray = this.claimEntries();
            var dimension = this.summaryDimension().dimension;
            var inSameGroup = this.summaryDimension().isInSameGroup;

            var dimension1 = tempArray[index][dimension];
            var dimension2 = tempArray[index - 1][dimension];
            var dimension1Val = dimension1 ? dimension1() : '';
            var dimension2Val = dimension2 ? dimension2() : '';

            //console.log('Value change: ' + dimension1Val + ' ' + dimension2Val + ' ' + inSameGroup(dimension1Val, dimension2Val));
            return !inSameGroup(dimension1Val, dimension2Val);
        };

        SummaryVM.prototype.onSummaryRowDragOver = function (entry, ev) {
            // No-op
        };

        SummaryVM.prototype.onSummaryRowDragEnd = function (entry, ev) {
            console.log('Drag end, Source: ' + JSON.stringify(KOMap.toJS(entry)));
            var rowToMove = $(ev.currentTarget).detach();
            $(this.summaryDropTargetDOMElement).after(rowToMove);
            $('.summaryDimensionRow').removeClass('summaryRowDragOver');
            this.updateSrcDimensionWithDropTargetValue(entry);
        };

        SummaryVM.prototype.onSummaryRowDragEnter = function (entry, ev) {
            console.log('Drag enter. Entry Id: ' + ev.currentTarget.dataset.entryid);

            this.summaryDropTargetEntryId(ev.currentTarget.dataset.entryid);
            this.summaryDropTargetDOMElement = ev.currentTarget;
            $(ev.currentTarget).addClass('summaryRowDragOver');
        };

        SummaryVM.prototype.onSummaryRowDragLeave = function (entry, ev) {
            console.log('Drag leave. Entry Id: ' + ev.currentTarget.dataset.entryid);

            this.summaryDropTargetEntryId(ev.currentTarget.dataset.entryid);
            this.summaryDropTargetDOMElement = ev.currentTarget;
            $(ev.currentTarget).removeClass('summaryRowDragOver');
        };

        SummaryVM.prototype.updateSrcDimensionWithDropTargetValue = function (sourceEntry) {
            // This is what we are dropping on to
            // Copy the 'Dimension' value for this entry
            var targetEntry = $.grep(this.claimEntries(),
                function findMatch(entry) {
                    return entry._id() === this.summaryDropTargetEntryId();
                }.bind(this))[0];

            var entryIdToUpdate = sourceEntry._id();
            var dimensionToUpdate = this.summaryDimension().dimension;
            var targetDimensionVal = targetEntry[dimensionToUpdate] ? targetEntry[dimensionToUpdate]() : undefined;

            var dimensionLabel = this.summaryDimension().description;
            var successMsg = 'Updated ' + dimensionLabel + ' to ' + this.DateUtils.niceDate(targetDimensionVal);

            var attrsToUpdate = {};
            attrsToUpdate[dimensionToUpdate] = targetDimensionVal;

            AjaxUtils.post(
                '/claimEntry/modify',
                JSON.stringify({
                    _id: entryIdToUpdate,
                    attrsAsJson: attrsToUpdate
                }),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: successMsg});
                    this.searchClaimEntries();
                }.bind(this)
            );
        };

        return {viewModel: SummaryVM, template: summaryView};
    });
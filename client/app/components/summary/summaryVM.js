define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils',
        'text!app/components/summary/summary.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils, summaryView) {
        'use strict';

        function SummaryVM() {
            console.log('Init SummaryVM');

            this.DateUtils = DateUtils;
            this.claimEntries = ko.observableArray([]);

            // Grouping
            this.setupGroupingOptions();
            this.groupBy = ko.observable(this.groupByOptions()[0]);

            // Filtering
            this.setupDueDateFilters();
            this.setupStatusFilters();
            this.setupFilterVisibility();

            // Drag n Drop
            // Entry which was dropped on to
            // The drag ev carries the Entry being moved
            this.summaryDropTargetEntryId = ko.observable();
            this.summaryDropTargetDOMElement = undefined;

            this.setupGroupByListener();
            this.setupClaimEntryListener();
            this.setupGrouping();

            this.searchClaimEntries();
        }

        SummaryVM.prototype.componentLoaded = function () {
            // no-op
        };

        /************************************************************/
        /* Grouping                                                 */
        /************************************************************/

        SummaryVM.prototype.setupGroupingOptions = function () {
            this.groupByOptions = ko.observableArray([
                {description: 'Date Due',
                    group: 'dueDate',
                    groupingFn: this.getDueDateGroupName,
                    sortFn: function (entry1, entry2) {
                        var date1InMillis = entry1.dueDate ? entry1.dueDate().getTime() : 0;
                        var date2InMillis = entry2.dueDate ? entry2.dueDate().getTime() : 0;
                        return date1InMillis - date2InMillis;
                    }
                },
                {description: 'Date Created',
                    group: 'entryDate',
                    groupingFn: this.getEntryDateGroupName,
                    sortFn: function (entry1, entry2) {
                        var date1InMillis = entry1.entryDate ? entry1.entryDate().getTime() : '';
                        var date2InMillis = entry2.entryDate ? entry2.entryDate().getTime() : '';
                        return date1InMillis - date2InMillis;
                    }
                },
                {description: 'Task Status',
                    group: 'state',
                    groupingFn: this.getStatusGroupName,
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
        };

        SummaryVM.prototype.setupGrouping = function () {
            this.claimEntriesGrouped = ko.computed(function () {
                var dimensionMetaData = this.groupBy();
                var group = dimensionMetaData.group;
                var groupingFn = dimensionMetaData.groupingFn;
                var groups = {};

                $.each(this.claimEntries(), function (index, entry) {
                    var groupingAttr = entry[group] ? entry[group]() : '';
                    var groupName = groupingFn(groupingAttr, entry);
                    if (!(groupName in groups)) {
                        groups[groupName] = [];
                    }
                    groups[groupName].push(entry);
                }.bind(this));
                console.log(groups);
                return groups;
            }, this);

            this.arrangeByKeys = ko.computed(function () {
                var keys = [];
                $.each(this.claimEntriesGrouped(), function (group) {
                    keys.push(group);
                });
                console.log(keys);
                return keys;
            }, this);
        };

        SummaryVM.prototype.getDueDateGroupName = function (dueDate, entry) {
            if (!(dueDate instanceof Date)) {
                return $.trim(String(dueDate || ''));
            }

            if (DateUtils.isYesterdayOrBefore(dueDate) &&
                (entry.state() === States.TODO || entry.state() === States.PENDING)){
                return 'Over Due';
            } else {
                return  DateUtils.niceDate(dueDate, false);
            }
        };

        SummaryVM.prototype.getEntryDateGroupName = function (entryDate) {
            if (entryDate instanceof Date) {
                return DateUtils.niceDate(entryDate, false);
            }
            return $.trim(String(entryDate || ''));
        };

        SummaryVM.prototype.getStatusGroupName = function (status) {
            return $.trim(String(status || ''));
        };

        /************************************************************/
        /* Filtering                                                */
        /************************************************************/

        SummaryVM.prototype.setupDueDateFilters = function () {
            this.dueDateDaysFilterValue = ko.observable(3);
            this.dueDateFilters = ko.observableArray([
                {description: 'today', query: {'$gte': DateUtils.startOfToday().getTime(), '$lte': DateUtils.endOfToday().getTime()}},
                {description: 'this week', query: {'$gte': DateUtils.startOfWeekInMillis(), '$lte': DateUtils.endOfWeekInMillis()}},
                {description: 'within next', query: {'$gte': DateUtils.startOfToday().getTime(), '$lte': DateUtils.daysFromNowInMillis(this.dueDateDaysFilterValue())}}
            ]);
            this.dueDateFilter = ko.observable(this.dueDateFilters()[2]);
        };

        SummaryVM.prototype.setupStatusFilters = function () {
            this.statusFilters = ko.observableArray([
                {description: 'Any', query: {$in: [States.TODO, States.Pending, States.Complete, States.None]}},
                {description: States.TODO, query: States.TODO},
                {description: States.Pending, query: States.Pending},
                {description: States.Complete, query: States.Complete},
                {description: States.None, query: States.None}
            ]);
            this.statusFilter = ko.observable(this.statusFilters()[0]);
        };

        SummaryVM.prototype.setupFilterVisibility = function () {
            this.showDueDateDaysFilter = ko.computed(function () {
                return this.groupBy().group === 'dueDate' && this.dueDateFilter().description === 'within next';
            }, this);
        };

        /************************************************************/
        /* Event handling                                           */
        /************************************************************/

        SummaryVM.prototype.onClaimEntrySelect = function (entry) {
            Router.routeToClaimEntry(entry.claimId(), entry._id());
        };

        SummaryVM.prototype.setupGroupByListener = function () {
            this.groupBy.subscribe(function (val) {
                console.log('Summary group changed ' + JSON.stringify(val));
                this.searchClaimEntries();
            }, this);
            this.dueDateFilter.subscribe(function (val) {
                console.log('Due date changed ' + JSON.stringify(val));
                this.searchClaimEntries();
            }, this);
            this.statusFilter.subscribe(function (val) {
                console.log('Status changed ' + JSON.stringify(val));
                this.searchClaimEntries();
            }, this);
            this.dueDateDaysFilterValue.subscribe(function (val) {
                console.log('Due date changed ' + JSON.stringify(val));
                this.dueDateFilter().query = {'$gte': DateUtils.startOfToday().getTime(), '$lte': DateUtils.daysFromNowInMillis(val)};
                this.searchClaimEntries();
            }, this);
        };

        SummaryVM.prototype.setupClaimEntryListener = function () {
            amplify.subscribe(Events.SAVED_CLAIM, this, this.searchClaimEntries);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.searchClaimEntries);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.searchClaimEntries);
            amplify.subscribe(Events.UPDATE_CLAIM_ENTRY_STATUS, this, this.searchClaimEntries);
        };

        SummaryVM.prototype.searchClaimEntries = function () {
            // Matches Filter or is Overdue
            var postReq = { query: {isClosed: false,
                                   '$or' : [
                                        {'$and': [{dueDate: this.dueDateFilter().query},
                                                 {state: this.statusFilter().query}]},
                                        {'$and': [ { dueDate: {'$lte': DateUtils.startOfToday().getTime()}},
                                                   { $or: [{state: {'$eq': States.TODO}}, {state: {'$eq': States.PENDING}}]} ]}
                                    ]},
                            options: {sort: [[this.groupBy().group, 'asc']]}};
            console.log('Searching for claim entries: ' + postReq);

            AjaxUtils.post(
                '/claimEntry/search',
                JSON.stringify(postReq),
                function onSuccess(res) {
                    console.log(JSON.stringify(res.data));

                    var tempArray = $.map(res.data, function (claimEntry) {
                        return KOMap.fromJS(claimEntry, {}, new ClaimEntry());
                    });
                    this.claimEntries(tempArray);
                }.bind(this));
        };

        /************************************************************/
        /* Drag n drop                                              */
        /************************************************************/

        SummaryVM.prototype.onSummaryRowDragOver = function (entry, ev) {
            // No-op - needed for Chrome to auto create nice drag icon
        };

        SummaryVM.prototype.onSummaryRowDragEnd = function (entry, ev) {
            console.log('Drag end, Source: ' + JSON.stringify(KOMap.toJS(entry)));
            var rowToMove = $(ev.currentTarget).detach();
            $(this.summaryDropTargetDOMElement).after(rowToMove);
            $('.summaryRow').removeClass('summaryRowDragOver');
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
            var dimensionToUpdate = this.groupBy().group;
            var targetDimensionVal = targetEntry[dimensionToUpdate] ? targetEntry[dimensionToUpdate]() : undefined;

            var dimensionLabel = this.groupBy().description;
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
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: sourceEntry.claimId(), claimEntryId: entryIdToUpdate});
                    this.searchClaimEntries();
                }.bind(this)
            );
        };

        return {viewModel: SummaryVM, template: summaryView};
    }
);
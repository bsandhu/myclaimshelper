define(['jquery', 'knockout', 'underscore', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils',
        'text!app/components/summary/summary.tmpl.html'],
    function ($, ko, _, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils, summaryView) {
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
            this.summaryDropSourceEntryId = ko.observable();

            this.summaryDropSourceGroup = ko.observable();
            this.summaryDropTargetGroup = ko.observable();

            this.summaryDropSourceDOMElement = undefined;
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
                // {description: 'Date Created',
                //     group: 'entryDate',
                //     groupingFn: this.getEntryDateGroupName,
                //     sortFn: function (entry1, entry2) {
                //         var date1InMillis = entry1.entryDate ? entry1.entryDate().getTime() : '';
                //         var date2InMillis = entry2.entryDate ? entry2.entryDate().getTime() : '';
                //         return date1InMillis - date2InMillis;
                //     }
                // },
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
            // {'Over Due':[...], 'Today': [...]}
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

            // ['Over Due', 'Today']
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
            // Default filter to 'ToDo'
            this.statusFilter = ko.observable(this.statusFilters()[1]);
        };

        SummaryVM.prototype.setupFilterVisibility = function () {
            this.showDueDateDaysFilter = ko.computed(function () {
                return this.dueDateFilter().description === 'within next';
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
                                                   { $or: [{state: {'$eq': States.TODO}}, {state: {'$eq': States.Pending}}]} ]}
                                    ]},
                            options: {sort: [['displayOrder', 'asc']]}};
            console.log('Searching for claim entries: ' + JSON.stringify(postReq));

            AjaxUtils.post(
                '/claimEntry/search',
                JSON.stringify(postReq),
                function onSuccess(res) {
                    console.log(JSON.prettyPrint(res.data));

                    var tempArray = $.map(res.data, function (claimEntry) {
                        return KOMap.fromJS(claimEntry, {}, new ClaimEntry());
                    });
                    this.claimEntries(tempArray);
                }.bind(this));
        };

        /************************************************************/
        /* Drag n drop                                              */
        /************************************************************/

        SummaryVM.prototype.onAfterRender = function () {
            // Restore collapse state
            var settings = amplify.store.sessionStorage('SUMMARY_GROUPS_VISIBILITY') || {};
            _.mapObject(settings, function(isCollapsed, rowClass){
                if (isCollapsed) {
                    $(rowClass).fadeOut(1);
                    $(rowClass + 'Arrow').addClass('rotate90');
                } else {
                    $(rowClass).fadeIn(1);
                }
            });
        }

        SummaryVM.prototype.onSummaryHeaderClick = function (groupKey, ev) {
            var rowsByClass = '.summaryRow' + groupKey.replace(' ', '');
            var arrowIconNode = $(ev.currentTarget.childNodes[1]);

            // Row visibility/icon rotation
            $(rowsByClass).fadeToggle(500);
            arrowIconNode.toggleClass('rotate90')

            // Store is session so we can 'remember'
            var settings = amplify.store.sessionStorage('SUMMARY_GROUPS_VISIBILITY') || {};
            settings[rowsByClass] = arrowIconNode.hasClass('rotate90');
            amplify.store.sessionStorage('SUMMARY_GROUPS_VISIBILITY', settings);
        }

        SummaryVM.prototype.onSummaryRowDragOver = function (entry, ev) {
            // No-op - needed for Chrome to auto create nice drag icon
        };

        /**
         * Fired when the user starts dragging an element or text selection
         */
        SummaryVM.prototype.onSummaryRowDragStart = function (entry, ev) {
            this.summaryDropSourceEntryId(ev.currentTarget.dataset.entryid);
            this.summaryDropSourceGroup(ev.currentTarget.dataset.group);
            this.summaryDropSourceDOMElement = ev.currentTarget;
            console.log('Drag start: ' + this.summaryDropSourceEntryId() + ' ,' + this.summaryDropSourceGroup());
            return true;
        }
        
        /**
         * Fired when a dragged element or text selection enters a valid drop target
         */
        SummaryVM.prototype.onSummaryRowDragEnter = function (entry, ev) {
            console.log('Drag enter. Entry Id: ' + ev.currentTarget.dataset.entryid);

            // Start tracking the destination
            // Source entry is provided by KO ev binding via param
            this.summaryDropTargetEntryId(ev.currentTarget.dataset.entryid);
            this.summaryDropTargetGroup(ev.currentTarget.dataset.group);
            this.summaryDropTargetDOMElement = ev.currentTarget;
            $(ev.currentTarget).addClass('summaryRowDragOver');
        };

        /**
         * Fired when a dragged element or text selection leaves a valid drop target.
         */
        SummaryVM.prototype.onSummaryRowDragLeave = function (entry, ev) {
            $(ev.currentTarget).removeClass('summaryRowDragOver');
        };

        /**
         * Fired when a drag operation is being ended
         */
        SummaryVM.prototype.onSummaryRowDragEnd = function (entry, ev) {
            console.log('Drag end, Source: ' + JSON.stringify(KOMap.toJS(entry)));

            // Move the source row to be after the target row DOM element
            var sourceRow = $(this.summaryDropSourceDOMElement).fadeOut('slow').detach();
            $(this.summaryDropTargetDOMElement).after(sourceRow);
            sourceRow.fadeIn('slow');
            $('.summaryRow').removeClass('summaryRowDragOver');

            // Ajax update
            this.updateSrcDimensionWithDropTargetValue();
        };

        SummaryVM.prototype.updateSrcDimensionWithDropTargetValue = function () {
            // This is what we are dropping on to
            var targetEntry = $.grep(this.claimEntries(),
                function findMatch(entry) {
                    return entry._id() === this.summaryDropTargetEntryId();
                }.bind(this))[0];

            // This is what is being dragged
            var sourceEntry = $.grep(this.claimEntries(),
                function findMatch(entry) {
                    return entry._id() === this.summaryDropSourceEntryId();
                }.bind(this))[0];

            var entryIdToUpdate = sourceEntry._id();
            var dimensionToUpdate = this.groupBy().group;
            var targetDimensionVal = targetEntry[dimensionToUpdate] ? targetEntry[dimensionToUpdate]() : undefined;

            // Target entry
            // -------  <--- Moving source here
            // Target + 1 entry
            // ------
            // ------
            // Source entry
            //
            // Adjust the new displayOrder of the sourceEntry to be between Target and TargetPlus1
            // So the order is maintained
            var sourceEntryDisplayOrder = sourceEntry.displayOrder();
            var targetEntryDisplayOrder = targetEntry.displayOrder();

            var targetPlus1Entry = $(this.summaryDropSourceDOMElement).next()[0];
            // If dragged past the last row ... pretend that targetPlus1 is target + 100
            var targetPlus1EntryDisplayOrder = targetPlus1Entry ? targetPlus1Entry.dataset.displayorder : targetEntryDisplayOrder + 100;

            console.log('summaryDropSourceGroup: ' + this.summaryDropSourceGroup());
            console.log('summaryDropTargetGroup: ' + this.summaryDropTargetGroup());
            console.log('sourceEntryDisplayOrder: ' + sourceEntryDisplayOrder);
            console.log('targetEntryDisplayOrder: ' + targetEntryDisplayOrder);
            console.log('targetPlus1EntryDisplayOrder: ' + targetPlus1EntryDisplayOrder);

            // Not dragged across groups - just re-order within same group
            if (this.summaryDropTargetGroup() === this.summaryDropSourceGroup()) {
                console.log('Drop within same group. Update display order');
                var successMsg = 'Re-ordered';
                var attrsToUpdate = {};
                var N = Number
                attrsToUpdate['displayOrder'] = (N(targetEntryDisplayOrder) + N(targetPlus1EntryDisplayOrder))/2;

            } else {
                // Dragged across groups
                var dimensionLabel = this.groupBy().description;
                var successMsg = 'Updated ' + dimensionLabel + ' to ' + this.DateUtils.niceDate(targetDimensionVal);

                var attrsToUpdate = {};
                attrsToUpdate[dimensionToUpdate] = targetDimensionVal;
            }
            console.log('Updating: ' + JSON.stringify(attrsToUpdate));

            AjaxUtils.post(
                '/claimEntry/modify',
                JSON.stringify({
                    _id: entryIdToUpdate,
                    attrsAsJson: attrsToUpdate
                }),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: successMsg});
                    //amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: sourceEntry.claimId(), claimEntryId: entryIdToUpdate});
                    this.searchClaimEntries();
                }.bind(this)
            );
        };

        function reduceByTen(sourceValue, targetValue) {
            targetValue = targetValue - 10;

        }

        return {viewModel: SummaryVM, template: summaryView};
    }
);
define(['jquery', 'amplify', 'hopscotch',
        'app/utils/router', 'app/utils/ajaxUtils', 'app/utils/session', 'app/utils/consts'],
    
    function ($, amplify, hopscotch, Router, ajaxUtils, Session, Consts) {
        function Tours() {
            console.log('Init Tours');
        }

        Tours.prototype.markAsDone = function (tourName) {
            var attrs = {};
            attrs[tourName] = true;

            ajaxUtils.post(
                '/userProfile/modify',
                JSON.stringify({id: Session.getCurrentUserId(), attrsAsJson: attrs}),
                function onSuccess(response) {
                    console.log("Marked tour " + tourName + "as done");
                },
                function onSuccess(response) {
                    console.error("Failed to mark tour " + tourName + " as done");
                });
        }

        Tours.prototype.startClaimsTour = function () {
            var _this = this;
            var claimsTour = {
                id: "claims-tour",
                steps: [
                    {
                        title: "Welcome!",
                        content: "Take a quick tour .. just click next",
                        target: "navbar-brand-logo",
                        placement: "bottom",
                        delay: 1000,
                        onNext: function (tour) {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#index-claims-list a')[0].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claimListTable tbody tr:last-child td:nth-child(4)');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 1);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim",
                        content: "A claim corresponds to a file or a case which you work on",
                        target: 'claimListTable',
                        placement: "bottom",
                        delay: 1000,
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimListTable tbody tr:last-child td:nth-child(4)').click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#taskEntrySummary1');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 2);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim details",
                        content: "All the work you do while investigating a Claim can be tracked as tasks",
                        target: "taskEntrySummary0",
                        placement: "bottom",
                        onNext: function () {
                            $('#claim-newtask-btn')[0].click()
                        }
                    },
                    {
                        title: "Task type",
                        content: "You can create different types of tasks, including tasks specifically for travel",
                        target: "claim-newtask-btn",
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimEntriesList tbody tr:nth-child(1) td:nth-child(3)').click()

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#task-entry-attach');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 4);
                                }
                            }, 100);
                        },
                    },
                    {
                        title: "Task",
                        content: "In additional to basic information, you can attach files, location and billing information here",
                        target: "taskEntryHeading",
                        placement: "bottom",

                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#index-tasks-list a')[0].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#summaryTableHeader3');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 5);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Tasks list",
                        content: "You can see all the tasks for today on this page",
                        target: "summaryTableHeader3",
                        placement: "bottom",
                    },
                    {
                        title: "There's more",
                        content: "When you have a minute check out more tours from the help section!",
                        target: "index-billing",
                        placement: "bottom"
                    }
                ],
                onError: function (e) {
                    console.error('Tour error ' + JSON.stringify(arguments));
                },
                onClose: function () {
                    _this.markAsDone(Consts.CLAIMS_TOUR_PROFILE_KEY)
                },
                onEnd: function () {
                    _this.markAsDone(Consts.CLAIMS_TOUR_PROFILE_KEY)
                }
            }

            var pgLoadCheck = setInterval(function () {
                // This is the element from the next step.
                var $element = $('#summaryTableHeader');

                if ($element.is(':visible')) {
                    clearInterval(pgLoadCheck);
                    hopscotch.endTour(true);
                    hopscotch.startTour(claimsTour);
                }
            }, 100);
        }

        Tours.prototype.startBillingTour = function () {
            console.log('Starting billing tour');
            var billingTour = {
                id: "billing-tour",
                steps: [
                    {
                        title: "Billing",
                        content: "You can manage all your bills on this screen. Track what's been paid and outstanding. " +
                        "Clicking on this will take you to the details of the Bill.",
                        target: "billigListSubmitHeader",
                        placement: "bottom"
                    },
                    {
                        title: "Billing",
                        content: "You can quickly see the Bills by status by using this filter." +
                        "<br/> Lets look at the details of an individual bill next.",
                        target: "billingListStatusFilter",
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#billingListTable tbody tr td')[2].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#billingCreateTable tbody tr');
                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 2);
                                }
                            }, 100);
                        }
                    },
                    // This step is dummy - to keep hopscotch happy
                    // Hopscotch seems to have going to next step after the page step
                    {
                        title: "Bill",
                        content: "This is a Bill for the tasks done on a Claim. You can create multiple bills.",
                        target: "billigListSubmitHeader",
                        placement: "left"
                    },
                    {
                        title: "Bill",
                        content: "This is a Bill for the tasks done on a Claim. You can create multiple bills.",
                        target: "billingInvoiceHeader",
                        placement: "left"
                    },
                    {
                        title: "Rate",
                        content: "You can set the rates and taxes for the Bill here",
                        target: "billCreationProfileBtn",
                        placement: "left"
                    },
                    {
                        title: "Bill",
                        content: "To finalize the Bill, you can edit the Bill inline.",
                        target: "billingCreationMileage0",
                        placement: "bottom"
                    },
                    {
                        title: "Bill",
                        content: "Once you are done making changes, you can save a draft or Submit the bill. " +
                        "<br/> Submitting the bill does not send the bill to anyone. It just tracks its as such in the system",
                        target: "billCreationSaveDraftBtn",
                        placement: "left"
                    }
                ],
                onError: function (e) {
                    console.error('Tour error ' + JSON.stringify(arguments));
                },
                onEnd: function () {
                    Router.routeToBilling();
                }
            }

            var pgLoadCheck = setInterval(function () {
                // This is the element from the next step.
                var $element = $('#billingListTable');

                if ($element.is(':visible')) {
                    clearInterval(pgLoadCheck);
                    hopscotch.endTour(true);
                    hopscotch.startTour(billingTour);
                }
            }, 100);
        }

        return new Tours();
    }
)
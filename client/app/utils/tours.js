define(['jquery', 'amplify', 'hopscotch',
        'app/utils/router', 'app/utils/ajaxUtils', 'app/utils/session', 'app/utils/consts'],

    function ($, amplify, hopscotch, Router, ajaxUtils, Session, Consts) {

        function Tours() {
            console.log('Init Tours');
        }

        Tours.prototype.markAsDone = function (tourName = Consts.CLAIMS_TOUR_PROFILE_KEY) {
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
                        title: "Claims",
                        content: "A claim corresponds to a file or a case which you investigate<br/><br/>This is the Claims section",
                        target: "index-claims-list",
                        placement: "bottom",
                        onNext: function (tour) {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#index-claims-list a')[0].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claimListTable tbody tr:first-child td:nth-child(4)');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 1);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim",
                        content: "All the open Claims are listed on this page<br/><br/>Let's look at a sample Claim file in more detail.",
                        target: 'claimListTableHeader',
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimListTable tbody tr:first-child td:nth-child(4)').click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claimDocsTabLink');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 2);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim details",
                        content: "This is the detailed view of a sample Claim file.<br/><br/>You can track various pieces of information like the dates and contacts",
                        target: "claimDateOfLoss",
                        placement: "right",
                    },
                    {
                        title: "Claim",
                        content: "You can edit Claims",
                        target: 'claimEditBtn',
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimEditBtn').click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claimEditorInsured');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 4);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim",
                        content: "You add flexibly add Insured/Claimant/Contacts as needed",
                        target: 'claimEditorInsured',
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimEditorCancelBtn').click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claimDocsTabLink');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 5);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim",
                        content: "All the work you do while investigating a Claim can be tracked as `Tasks`",
                        target: 'claimTasksTabLink',
                        placement: "bottom",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#claimTasksTabLink').click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#claim-newtask-btn');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 6);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Claim details",
                        content: "Tasks have a status like ToDo/Complete etc.",
                        target: "claimEntriesList tbody tr:nth-child(1) td:nth-child(3)",
                        placement: "bottom",
                        onNext: function () {
                            $('#claim-newtask-btn')[0].click()
                        }
                    },
                    {
                        title: "Task type",
                        content: "You can create different types of tasks, including tasks specifically for travel<br/><br/>" +
                        "Let's look at a sample task in more detail",
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
                                    hopscotch.startTour(currTour, 8);
                                }
                            }, 100);
                        },
                    },
                    {
                        title: "Task",
                        content: "This is the detailed view of a Task<br/><br/>In additional to basic information, you can attach files and location information",
                        target: "taskEntryHeading",
                        placement: "bottom"
                    },
                    {
                        title: "Billing information",
                        content: "You can Bill for aspects like Miles travelled / Hours worked or business expense<br/><br/>" +
                        "You can also specify billing codes as needed by the Insurer. Please contact us to customize these codes",
                        target: "billing-item-mileage",
                        placement: "right",
                        onNext: function () {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#index-tasks-list a')[0].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#summaryTableHeader3');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 10);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Tasks list",
                        content: "You can see all of Today's and upcoming tasks on the 'Tasks' page<br/><br/>" +
                        "This could help in staying organized and tracking progress",
                        target: "summaryTableHeader4",
                        placement: "bottom",
                    },
                    {
                        title: "There's more",
                        content: "When you have a minute check out more tours from the help section!",
                        target: "index-help",
                        placement: "bottom"
                    }
                ],
                onError: function (e) {
                    console.error('Tour error ' + JSON.stringify(arguments));
                },
                /*onClose: function () {
                    _this.markAsDone(Consts.CLAIMS_TOUR_PROFILE_KEY)
                },*/
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
                        content: "You can Bill the work done for a Claim<br/><br/>This is the Bills section",
                        target: "index-billing",
                        placement: "bottom",
                        onNext: function (tour) {
                            var currTour = hopscotch.getCurrTour();
                            hopscotch.endTour();
                            $('#index-billing a')[0].click();

                            var checkExist = setInterval(function () {
                                // This is the element from the next step.
                                $element = $('#billingListTable');

                                if ($element.is(':visible')) {
                                    clearInterval(checkExist);
                                    hopscotch.startTour(currTour, 1);
                                }
                            }, 100);
                        }
                    },
                    {
                        title: "Billing",
                        content: "You can manage all your Bills on this screen<br/><br/>" +
                        "Easily track what's been paid and outstanding",
                        target: "billigListSubmitHeader",
                        placement: "bottom"
                    },
                    {
                        title: "Billing",
                        content: "You can quickly see the Bills by status by using this filter<br/><br/>" +
                        "Lets look at the details of an individual bill next",
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
                                    hopscotch.startTour(currTour, 3);
                                }
                            }, 100);
                        }
                    },
                    // This step is dummy - to keep hopscotch happy
                    // Hopscotch seems to be going to next step after the page step
                    {
                        title: "Dummy Step",
                        content: "This is the detailed view of a Bill, for the Tasks done on the sample Claim",
                        target: "billigListSubmitHeader",
                        placement: "left"
                    },
                    {
                        title: "Bill",
                        content: "This is the detailed view of a Bill, for the Tasks done on the sample Claim",
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
                        content: "Once you are done making changes, you can save a draft or Submit the bill<br/><br/>" +
                        "Submitting the bill does not send the bill to anyone. It just tracks its as such in the system",
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

            hopscotch.startTour(billingTour);
        }

        return new Tours();
    }
)
var tags = require('./../model/tags.js');
var DateUtils = require('./../shared/dateUtils.js');
var mongoUtils = require('./../../server/mongoUtils.js');
var _ = require('underscore');
var jQuery = require('jquery-deferred');


var now = new Date().getTime();

var sampleClaimId = String(now);
var sampleClaimantId = sampleClaimId + '0';
var sampleInsuredId = sampleClaimId + '1';
var sampleTask1Id = sampleClaimId + '5';
var sampleTask2Id = sampleClaimId + '6';
var sampleTask3Id = sampleClaimId + '7';
var sampleBillId = sampleClaimId + '111';

var tenDaysFromNow = DateUtils.daysFromNowInMillis(10);
var tomorrow = DateUtils.daysFromNowInMillis(1);
var anHourFromNow = now + (86400000/24);
var tenDaysEarlier = now - (DateUtils.MILLIS_IN_A_DAY * 10);
var twentyDaysEarlier = now - (DateUtils.MILLIS_IN_A_DAY * 20);

var data = {
    claim: {
        "_id": sampleClaimId,
        "fileNum": "02-88767AC",
        "isClosed": false,
        "summary": null,
        "description": "This is a sample Claim to give you an idea of what a Claim looks like. Typically the summary of evenst will go here.\n",
        "dateReceived": now,
        "dateDue": tenDaysFromNow,
        "dateOfLoss": twentyDaysEarlier,
        "updateDate": 0,
        "entryDate": now,
        "locationStreetAddress": "100 Rodeo Drive",
        "locationCity": "East Meadow",
        "locationZip": 11554,
        "insuredContactId": sampleInsuredId,
        "insuredAttorneyContactId": sampleClaimantId,
        "claimantContactId": sampleClaimantId,
        "claimantsAttorneyContactId": sampleClaimantId,
        "insuranceCoContactId": sampleClaimantId,
        "insuranceCompanyFileNum": "60001870845",
        "insuranceCompanyName": "Gieco",
        "state": "NY"
    },
    contacts: [
        {
            "_id": sampleClaimantId,
            "isBusiness": false,
            "role": null,
            "name": "Sample Claimant",
            "businessName": null,
            "streetAddress": null,
            "city": "East Meadow",
            "zip": 11554,
            "email": null,
            "phone": "908-243-4800",
            "cell": null
        },
        {
            "_id": sampleInsuredId,
            "isBusiness": true,
            "role": null,
            "name": "Sample Insured",
            "businessName": "ABC corp",
            "streetAddress": null,
            "city": "East Meadow",
            "zip": 11554,
            "email": null,
            "phone": "516-213-0000",
            "cell": null
        }],
    tasks: [
        {
            "_id": sampleTask1Id,
            "claimId": sampleClaimId,
            "isClosed": false,
            "tag": [
                tags.PHONE
            ],
            "entryDate": now,
            "dueDate": anHourFromNow,
            "summary": "Sample phone call task",
            "description": "This is a sample phone call task. Typically you would use this to record the details of the call here.",
            "attachments": [],
            "state": "ToDo"
        },
        {
            "_id": sampleTask2Id,
            "claimId": sampleClaimId,
            "isClosed": false,
            "tag": [
                tags.VISIT
            ],
            "entryDate": now,
            "dueDate": anHourFromNow,
            "summary": "Sample visit task",
            "description": "This is a sample travel task. Typically you would use this when you travel for business purposes. <br><br>" +
                           "Travel taska are automatically shown on a map in the 'Travel' section.",
            "attachments": [],
            "state": "ToDo",
            "location" : {
                "formatted_address" : "2550 Hempstead Turnpike, East Meadow, NY 11554, USA",
                "name" : "2550 Hempstead Turnpike",
                "geometry" : {
                    "location" : {
                        "lat" : 40.723888,
                        "lng" : -73.541483
                    }
                }
            }
        },
        {
            "_id": sampleTask3Id,
            "claimId": sampleClaimId,
            "isClosed": false,
            "tag": [
                tags.PHOTOS
            ],
            "entryDate": now,
            "dueDate": anHourFromNow,
            "summary": "Sample Photos task",
            "description": "This is sample photos task. You can use this  when yo spend time collecting photo evidence or othet such documents.",
            "attachments": [],
            "state": "Complete"
        }],
    billingItems: [
        {
            "_id": sampleClaimId + '11',
            "billId": sampleBillId,
            "claimEntryId": sampleTask1Id,
            "entryDate": now,
            "tag": null,
            "summary": null,
            "timeRate": null,
            "distanceRate": null,
            "code": null,
            "mileage": 10,
            "time": 1.25,
            "expenseAmount": 0,
            "totalAmount": 0,
            "status": "Not Submitted"
        },
        {
            "_id": sampleClaimId + '22',
            "billId": sampleBillId,
            "claimEntryId": sampleTask2Id,
            "entryDate": now,
            "tag": null,
            "summary": null,
            "timeRate": null,
            "distanceRate": null,
            "code": null,
            "mileage": 0,
            "time": .5,
            "expenseAmount": 0,
            "totalAmount": 0,
            "status": "Not Submitted"
        },
        {
            "_id": sampleClaimId + '33',
            "billId": sampleBillId,
            "claimEntryId": sampleTask3Id,
            "entryDate": now,
            "tag": null,
            "summary": null,
            "timeRate": null,
            "distanceRate": null,
            "code": null,
            "mileage": 15,
            "time": 1,
            "expenseAmount": 0,
            "totalAmount": 0,
            "status": "Not Submitted"
        }
    ],
    bill: {
        "_id": sampleBillId,
        "claimId": sampleClaimId,
        "creationDate": now,
        "submissionDate": null,
        "paidDate": null,
        "billRecipient": {
            "isBusiness": false
        },
        "preTaxTotal": 10.8,
        "taxRate": 8.25,
        "tax": 0.89,
        "total": 11.69,
        "totalTime": 2.75,
        "totalMileage": 25,
        "totalExpenseAmount": 0,
        "totalTimeInDollars": 3.3,
        "totalMileageInDollars": 7.5,
        "status": "Not Submitted"
    }
}

function setupSampleDataFor(userId) {
    var defer = jQuery.Deferred();
    var defereds = [];

    // Contacts
    _.each(data.contacts, function (contact) {
        contact.owner = userId;
        defereds.push(mongoUtils.saveOrUpdateEntity(contact, mongoUtils.CONTACTS_COL_NAME, userId));
    });

    // Tasks
    _.each(data.tasks, function (entry) {
        entry.owner = userId;
        defereds.push(mongoUtils.saveOrUpdateEntity(entry, mongoUtils.CLAIM_ENTRIES_COL_NAME, userId));
    });

    // Billing item
    _.each(data.billingItems, function (billItem) {
        billItem.owner = userId;
        defereds.push(mongoUtils.saveOrUpdateEntity(billItem, mongoUtils.BILLING_ITEMS_COL_NAME, userId));
    });

    // Claim
    var claim = data.claim;
    claim.owner = userId;
    defereds.push(mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME, userId));

    // Bill
    var bill = data.bill;
    bill.owner = userId;
    defereds.push(mongoUtils.saveOrUpdateEntity(bill, mongoUtils.BILL_COL_NAME, userId));

    jQuery.when(defereds)
        .then(function () {
            console.log("Created sample data for " + userId);
            defer.resolve();
        })
        .fail(function (err) {
            console.error("Failed to create sample data for " + userId);
            console.error(err);
            defer.reject();
        })
    return defer;
}

exports.setupFor = setupSampleDataFor;
var data = [
    {
        "_id": "DefaultUser",
        "owner": "DefaultUser",
        "contactInfo": {
            "businessName": "Business name",
            "streetAddress": "Street name",
            "city": "City",
            "zip": "11001"
        },
        "billingProfile": {
            "timeUnit": "hour",
            "distanceUnit": "mile",
            "timeRate": 1.2,
            "distanceRate": 0.3,
            "taxRate": 8.25,
            "billingTypes": {},
            "codes": {
                "OutsideCodes": {
                    '101': 'Contact Insured w/travel',
                    '102': 'Contact Clmt 1AT/travel',
                    '103': 'Contact Witness w/travel',
                    '104': 'Contact other w/travel',
                    '105': 'Investigation w/travel',
                    '106': 'Scene photo/diagram',
                    '107': 'Scene Photo only',
                    '108': 'S/S Insured',
                    '109': 'S/S Claimant',
                    '110': 'S/S Witness',
                    '111': 'S/S Other',
                    '112': 'Attempted/Unsuccessful S/S',
                    '113': 'Canvass Area',
                    '114': 'Interview in Person',
                    '115': 'Public Records',
                    '116': 'Obtain Police Records',
                    '117': 'Legal w/travel',
                    '118': 'Activity Check',
                    '119': 'Surveillance',
                    '120': 'Miscellaneous Travel',
                    '121': 'Miscellaneous Other',
                    '122': 'Photo Miscellaneous',
                    '123': 'Requested Medical Records',
                    '124': '',
                    '125': 'Inspect/Photo Vehicle',
                    '126': 'Postal Check for address',
                    '127': 'Wait Time for Interview',
                    '128': 'Cold Call w/travel',
                    '129': 'Travel to Loss location',
                    '130': 'Scope the loss'
                },
                "InsideCodes": {
                    '201': 'Dictation',
                    '202': 'Telephone Insured',
                    '203': 'Telephone Claimant',
                    '204': 'Telephone Witness',
                    '205': 'Telephone Claimant Attorney',
                    '206': 'Telephone Defense Attorney',
                    '207': 'Telephone Adverse Carrier',
                    '208': 'Telephone Other (specify)',
                    '209': 'Review Correspondence',
                    '210': 'Review File',
                    '211': 'Review reports (specify)',
                    '212': 'Suit/Legal Review',
                    '213': 'Recorded Statement Insured',
                    '214': 'Recorded Statement Claimant',
                    '215': 'Recorded Statement Witness',
                    '216': 'R/S Other (Specify)',
                    '217': 'Prepare Diagram',
                    '218': 'Prepare Form (specify)',
                    '219': 'Subrogation Investigation',
                    '220': 'Fax (specify)',
                    '221': 'Miscellaneous Other (specify)',
                    '222': 'Record Search (specify)',
                    '223': 'Acknowledgement to Client',
                    '224': 'Adjuster Transmittal-closing report',
                    '225': 'Dictation of initial report',
                    '226': 'Dictation of status report',
                    '227': 'Transcription of initial report',
                    '228': 'Transcription of status report',
                    '229': 'TransCription of final report',
                    '230': 'Dictation of final report',
                    '231': 'Contact Letter',
                    '232': 'Prepare Photo Mounts',
                    '233': 'Prepare R/S ummary',
                    '234': 'Telephone Co-defendant',
                    '235': 'Auto Appraiser-assignment',
                    '236': 'Research MVR database',
                    '237': 'Identification Search via Internet',
                    '238': 'Telephone Conversation Client',
                    '239': 'Telephone Contact/Police-Report Search',
                    '240': 'Obtain Documentation',
                    '241': 'No Fault Handling',
                    '242': 'Review New Medical Bills/reports',
                    '243': 'Submit Bills for Verification',
                    '244': 'Submit Payment Request',
                    '245': 'No-fault Correspondence/Provider',
                    '246': 'No-fault Correspondence/Claimant',
                    '247': 'No-fault Status Report Dictation',
                    '248': 'Attempt Telephone Contact/Claimant',
                    '249': 'Attempt Telephone Contact/Witness',
                    '250': 'Attempt Telephone Contact/Insured',
                    '251': 'Exchange Settlement Check for Release',
                    '252': 'Recorded Statement',
                    '253': 'File Set-up/assignment',
                    '254': 'Request for IME',
                    '255': 'Left message for ?',
                    '256': 'E-mail request for P/R',
                    '257': 'Fee for copies of No-fault bills',
                    '258': 'No Fault Telephone -contact provider',
                    '259': 'Confirmed appt.',
                    '260': 'Directory assistance for number of ?',
                    '261': 'Faxed appraisal. request',
                    '262': 'Letter to attorney',
                    '263': 'Transcription (specify)',
                    '264': 'E-mailed acknowledgement to client',
                    '265': 'E-mail (specify)',
                    '266': 'Cell phone call to ?',
                    '267': 'Phone interview',
                    '268': 'Fax report to carrier',
                    '269': 'Received assignment'
                },
                "ExpenseCodes": {
                    '301': 'Telephone',
                    '302': 'Postage',
                    '303': 'Mileage',
                    '304': 'Fax',
                    '305': 'Parking',
                    '306': 'Tolls',
                    '307': 'Police Report',
                    '308': 'Med. Recs./Reports',
                    '309': 'Record Other (specify)',
                    '310': 'Film/Film Development',
                    '311': 'Overnight Mail/Courier',
                    '312': 'Appraisal',
                    '313': 'Photostat/copying',
                    '314': 'Video Cassette',
                    '315': 'Audio Cassette',
                    '316': 'Public Transportation',
                    '317': 'Meals',
                    '318': 'Other',
                    '319': 'Weekend Surcharge',
                    '320': 'Cell phone'
                }
            }
        }
    }
]

// Export
exports.data = data;
var DateUtils = require('./../../server/shared/dateUtils');

var data = [
    {
        "_id": "395",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1405994880000,
        "dueDate": DateUtils.daysFromNowInMillis(1),
        "summary": "PAUL: To: 'dmeelectrical@optimum.net' Mr. Madonia",
        "description": "This will serve to confirm our \nconversation of this date pertaining to the occurrence of 7.10.2014.\nWe had agreed that you are initially going to pursue the claim for damage through the insurance carrier for the automobile that struck the building. In the event the opposing carrier fails to complete the adjustment of the claim, you will then notify Guard and resume our involvement. in the interim, the claim will be assigned to a field representative to make contact with your office and perform an inspection of the damage. He will also take photographs and possibly discuss the occurrence with either you or your staff. We are also asking that you provide us with the following information:\n\f\nAny videos of the occurrence. *               \nPhotos of the damage. *               \nEstimates of the damage. *           \nInvoices for expenses incurred. *               \nA copy of the PD report. *             \nName of the responsible party insurance carrier. *                \nName and contact information of the responsible party. *           \nAny other information deemed necessary to support the claim. \nPlease send the requested documentation to my attention at your earliest opportunity. \n\nLet me  know if there are any questions. Thank you. Paul Prislupsky 072114",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "396",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1405994820000,
        "dueDate": 1405994820000,
        "summary": "Called Mr. Madonia",
        "description": "My name is Bill Breidenbach and I am the local adjuster for Guard \n Insurance assigned to your claim by Paul Prislupsky. I can be reached anytime at 516-524- 3982. I need to complete an initial inspection of the building damages and was wondering if Tuesday afternoon would be possible? Please advise.                        Regards,         \n\nBill 516-524-3982 ",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "397",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1405994820000,
        "dueDate": 1405994820000,
        "summary": "Email from Dennis Madonia",
        "description": "Dennis Madonia [dmeelectricalgoptimum.net]\n\nDear Bill: Attached please find the information you requested for the accident that occurred at my facility on 7-10-14. Video Estimates Copy of police report Insurance Information: \n\nMerve Destek-Mercury Insurance-Diane Bensinger                        \nTimothy Langion-Progressive \nInsurance-Kaitlyn Korb\n\nThis is also to confirm your initial inspection on Tuesday 7/22, be advised I will be out of the office but my assistant, Eleonora Regan (516-903-8387)wi II be able to help you. Thank you for  your help.\n\nBest regards, Dennis Madonia",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "398",
        "claimId": "389",
        "tag": [
            "visit"
        ],
        "entryDate": 1406077200000,
        "dueDate": 1406077200000 + (DateUtils.MILLIS_IN_A_DAY * 3),
        "summary": "TRAVELED to insured in West Babylon and met with Eleanor",
        "description": "TRAVELED to insured in West Babylon and met with Eleanor who simply advised Dennis is \nhandling this. She did give me a glass of water.\nFrom the estimates received I completed my inspection finding several errors. Photos taken of \nthe entire area.\nNotice Pet Animal Hospital across the street had several cameras outside. Spoke with 2\nfemale employees who advised they have video but did not know where to send it. I raised \nmy hand. After waiting I was told they installed new computers on Sunday and don't know \nhow to retrieve the video. Contact was made with the Surveillance installer and 1 spoke with \nhim emphasizing the importance of making a copy of this accident which occurred 071014 @ \n10:23 pm. He will be there tomorrow.\nThe employees advised that the girl driving the car that she got two days earlier blew the stop \nsign. The said this brake lights do not go on at all..",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "399",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1406163600000,
        "dueDate": 1406163600000,
        "summary": "CALLED Mercury Ins. Adj Diane Bensinger",
        "description": "CALLED Mercury Ins. Adj Diane Bensinger 908-243-1800: x60029 INDEX POLICY \n310101100038713 CLAIM # 20140045003405-63 \nSent field appraiser, received estimates and accepting Liability. PD COVERAGE IS 50,000.\n\nBoth Veh are a Total Loss   OV 5600 + Rental. Leaving about 44k covg available.\nDiane says insured estimates were sent direct to the field adjuster who inspected and has yet to provide a report. I asked that Diane call me when she gets the report to discuss. She asked it we would be subrogating and I said Guard was put on notice by the insured and are monitoring as all ests sent to Mercury the responsible carrier.\n\nNEED: Yaphank PR, Video from Pet Shop, Follow up with Mercury Ins. Adj Diane Bensinger 908-243-1800 x60029 on Thursday to see if Field Adj Report recd.\nLady from Pet shop called saying they have a thumb drive but the computer guy wants a gift cert for dinner at a local restaurant.",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "400",
        "claimId": "389",
        "tag": [
            "visit"
        ],
        "entryDate": 1406336400000,
        "dueDate": 1406336400000 + (DateUtils.MILLIS_IN_A_DAY * 3),
        "summary": "TRAVEL to Pet Shop and pick up Video / $10.00",
        "description": "TRAVEL to Pet Shop and pick up Video / $10.00",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "404",
        "claimId": "389",
        "tag": [
            "visit"
        ],
        "entryDate": 1406339100000,
        "dueDate": 1406339100000 + (DateUtils.MILLIS_IN_A_DAY * 4),
        "summary": "TRAVEL to SUFFOLK Police Headquarters",
        "description": "TRAVEL to SUFFOLK Police Headquarters and paid $1.00. Report not available as yet but will\nbe mailed when comes in .",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "405",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1406682000000,
        "dueDate": 1406682000000 + (DateUtils.MILLIS_IN_A_DAY * 1),
        "summary": "Watch video",
        "description": "Watch video which shows vehicle traveling through stop sign without stopping and causing this accident. COPY MADE TO DISC;",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "406",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1406685600000,
        "dueDate": 1406685600000,
        "summary": "Email from Diane",
        "description": "DIANE: From: Diane Bensinger [mailto:DBetiryinsu ance.cornj Sent: Tue \n7/29/2014 3:50 PM To: BBreidenbach Subject: DME electrical\nHi Bill Below is the breakdown I received from Eagle Electrical work-2100 Sign- 5214 Porch-11300 Landscaping-3203 Total= 21817\n\nI do have to have it reviewed by our property dept as we used a vendor, but it seems inline. \nPlease let me know if anything was missed If you have any questions/concerns, please do not hesitate to give me a call or reply to this email. \n\nSincerely, \nDiane Bensinger \n\nClaims Specialist II \nNew Jersey Claims Department [cid:imgge001.01CFAB44.098BB3B0] P.O. Box 5919 \nBridgewater, NJ 08807-5919 (800) 987-2032, ext. 60029 4 (877) 397-5863 (fax)",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "407",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1406772000000,
        "dueDate": 1406772000000,
        "summary": "CALLED Diane",
        "description": "CALLED Diane, she does not have PR but would like a copy if I get it. No word from her PD \nDept. as yet.",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "412",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1406773200000,
        "dueDate": 1406773200000 + (DateUtils.MILLIS_IN_A_DAY * 3),
        "summary": "INDEX First Precinct would respond... 854-8100.",
        "description": "INDEX First Precinct would respond... 854-8100.\nCALLED and verified a glitch in the system as the officer has the report but does not see it in \nthe system. I asked if he could either get a copy to me or to Suff Police Headquarters so I can \nget it there. He is checking.... I hope he will forward it direct to me. Nope.... He will get it into \nthe system today...\n",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "413",
        "claimId": "389",
        "tag": [
            "photos"
        ],
        "entryDate": 1406774400000,
        "dueDate": 1406774400000,
        "summary": "MOUNTED PHOTOS",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "414",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": DateUtils.startOfToday().getTime(),
        "dueDate": DateUtils.daysFromNowInMillis(2),
        "summary": "NEED: PR to be mailed by Suff Police Head",
        "description": "NEED: PR to be mailed by Suff Police Head; Discuss with Pau! if I should monitor settlement with Mercury?\nElectra from Animal Hosp. calls LM 376-1133",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "415",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1406945700000,
        "dueDate": 1406945700000,
        "summary": "CALLED Electra",
        "dueDate": DateUtils.daysFromNowInMillis(-5),
        "description": "CALLED Electra and thanked her for doing the right thing. I advised that Mercury is accepting \n100%. Good.",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "416",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1407291300000,
        "dueDate": 1407291300000,
        "summary": "DROPPED Sun/ DVD to office for Chrissy to mail.",
        "description": "",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "417",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1408579200000,
        "dueDate": 1408579200000,
        "summary": "Called Diane",
        "description": "ME: Diane, Just a quick follow up to see if your property dept. approved settlement and if an offer has been extended?        Please advise.        Bill  516-524-3982",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "428",
        "claimId": "389",
        "tag": [
            "visit"
        ],
        "entryDate": 1407888000000,
        "dueDate": 1407888000000,
        "summary": "TRAVELED to Suff PD Head on another file and picked up this report.",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "418",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1407369600000,
        "dueDate": 1407369600000,
        "summary": "Called Diane",
        "description": "ME: Diane, Just a quick follow up to see if your property dept. approved settlement and if an offer has been extended?        Please advise.        Bill  516-524-3982",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "421",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1407369600000,
        "dueDate": 1407369600000,
        "summary": "Email from Diane",
        "description": "DIANE: Hi Bill Just got it back-amount approved is $21817.00 My understanding is the payment would be made to the realty company-correct?\nIf you have any questions/concerns, please do not hesitate to give me a call or reply to this email. \n\nSincerely, Diane Bensinger",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "423",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1407460500000,
        "dueDate": 1407460500000,
        "summary": "Emailed Diane",
        "description": "ME: Diane, My notes indicate that the total claim amount submitted is 23,117.          Has an offer been made to Dennis Madonia of 974 Little East Neck LLC? The office manager Eleonora Regan can be reached at 516-903-8387. Please confirm whether or not your approved amount of $21,817.00 has been accepted.          \n\nThank you         \nBill",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "424",
        "claimId": "389",
        "tag": [
            "other"
        ],
        "entryDate": 1407464100000,
        "dueDate": 1407464100000,
        "summary": "Email from Diane",
        "description": "DIANE: From: Diane Bensinger {mailto:DBensingerOt mercuryinsurance.comi Sent: Thu \n8/7/2014 3:00 PM To: Dennis Madonia Cc: BBreidenbach Subject: RE: Claim No. \n14009500340563 \n\nHello\nThe painting est was missed-initial check will be for first amount as it was already in progress, and a supplementary payment will be made for the painting est.\nIf you have any questions/concerns, please do not hesitate to give me a call or reply to this \n\nemail. Sincerely,\n",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "425",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1407464700000,
        "dueDate": 1407464700000,
        "summary": "Called Paul",
        "description": "ME: Paul, Mercury has compensated our insured in full. Our Initial Report was sent \n7/30/14. Unless you need a Final, I will close my file with no further reports or billing.  Let\nme know.      Bill",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "429",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1407974400000,
        "dueDate": 1407974400000,
        "summary": "Called Paul",
        "description": "ME: PAUL, YESTERDAY I WENT TO SUFFOLK POLICE HEADQUARTERS ON ANOTHER FILE AND PICKED UP THE ATTACHED PR FOR THIS ONE. AS MERCURY INS. HAS PAID OUR INSURED DIRECT, PLEASE CONFIRM OUR FILE CAN NOW BE \nCLOSED AND WHETHER OR NOT YOU NEED A FINAL REPORT.                 \n\nTHANKS,        \nBILL\n",
        "attachments": [],
        "state": "Complete"
    },
    {
        "_id": "431",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1407974400000,
        "dueDate": 1407974400000,
        "summary": "CALLED insured Eleonora and learned they have yet to receive any checks from Mercury.",
        "description": "",
        "attachments": [],
        "state": "ToDo"
    },
    {
        "_id": "432",
        "claimId": "389",
        "tag": [
            "phone"
        ],
        "entryDate": 1408156200000,
        "dueDate": 1408156200000,
        "summary": "Called Diane",
        "description": "ME: Diane, Good morning. I just spoke with Eleonora Regan (516)903-8387 of DME \nElectrical and was told they have not received either or the two checks you had issued.\n\nPlease confirm the mailing address and let me know.        \n\nThanks,      \nBill 516-524-3982",
        "attachments": [],
        "state": "ToDo"
    }
];

exports.data = data;
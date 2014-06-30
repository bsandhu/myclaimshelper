function Claim() {
    this.entryDate;
    this.dueDate;
    this.updateDate;

    this.summary;
    this.description;
    this.insured;
    this.claimant;
    this.location;
    this.insuranceCompany;
    this.insranceCoFileNum;
}

function ClaimEntry() {
    this.claimId;

    this.entryDate;
    this.dueDate;
    this.updateDate;

    this.summary;
    this.description;
}

exports.Claim = Claim;
exports.ClaimEntry = ClaimEntry;
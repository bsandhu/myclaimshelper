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
    this.insuranceCompanyFileNum;

    // Array of 'Task' objects
    this.tasks = [];
}

function Task() {
    this.entryDate;
    this.dueDate;
    this.updateDate;

    this.summary;
    this.description;
}

exports.Claim = Claim;
exports.Task = Task;
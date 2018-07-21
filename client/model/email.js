define([], function () {

    function Email() {
        this.from = undefined;
        this.to = undefined;
        this.cc = undefined;
        this.subject = undefined;
        this.body = undefined;

        // [{name: '', type: ''}]
        this.attachments = [];
    }

    return Email;
});

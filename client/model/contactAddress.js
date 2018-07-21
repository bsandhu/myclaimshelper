define([], function () {

    function ContactAddress() {
        this.type = 'Work';
        this.street = '';
        this.city = '';
        this.state = '---';
        this.zip = '';
    }

    return ContactAddress;
});
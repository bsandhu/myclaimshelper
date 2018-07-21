define([], function () {

    function FileMetadata() {
        this.id = undefined;
        this.name = undefined;
        this.size = undefined;
        this.lastModifiedDate = undefined;

        this.owner = undefined;
        this.group = undefined;

        // No 'ingroups' for now - more work to pull this in on the incoming emails
        // this.ingroups = undefined;
    }

    return FileMetadata;
});
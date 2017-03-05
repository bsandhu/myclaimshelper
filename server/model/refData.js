// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function RefData(){
        this._id = undefined;

        this.type = undefined;
        this.text = undefined;
        this.owner = undefined;
        this.group = undefined;
    }

    return RefData;
});

// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Form() {
        this._id = undefined;
        this.type = undefined;
        this.claimId = undefined;
        this.creationDate = undefined;
        this.updateDate = undefined;
        this.owner = undefined;
        this.group = undefined;

        // Setup data placeholder attributes
        let keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                    'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az']
        let formData = {};
        for(let key of keys) {
            formData[key] = '';
        }
        this.data = formData;
    }

    return Form;
});

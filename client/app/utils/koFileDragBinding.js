define(['jquery', 'knockout'],

    function ($, ko) {
        'use strict';

        ko.bindingHandlers.fileDrag = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var binding = ko.utils.unwrapObservable(valueAccessor());

                // Setup UI elements
                var outerContainer = $('<div class="fileDropBox"></div>');
                outerContainer.bind('dragenter', dragenter);
                outerContainer.bind('dragover', dragover);
                outerContainer.bind('drop', drop);

                var manualUpload = $('<input type="file" class="topMargin1PC leftMargin1PC" multiple>');
                manualUpload.change(handleFilesSelection);
                outerContainer.append(manualUpload);

                outerContainer.append('<div class="backgroundLabel">Drag n drop here</div>');
                $(element).append(outerContainer);

                function dragenter(e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                function dragover(e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                function drop(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFilesSelection(e);
                }

                function handleFilesSelection(ev) {
                    var filesSrc = ev.originalEvent.dataTransfer || ev.currentTarget;
                    var files = filesSrc.files;
                    if (!files.length) {
                        outerContainer.append('No files selected');
                        return;
                    }

                    var imgContainer = $('<div></div>');
                    for (var i = 0; i < files.length; i++) {
                        imgContainer.append(createThumbnail(files[i]));

                        var imgMsg = $('<div class="inline" style="font-size: small"></div>');
                        imgMsg.append(files[i].name);
                        uploadFile(files[i])
                            .done(function(msg){
                                imgMsg.append('...' + msg);
                            });
                        imgContainer.append(imgMsg);
                    }
                    outerContainer.append(imgContainer);
                }

                function createThumbnail(file) {
                    var imgDiv = $('<div class="inline"></div>');
                    var img = $('<img>');
                    img.attr('src', window.URL.createObjectURL(file));
                    img.attr('height', 30);
                    img.bind('onload', function (e) {
                        window.URL.revokeObjectURL(this.src);
                    });
                    imgDiv.append(img);
                    return imgDiv;
                }

                function uploadFile(file) {
                    var uri = '/upload';
                    var xhr = new XMLHttpRequest();
                    var fd = new FormData();

                    xhr.open('POST', uri, true);
                    var defer = $.Deferred();

                    // Handle response.
                    xhr.onreadystatechange = function () {
                        // readyState 4 : Done
                        // status 200   : OK
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            defer.resolve(xhr.responseText);
                        } else if (xhr.status === 500) {
                            defer.reject('Error ' + xhr.responseText);
                        }
                    };
                    fd.append('uploadedFile', file);

                    // Initiate a multipart/form-data upload
                    xhr.send(fd);
                    return defer;
                }
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No op
            }
        };
    }
);
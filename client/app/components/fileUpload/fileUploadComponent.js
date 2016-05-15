define(['knockout', 'KOMap', 'jquery',
        'amplify', 'app/utils/events',
        'text!app/components/fileUpload/fileUploadComponent.tmpl.html'],
    function (ko, KOMap, $, amplify, Events, viewHtml) {
        'use strict';

        function FileUploadComponentVM(params) {
            console.log('Init File upload Widget');

            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;
            this.showUploadingSpinner = ko.observable(false);
        }

        FileUploadComponentVM.prototype.dragenter = function (data, e) {
            e.stopPropagation();
            e.preventDefault();
        };

        FileUploadComponentVM.prototype.dragover = function (data, e) {
            e.stopPropagation();
            e.preventDefault();
        };

        FileUploadComponentVM.prototype.drop = function (data, e) {
            e.stopPropagation();
            e.preventDefault();
            this.handleFilesDrop(e);
        };

        FileUploadComponentVM.prototype.handleFilesSelection = function (ev) {
            console.log("Handle files selection");
            var files = document.getElementById('fileUpload-input').files;
            this._upload(files);
        }

        FileUploadComponentVM.prototype.handleFilesDrop = function (ev) {
            var filesSrc = ev.originalEvent.dataTransfer || ev.currentTarget;
            var files = filesSrc.files;
            this._upload(files);
        }

        FileUploadComponentVM.prototype._upload = function (files) {
            try {
                console.log("Uploading " + files);
                var _this = this;

                if (!files.length) {
                    console.log('No files selected');
                    return;
                }

                for (var i = 0; i < files.length; i++) {
                    this.showUploadingSpinner(true);
                    this.uploadFile(files[i])
                        .done(function (fileMetadata) {
                            var metaObj = JSON.parse(fileMetadata);
                            console.log(metaObj);
                            _this.claimEntry().attachments.push(KOMap.fromJS(metaObj));
                            _this.showUploadingSpinner(false);
                            setTimeout(function clearFileName() {
                                $('#fileUpload-input').val('')
                            }, 500);
                        })
                        .fail(function (msg) {
                            amplify.publish(Events.FAILURE_NOTIFICATION,
                                {msg: "<strong>Error </strong> while uploading files. Please retry." +
                                    "<br>Techinal details: " + msg})
                        });
                }
            } catch (e) {
                amplify.publish(Events.FAILURE_NOTIFICATION,
                    {msg: "<strong>Error</strong> while processing your request. Please retry." +
                        "<br>Techinal details: " + e})
            }
        };

        FileUploadComponentVM.prototype.createThumbnail = function (file) {
            var imgDiv = $('<div class="inline"></div>');
            var img = $('<img>');
            img.attr('src', window.URL.createObjectURL(file));
            img.attr('height', 30);
            img.bind('onload', function (e) {
                window.URL.revokeObjectURL(this.src);
            });
            imgDiv.append(img);
            return imgDiv;
        };

        FileUploadComponentVM.prototype.uploadFile = function (file) {
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
        };

        return {viewModel: FileUploadComponentVM, template: viewHtml};
    });
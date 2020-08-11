// Copyright 2020 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Setting from "../Setting";
import * as MemberBackend from "../backend/MemberBackend";
import * as FileBackend from "../backend/FileBackend";

require('inline-attachment/src/inline-attachment')
require('inline-attachment/src/codemirror-4.inline-attachment');

export function attachEditor(editor) {
  /* eslint-disable */inlineAttachment.editors.codemirror4.attach(editor, {allowedTypes: ["*"]});
}

// upload file through markdown editor
export function uploadMdFile() {
  const stdImageExt = ["png", "jpg", "gif", "jpeg"]
  /* eslint-disable */inlineAttachment.prototype.onFileUploadResponse = function(fileName, fileUrl) {
    let newValue = this.settings.urlText.replace('file', fileName);
    let text = this.editor.getValue().replace(this.lastValue, newValue).replace('{filename}', fileUrl);
    let fileIndex = fileName.lastIndexOf(".");
    let ext = fileName.substr(fileIndex+1);
    let index = stdImageExt.indexOf(ext);
    if(index < 0) {
      text = text.substring(1);
    }
    this.editor.setValue(text);
    this.settings.onFileUploaded.call(this, fileName);
  }

  let newClient, url, timestamp, path, filePath, fileName, size, originalFileName, uploadStatus = false;
  newClient = Setting.OSSClient;
  path = Setting.OSSFileUrl;
  url = Setting.OSSUrl;
  timestamp = Date.parse(new Date());

  /* eslint-disable */inlineAttachment.prototype.uploadFile = function(file) {
    if (file.size > 6291456) {
      Setting.showMessage("error", "File size exceeds 2MB");
      return;
    }

    let fileType = Setting.getFileType(file.name);
    originalFileName = file.name
    fileName = timestamp + '.' + fileType.ext
    size = file.size

    let mdUrl = `${url}/${fileType.fileType}/${fileName}`;
    filePath = `${path}/${fileType.fileType}/${fileName}`; //path
    newClient.multipartUpload(`${filePath}`, file).then(res => {
      console.log('upload success');
      this.onFileUploadResponse(file.name, encodeURI(mdUrl));
      uploadStatus = true
      FileBackend.addFileRecord({fileName: originalFileName, filePath: filePath, fileUrl: mdUrl, size: size})
    }).catch(error => Setting.showMessage("error", `Adding image failed：${error}`));
  }
}

// upload file through files page
export function uploadFile(file) {
  if (file.size > 6291456) {
    Setting.showMessage("error", "File size exceeds 2MB");
    return;
  }

  let newClient, url, timestamp, path, fileName;
  let fileType = Setting.getFileType(file.name);
  newClient = Setting.OSSClient;
  path = Setting.OSSFileUrl;
  url = Setting.OSSUrl;
  timestamp = Date.parse(new Date());
  fileName = timestamp + '.' + fileType.ext;

  let fileUrl = `${url}/${fileType.fileType}/${fileName}`;
  let filePath = `${path}/${fileType.fileType}/${fileName}`; //path
  newClient.multipartUpload(`${filePath}`, file).then(res => {
    console.log('upload success');
  }).catch(error => Setting.showMessage("error", `Add file failed：${error}`));

  return FileBackend.addFileRecord({fileName: file.name, filePath: filePath, fileUrl: fileUrl, size: file.size})
}

// upload avatar
export function uploadAvatar(file, redirectUrl) {
  let fileType = Setting.getFileType(file.name);
  let newClient, url, timestamp, path, fileName;
  newClient = Setting.OSSClient;
  path = Setting.OSSFileUrl;
  url = Setting.OSSUrl;
  timestamp = Date.parse(new Date());
  fileName = timestamp + '.' + fileType.ext;
  if (file.size > 2097152) {
    Setting.showMessage("error", "File size exceeds 2MB");
    return;
  }

  let filePath = `${path}/avatar/${fileName}`
  newClient.multipartUpload(`${filePath}`, file).then(res => {
    console.log('upload success');
    MemberBackend.updateMemberAvatar(`${url}/avatar/${fileName}`).then(() => window.location.href=`${redirectUrl}?success=true`);
  }).catch(error => Setting.showMessage("error", `Adding image failed：${error}`));
}

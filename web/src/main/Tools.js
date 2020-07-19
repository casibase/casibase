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

require('inline-attachment/src/inline-attachment')
require('inline-attachment/src/codemirror-4.inline-attachment');

export function attachEditor(editor) {
  /* eslint-disable */inlineAttachment.editors.codemirror4.attach(editor)
}

export function uploadPic() {
  /* eslint-disable */inlineAttachment.prototype.onFileUploadResponse = function(fileName, fileUrl) {
    let newValue = this.settings.urlText.replace('file', fileName);
    let text = this.editor.getValue().replace(this.lastValue, newValue).replace('{filename}', fileUrl);
    this.editor.setValue(text);
    this.settings.onFileUploaded.call(this, fileName);
  }
  let newClient, url, timestamp, filePath
  newClient = Setting.OSSClient
  filePath = Setting.OSSFileUrl
  url = Setting.OSSUrl
  timestamp = Date.parse(new Date());
  /* eslint-disable */inlineAttachment.prototype.uploadFile = function(file) {
    if (file.size > 2097152) {
      Setting.showMessage("error", "File size exceeds 2MB")
      return
    }
    let mdUrl = `${url}/${timestamp+file.name}`
    let path = `${filePath}/${timestamp+file.name}`
    newClient.multipartUpload(`${path}`, file).then(res => {
      console.log('upload success');
      this.onFileUploadResponse(file.name, encodeURI(mdUrl))
    }).catch(error => Setting.showMessage("error", `Adding pic failed：${error}`))
  }
}

export function uploadAvatar(file, redirectUrl) {
  let newClient, url, timestamp, filePath
  newClient = Setting.OSSClient
  filePath = Setting.OSSFileUrl
  url = Setting.OSSUrl
  timestamp = Date.parse(new Date());
  if (file.size > 2097152) {
    Setting.showMessage("error", "File size exceeds 2MB")
    return
  }
  let path = `${filePath}/${timestamp+file.name}`
  newClient.multipartUpload(`${path}`, file).then(res => {
    console.log('upload success');
    MemberBackend.updateMemberAvatar(`${url}/${timestamp+file.name}`).then(() => window.location.href=`${redirectUrl}?success=true`)
  }).catch(error => Setting.showMessage("error", `Adding pic failed：${error}`))
}

// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import * as Conf from "../Conf";
import * as FileBackend from "../backend/FileBackend";
import i18next from "i18next";

require("inline-attachment/src/inline-attachment");
require("inline-attachment/src/codemirror-4.inline-attachment");

export function attachEditor(editor) {
  /* eslint-disable */
  inlineAttachment.editors.codemirror4.attach(editor, {
    allowedTypes: ["*"],
  });
}

// upload file through markdown editor
export function uploadMdFile(addMsg) {
  const stdImageExt = ["png", "jpg", "gif", "jpeg"];
  /* eslint-disable */
  inlineAttachment.prototype.onFileUploadResponse = function (fileName, fileUrl) {
    let newValue = this.settings.urlText.replace("file", fileName);
    let fileType = Setting.getFileType(fileName); // find the ext of the file, choosing []() or ![]()
    //let fileIndex = fileName.lastIndexOf(".");
    //let ext = fileName.substr(fileIndex+1);
    //let index = stdImageExt.indexOf(ext);
    if (fileType.fileType === "file") {
      newValue = newValue.substring(1);
    }
    newValue = newValue.replace("{filename}", fileUrl);
    let text = this.editor.getValue().replace(this.lastValue, newValue);
    this.editor.setValue(text);
    this.settings.onFileUploaded.call(this, fileName);
  };

  let uploadStatus = false;

  /* eslint-disable */
  inlineAttachment.prototype.uploadFile = function (file) {
    if (file.size > 1024 * 1024 * Conf.AttachmentSizeLimitInMb) {
      alert(`File size cannot exceed ${Conf.AttachmentSizeLimitInMb}MB`);
      return;
    }

    let fileType = Setting.getFileType(file.name);

    let reader = new FileReader();
    reader.onload = (e) => {
      FileBackend.uploadTopicPic(e.target.result, fileType.ext).then((res) => {
        if (res.status === "ok") {
          this.uploadStatus = true;
          this.onFileUploadResponse(res.msg, encodeURI(res.data));
        } else alert("oss error, can't upload picture now.");
      });
    };
    reader.readAsDataURL(file);
  };
}

// upload file through files page
export function uploadFile(file) {
  if (file.size > 1024 * 1024 * Conf.AttachmentSizeLimitInMb) {
    alert(`File size cannot exceed ${Conf.AttachmentSizeLimitInMb}MB`);
    return;
  }

  let fileType = Setting.getFileType(file.name);
  let reader = new FileReader();
  reader.onload = (e) => {
    FileBackend.uploadFile(e.target.result, file.name, fileType.ext).then((res) => {
      if (res.status === "ok") {
        FileBackend.addFileRecord({
          fileName: file.name,
          filePath: "file/" + file.name,
          fileUrl: res.data,
          size: file.size,
        });
        window.location.href = "/i";
      } else alert("Uploading failed.");
    });
  };
  reader.readAsDataURL(file);
}

export function myUploadFn(param) {
  const errorFn = (response) => {
    // call the erroFn when the upload process failed.
    param.error({
      msg: i18next.t("node:Adding image failed"),
    });
  };
  const successFn = (mdUrl) => {
    param.success({
      url: mdUrl,
      meta: {
        id: fileName,
        title: originalFileName,
        alt: originalFileName,
      },
    });
  };

  let timestamp,
    fileName,
    size,
    originalFileName,
    uploadStatus = false;

  timestamp = Date.parse(new Date());

  let fileType = Setting.getFileType(param.file.name);
  size = param.file.size;
  fileName = timestamp + "." + fileType.ext;

  let reader = new FileReader();
  reader.onload = (e) => {
    FileBackend.uploadFile(e.target.result, timestamp, fileType.ext).then((res) => {
      if (res.status === "ok") {
        this.uploadStatus = true;
        successFn(res.data);
      } else {
        errorFn();
      }
    });
  };
  reader.readAsDataURL(param.file);
}

/**
 * convert number to coin.
 * @param {number} score
 */
export function scoreConverter(score) {
  const rate = 100;
  const goldCount = Math.floor(Math.floor(score / rate) / rate);
  const silverCount = Math.floor(score / rate) % rate;
  const bronzeCount = score % rate;
  return { goldCount, silverCount, bronzeCount };
}

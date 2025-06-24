// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

import React, {useState} from "react";
import {Button, Col, Image, Input, Row, Space, Upload} from "antd";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as FileBackend from "./backend/FileBackend";

const StoreAvatarUploader = (props) => {
  const {store, onUpdate, onUploadComplete} = props;
  const [loading, setLoading] = useState(false);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async({file}) => {
    setLoading(true);

    const fileExt = file.name.split(".").pop();
    const filename = `${store.owner}_${store.name}_${Date.now()}.${fileExt}`;

    const base64Data = await fileToBase64(file);
    FileBackend.uploadFile(base64Data, filename, file.type)
      .then((res) => {
        if (res.status === "ok") {
          // Backend now returns URL directly for avatar uploads
          const newAvatarUrl = res.data;

          if (typeof newAvatarUrl !== "string" || newAvatarUrl === "") {
            Setting.showMessage("error", i18next.t("general:Failed to get"));
            return;
          }

          // Add timestamp to avoid cache issues
          const finalUrl = `${newAvatarUrl}?t=${Date.now()}`;
          onUpdate(finalUrl);
          if (onUploadComplete) {
            onUploadComplete(finalUrl);
          }
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(err => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <Row>
        <Col span={24}>
          <Input value={store.avatar || ""} onChange={e => onUpdate(e.target.value)} />
        </Col>
      </Row>

      <Row style={{marginTop: "10px"}}>
        <Col span={24}>
          <Space direction="vertical" align="center">
            {
              store.avatar && (
                <Image src={store.avatar} alt="avatar" width={150} height={150} style={{objectFit: "cover"}}
                  preview={{
                    mask: i18next.t("general:Preview"),
                  }}
                />
              )
            }

            <Upload name="file" accept="image/*" showUploadList={false} customRequest={handleUpload}>
              <Button type="primary" loading={loading}>
                {i18next.t("general:Upload")}
              </Button>
            </Upload>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default StoreAvatarUploader;

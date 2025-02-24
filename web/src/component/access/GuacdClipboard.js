// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import React, {useEffect, useState} from "react";
import {Form, Input, Modal} from "antd";

const GuacdClipboard = ({visible, clipboardText, handleOk, handleCancel}) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      "clipboard": clipboardText,
    });
  }, [visible]);

  return (
    <div>
      <Modal
        title="Clipboard"
        maskClosable={false}
        open={visible}
        onOk={() => {
          form.validateFields()
            .then(values => {
              setConfirmLoading(true);
              try {
                handleOk(values["clipboard"]);
              } finally {
                setConfirmLoading(false);
              }
            })
            .catch(info => {

            });
        }}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <Form form={form}>
          <Form.Item name="clipboard">
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GuacdClipboard;

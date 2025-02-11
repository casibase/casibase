// Copyright 2023 The casbin Authors. All Rights Reserved.
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

import {Button, Popconfirm} from "antd";
import i18next from "i18next";
import React from "react";

export const PopconfirmModal = (props) => {
  const text = props.text ? props.text : i18next.t("general:Delete");
  const size = props.size ? props.size : "middle";
  return (
    <Popconfirm
      title={props.title}
      onConfirm={props.onConfirm}
      disabled={props.disabled}
      okText={i18next.t("general:OK")}
      cancelText={i18next.t("general:Cancel")}
    >
      <Button style={{...props.style}} size={size} disabled={props.disabled || props.fakeDisabled} type="primary" danger>{text}</Button>
    </Popconfirm>
  );
};

export default PopconfirmModal;

// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import i18next from "i18next";
import {Button, Input, Modal} from "antd";
import {LockOutlined, UserOutlined} from "@ant-design/icons";
import * as Setting from "../Setting";

const ConnectModal = (props) => {
  const text = props.text ? props.text : i18next.t("node:Connect");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const owner = props.owner;
  const name = props.name;
  const category = props.category;
  const node = props.node || {};

  const handleUsernameAndPassword = (username, password) => {
    setUsername(username || "");
    if (username && password) {
      handleOk();
    } else {
      if (username) {
        setInputDisabled(true);
      }
      setIsModalOpen(true);
    }
  };

  const showModal = () => {
    initStatus();
    handleUsernameAndPassword(node.remoteUsername, node.remotePassword);
    // handleOk();
    // getNode(owner, name)
    //   .then(res => {
    //     if (res.status === "ok") {
    //       setUsername(res.data.username || "");
    //       if (res.data.username && res.data.password) {
    //         handleOk();
    //       } else {
    //         if (res.data.username) {
    //           setInputDisabled(true);
    //         }
    //         setIsModalOpen(true);
    //       }
    //     }
    //   })
    //   .catch(error => {
    //     setIsModalOpen(true);
    //   });
  };

  const handleOk = () => {
    setIsModalOpen(false);
    if (category === "Node") {
      const link = (username === "" || password === "") ? `access/${owner}/${name}` : `access/${owner}/${name}?username=${username}&password=${password}`;
      Setting.openLink(link);
    } else if (category === "Database") {
      const link = "databases";
      Setting.openLink(link);
    } else {
      Setting.showMessage("error", `Unknown category: ${category}`);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const initStatus = () => {
    setInputDisabled(false);
    setIsModalOpen(false);
    setUsername("");
    setPassword("");
  };
  return (
    <>
      <Button
        disabled={props.disabled}
        type="primary"
        onClick={showModal}
        style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
      >
        {text}
      </Button>
      <Modal
        title="Connect"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={420}
        footer={
          <Button
            key="login"
            type="primary"
            onClick={handleOk}
            disabled={!username || !password}
            size="large"
            block
          >
            login
          </Button>
        }
      >
        <Input
          size="large"
          style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder={i18next.t("general:Username")}
          value={username}
          disabled={inputDisabled}
          onChange={e => {
            setUsername(e.target.value);
          }}
        />
        <Input.Password
          size="large"
          prefix={<LockOutlined className="site-form-item-icon" />}
          style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
          placeholder={i18next.t("general:Password")}
          value={password}
          onChange={e => {
            setPassword(e.target.value);
          }}
        />
      </Modal>
    </>
  );
};

export default ConnectModal;

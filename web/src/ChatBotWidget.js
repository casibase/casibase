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

import React, {useEffect, useState} from "react";
import {CloseOutlined, LinkOutlined, MessageOutlined} from "@ant-design/icons";
import {FloatButton} from "antd";

const ChatBotWidget = () => {
  const [showChat, setShowChat] = useState(false);
  const [height, setHeight] = useState(window.innerHeight * 0.7 + "px");
  const [width, setWidth] = useState(window.innerWidth / 4 + "px");
  const [icon, setIcon] = useState(true);
  const chatUrl = "https://demo.casibase.com";

  const toggleChat = () => {
    setIcon(!icon);
    setShowChat(!showChat);
  };

  const navigateToExternalSite = () => window.open(chatUrl, "_blank");

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight * 0.7 + "px");
      setWidth(window.innerWidth / 4 + "px");
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: "80px",
      right: "10px",
      alignItems: "center",
      zIndex: 1001,
    }}>
      <FloatButton onClick={toggleChat} style={{bottom: "20px"}} type="primary" icon={icon ? <MessageOutlined /> : <CloseOutlined />} />
      {showChat && (
        <>
          <iframe src={chatUrl} width={width} height={height} style={{
            border: "none",
            marginBottom: "10px",
            margin: "0 auto",
            boxShadow: "0 0 50px grey",
            borderRadius: "5px",
          }}></iframe>
          <FloatButton onClick={navigateToExternalSite} tooltip={<div>{chatUrl}</div>} style={{bottom: "20px", right: "80px"}} type="primary" icon={<LinkOutlined />} />
        </>
      )}
    </div>
  );
};

export default ChatBotWidget;

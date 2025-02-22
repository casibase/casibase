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

import React, {useEffect, useRef, useState} from "react";
import {Affix, Button, Dropdown, Menu, Modal, message} from "antd";
import {CloseCircleOutlined, CopyOutlined, ExpandOutlined, WindowsOutlined} from "@ant-design/icons";
import Guacamole from "guacamole-common-js";
import {debounce, toggleFullscreen} from "./Util";
import * as Setting from "../../Setting";
import qs from "qs";
import {Base64} from "js-base64";
import Draggable from "react-draggable";
import GuacdClipboard from "./GuacdClipboard";
import * as SessionBackend from "../../backend/SessionBackend";

const STATE_IDLE = 0;
const STATE_CONNECTING = 1;
const STATE_WAITING = 2;
const STATE_CONNECTED = 3;
const STATE_DISCONNECTING = 4;
const STATE_DISCONNECTED = 5;

const GuacdPage = (props) => {
  const {nodeId, activeKey, addClient, closePane, username, password} = props;

  const [box, setBox] = useState({width: 0, height: 0});
  const [guacd, setGuacd] = useState({});
  const [session, setSession] = useState({});
  const [clipboardText, setClipboardText] = useState("");
  const [isFullScreened, setIsFullScreened] = useState(false);
  const [clipboardVisible, setClipboardVisible] = useState(false);
  const ref = useRef(null);
  const containerRef = useRef(null);

  const handleAddClient = (client, sink) => {
    if (addClient) {
      addClient(client);
    }

    setGuacd({client, sink});
  };

  useEffect(() => {
    if (containerRef) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setBox({width, height});
    }
  }, []);

  useEffect(() => {
    if (!activeKey) {
      document.title = nodeId.split("/")[1];
    }
    if (box && box.width && box.height && !guacd.client) {
      addNodeTunnel();
    }
  }, [nodeId, box]);

  const addNodeTunnel = () => {
    SessionBackend.addNodeTunnel(nodeId).then((res) => {
      if (res.status === "ok") {
        const session = res.data;
        setSession(session);
        renderDisplay(`${session.owner}/${session.name}`, session.protocol, box.width, box.height);
      } else {
        Setting.showMessage("error", "Failed to connect: " + res.msg);
      }
    });
  };

  const renderDisplay = (sessionId, protocol, width, height) => {
    const wsEndpoint = Setting.ServerUrl.replace("http://", "ws://");
    const wsUrl = `${wsEndpoint}/api/get-node-tunnel`;
    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
    const client = new Guacamole.Client(tunnel);

    // Handling clipboard content received from a virtual machine.
    client.onclipboard = handleClipboardReceived;

    // Handling client state change events.
    client.onstatechange = (state) => {
      onClientStateChange(state, sessionId);
    };

    client.onerror = onError;
    tunnel.onerror = onError;

    let dpi = 96;
    if (protocol === "Telnet") {
      dpi = dpi * 2;
    }

    const params = {
      "sessionId": sessionId,
      "protocol": protocol,
      "width": width,
      "height": height,
      "dpi": dpi,
    };

    if (username || password) {
      params.username = encodeURIComponent(username);
      params.password = encodeURIComponent(password);
    }

    const paramStr = qs.stringify(params);
    client.connect(paramStr);

    const display = client.getDisplay();
    display.onresize = function(width, height) {
      if (containerRef?.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        display.scale(Math.min(newWidth / display.getHeight(), newHeight / display.getHeight()));
      }
    };

    const element = client.getDisplay().getElement();
    const container = ref.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(element);

    const sink = new Guacamole.InputSink();
    container.appendChild(sink.getElement());
    sink.focus();

    const keyboard = new Guacamole.Keyboard(sink.getElement());
    keyboard.onkeydown = (keysym) => {
      client.sendKeyEvent(1, keysym);
      if (keysym === 65288) {
        return false;
      }
    };
    keyboard.onkeyup = (keysym) => {
      client.sendKeyEvent(0, keysym);
    };

    const sinkFocus = debounce(() => {
      sink.focus();
    });

    const mouse = new Guacamole.Mouse(element);
    mouse.onmousedown = mouse.onmouseup = function(mouseState) {
      sinkFocus();
      client.sendMouseState(mouseState);
    };

    mouse.onmousemove = function(mouseState) {
      sinkFocus();
      client.getDisplay().showCursor(false);
      mouseState.x = mouseState.x / display.getScale();
      mouseState.y = mouseState.y / display.getScale();
      client.sendMouseState(mouseState);
    };

    const touch = new Guacamole.Mouse.Touchpad(element); // or Guacamole.Touchscreen
    touch.onmousedown = touch.onmousemove = touch.onmouseup = function(state) {
      client.sendMouseState(state);
    };

    handleAddClient(client, sink);
  };

  useEffect(() => {
    const resize = debounce(() => {
      onWindowResize();
    });
    window.addEventListener("resize", resize);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [guacd]);

  const onWindowResize = () => {
    if (guacd.client) {
      const display = guacd.client.getDisplay();
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setBox({width, height});
      const scale = Math.min(
        height / display.getHeight(),
        width / display.getHeight()
      );
      display.scale(scale);
      guacd.client.sendSize(width, height);
    }
  };

  const handleUnload = (e) => {
    const message = "Want to leave the website?";
    (e || window.event).returnValue = message; // Gecko + IE
    return message;
  };

  const focus = () => {
    if (guacd.sink) {
      guacd.sink.focus();
    }
  };

  const handleWindowFocus = (e) => {
    if (navigator.clipboard) {
      try {
        navigator.clipboard.readText().then((text) => {
          sendClipboard({
            "data": text,
            "type": "text/plain",
          });
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Copying to clipboard failed", e);
      }
    }
  };

  const handleClipboardReceived = (stream, mimetype) => {
    if (!session.operations.includes("copy")) {
      return;
    }

    if (/^text\//.exec(mimetype)) {
      const reader = new Guacamole.StringReader(stream);
      let data = "";
      reader.ontext = function textReceived(text) {
        data += text;
      };
      reader.onend = async() => {
        setClipboardText(data);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data);
        }
      };
    } else {
      const reader = new Guacamole.BlobReader(stream, mimetype);
      reader.onend = () => {
        setClipboardText(reader.getBlob());
      };
    }
  };

  const sendClipboard = (data) => {
    if (!guacd.client) {
      return;
    }
    if (!session.operations.includes("paste")) {
      message.warn("Can not paste");
      return;
    }
    const stream = guacd.client.createClipboardStream(data.type);
    if (typeof data.data === "string") {
      const writer = new Guacamole.StringWriter(stream);
      writer.sendText(data.data);
      writer.sendEnd();
    } else {
      const writer = new Guacamole.BlobWriter(stream);
      writer.oncomplete = function clipboardSent() {
        writer.sendEnd();
      };
      writer.sendBlob(data.data);
    }

  };

  const onClientStateChange = (state, sessionId) => {
    const key = "message";
    switch (state) {
    case STATE_IDLE:
      message.destroy(key);
      message.loading({content: "Initializing...", duration: 0, key: key});
      break;
    case STATE_CONNECTING:
      message.destroy(key);
      message.loading({content: "Connecting...", duration: 0, key: key});
      break;
    case STATE_WAITING:
      message.destroy(key);
      message.loading({content: "Waiting for server response...", duration: 0, key: key});
      break;
    case STATE_CONNECTED:
      Modal.destroyAll();
      message.destroy(key);
      message.success({content: "Connection successful", duration: 3, key: key});
      // Send a request to the backend to update the session's status
      SessionBackend.connect(sessionId);
      break;
    case STATE_DISCONNECTING:
      // Handle disconnecting state if needed
      break;
    case STATE_DISCONNECTED:
      message.error({content: "Connection closed", duration: 3, key: key});
      setGuacd({client: null, sink: null});
      break;
    default:
      break;
    }
  };

  const sendCombinationKey = (keys) => {
    if (!guacd.client) {
      return;
    }
    for (let i = 0; i < keys.length; i++) {
      guacd.client.sendKeyEvent(1, keys[i]);
    }
    for (let j = 0; j < keys.length; j++) {
      guacd.client.sendKeyEvent(0, keys[j]);
    }
    Setting.showMessage("success", "Combination Keys successfully sent");
  };

  const showMessage = (msg) => {
    message.destroy();
    Modal.confirm({
      title: `Failed to connect to: ${name}`,
      icon: <CloseCircleOutlined />,
      content: msg,
      centered: true,
      okText: "Reconnect",
      cancelText: "Close this page",
      cancelButtonProps: {"danger": true},
      onOk() {
        addNodeTunnel();
      },
      onCancel() {
        if (activeKey) {
          closePane(activeKey);
        } else {
          window.close();
        }
      },
    });
  };

  const onError = (status) => {
    switch (status.code) {
    case 256:
      showMessage("Unsupported access");
      break;
    case 512:
      showMessage("Remote service exception, please check if the target device can be accessed normally.");
      break;
    case 513:
      showMessage("Server busy");
      break;
    case 514:
      showMessage("Server connection timed out");
      break;
    case 515:
      showMessage("Remote service exception");
      break;
    case 516:
      showMessage("Resource not found");
      break;
    case 517:
      showMessage("Resource conflict");
      break;
    case 518:
      showMessage("Resource closed");
      break;
    case 519:
      showMessage("Remote service not found");
      break;
    case 520:
      showMessage("Remote service unavailable");
      break;
    case 521:
      showMessage("Session conflict");
      break;
    case 522:
      showMessage("Session connection timed out");
      break;
    case 523:
      showMessage("Session closed");
      break;
    case 768:
      showMessage("Network unreachable");
      break;
    case 769:
      showMessage("Server password authentication failed");
      break;
    case 771:
      showMessage("Client is forbidden");
      break;
    case 776:
      showMessage("Client connection timed out");
      break;
    case 781:
      showMessage("Client exception");
      break;
    case 783:
      showMessage("Incorrect request type");
      break;
    case 800:
      showMessage("Session does not exist");
      break;
    case 801:
      showMessage("Failed to create tunnel, please check if Guacd service is functioning correctly.");
      break;
    case 802:
      showMessage("Admin forcefully closed this session");
      break;
    case 804:
      showMessage("Check that the parameters (width,height) are in the correct format: " + status.message);
      break;
    case 805:
      showMessage("Failed to find the node: " + status.message);
      break;
    case 806:
      showMessage("Failed to update session status: " + status.message);
      break;
    default:
      if (status.message) {
        showMessage(Base64.decode(status.message));
      } else {
        showMessage("Unknown error.");
      }
    }
  };

  const fullScreen = () => {
    if (props.toggleFullscreen) {
      props.toggleFullscreen();
    }
    setIsFullScreened(!isFullScreened);
    toggleFullscreen();
    focus();
  };

  const hotKeyMenu = (
    <Menu>
      <Menu.Item key={"ctrl+alt+delete"} onClick={() => sendCombinationKey(["65507", "65513", "65535"])}>Ctrl+Alt+Delete</Menu.Item>
      <Menu.Item key={"ctrl+alt+backspace"} onClick={() => sendCombinationKey(["65507", "65513", "65288"])}>Ctrl+Alt+Backspace</Menu.Item>
      <Menu.Item key={"windows+d"} onClick={() => sendCombinationKey(["65515", "100"])}>Windows+D</Menu.Item>
      <Menu.Item key={"windows+e"} onClick={() => sendCombinationKey(["65515", "101"])}>Windows+E</Menu.Item>
      <Menu.Item key={"windows+r"} onClick={() => sendCombinationKey(["65515", "114"])}>Windows+R</Menu.Item>
      <Menu.Item key={"windows+x"} onClick={() => sendCombinationKey(["65515", "120"])}>Windows+X</Menu.Item>
      <Menu.Item key={"windows"} onClick={() => sendCombinationKey(["65515"])}>Windows</Menu.Item>
    </Menu>
  );

  return (
    <div>
      <div className="container" ref={containerRef} style={{
        display: "flex",
        width: "100%",
        height: activeKey ? "calc(100vh - 40px)" : "100vh",
        backgroundColor: "#1b1b1b",
      }}>
        <div ref={ref} />
      </div>
      <Draggable>
        <Affix style={{position: "absolute", top: 50, right: 50}}>
          <Button icon={<ExpandOutlined />} onClick={() => {
            fullScreen();
          }} />
        </Affix>
      </Draggable>
      {
        <Draggable>
          <Affix style={{position: "absolute", top: 50, right: 100}}>
            <Button icon={<CopyOutlined />}
              onClick={() => {
                setClipboardVisible(true);
              }} />
          </Affix>
        </Draggable>
      }
      {
        session.protocol === "VNC" &&
        <Draggable>
          <Affix style={{position: "absolute", top: 100, right: 100}}>
            <Dropdown overlay={hotKeyMenu} trigger={["click"]} placement="bottomLeft">
              <Button icon={<WindowsOutlined />} />
            </Dropdown>
          </Affix>
        </Draggable>
      }
      {
        session.protocol === "RDP" &&
        <Draggable>
          <Affix style={{position: "absolute", top: 100, right: 100}}>
            <Dropdown overlay={hotKeyMenu} trigger={["click"]} placement="bottomLeft">
              <Button icon={<WindowsOutlined />} />
            </Dropdown>
          </Affix>
        </Draggable>
      }
      <GuacdClipboard visible={clipboardVisible}
        clipboardText={clipboardText}
        handleOk={(text) => {
          sendClipboard({
            "data": text,
            "type": "text/plain",
          });
          setClipboardText(text);
          setClipboardVisible(false);
          focus();
        }}
        handleCancel={() => {
          setClipboardVisible(false);
          focus();
        }}
      />
    </div>
  );
};

export default GuacdPage;

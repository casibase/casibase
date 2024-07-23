import {ServerUrl} from "../Setting";
import * as Setting from "../Setting";

let chatEvent = null;

let wsCallback = (data) => {};

export function initIMConnect(user) {
  if (chatEvent !== null) {
    return;
  }
  chatEvent = new EventSource(`${ServerUrl}/api/imchat?user=${user}`);
  chatEvent.onopen = () => {
  };

  chatEvent.onerror = (err) => {
    chatEvent.close();
    Setting.showMessage("error", "websocket error, please refresh the page");
  };

  chatEvent.onclose = () => {
    chatEvent = null;
    Setting.showMessage("error", "websocket disconnected, please refresh the page");
  };

  chatEvent.onmessage = (event) => {
    const data = JSON.parse(event.data);
    wsCallback(data);
  };
}

export function setNewMessageCallBack(callback) {
  wsCallback = callback;
}

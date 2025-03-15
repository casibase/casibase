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

package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/beego/beego"
	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/util/guacamole"
	"github.com/gorilla/websocket"
)

const (
	TunnelClosed       int = -1
	Normal             int = 0
	SessionNotFound    int = 800
	NewTunnelError     int = 801
	ForcedDisconnect   int = 802
	NodeNotActive      int = 803
	ParametersError    int = 804
	NodeNotFound       int = 805
	SessionUpdateError int = 806
)

var UpGrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	Subprotocols: []string{"guacamole"},
}

// AddNodeTunnel
// @Title AddNodeTunnel
// @Tag Session API
// @Description add session
// @Param   nodeId    query   string  true        "The id of node"
// @Success 200 {object} Response
// @router /add-node-tunnel [get]
func (c *ApiController) AddNodeTunnel() {
	nodeId := c.Input().Get("nodeId")
	mode := c.Input().Get("mode")

	user := c.GetSessionUser()
	if user == nil {
		c.ResponseError("please sign in first")
		return
	}

	session := &object.Session{
		Creator:       user.Name,
		ClientIp:      c.getClientIp(),
		UserAgent:     c.getUserAgent(),
		ClientIpDesc:  util.GetDescFromIP(c.getClientIp()),
		UserAgentDesc: util.GetDescFromUserAgent(c.getUserAgent()),
	}

	var err error
	session, err = object.CreateSession(session, nodeId, mode)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(session)
}

func (c *ApiController) GetNodeTunnel() {
	c.EnableRender = false
	ctx := c.Ctx
	ws, err := UpGrader.Upgrade(ctx.ResponseWriter, ctx.Request, nil)
	if err != nil {
		c.ResponseError("WebSocket upgrade failed:", err)
		return
	}

	width := c.Input().Get("width")
	height := c.Input().Get("height")
	dpi := c.Input().Get("dpi")
	sessionId := c.Input().Get("sessionId")

	username := c.Input().Get("username")
	password := c.Input().Get("password")

	intWidth, err := strconv.Atoi(width)
	if err != nil {
		guacamole.Disconnect(ws, ParametersError, err.Error())
		return
	}
	intHeight, err := strconv.Atoi(height)
	if err != nil {
		guacamole.Disconnect(ws, ParametersError, err.Error())
		return
	}

	session, err := object.GetConnSession(sessionId)
	if err != nil {
		guacamole.Disconnect(ws, SessionNotFound, err.Error())
		return
	}

	node, err := object.GetNode(session.Node)
	if err != nil || node == nil {
		guacamole.Disconnect(ws, NodeNotFound, err.Error())
		return
	}

	if node.RemoteUsername == "" {
		node.RemoteUsername = username
		node.RemotePassword = password
	} else {
		if node.RemotePassword == "" {
			node.RemotePassword = password
		}
	}

	configuration := guacamole.NewConfiguration()
	propertyMap := configuration.LoadConfig()

	setConfig(propertyMap, node, configuration)
	configuration.SetParameter("width", width)
	configuration.SetParameter("height", height)
	configuration.SetParameter("dpi", dpi)

	addr := beego.AppConfig.String("guacamoleEndpoint")
	if addr == "" {
		guacamole.Disconnect(ws, NewTunnelError, "guacamoleEndpoint in app.conf should not be empty")
		return
	}

	tunnel, err := guacamole.NewTunnel(addr, configuration)
	if err != nil {
		guacamole.Disconnect(ws, NewTunnelError, err.Error())
		return
	}

	guacSession := &guacamole.Session{
		Id:          sessionId,
		Protocol:    session.Protocol,
		WebSocket:   ws,
		GuacdTunnel: tunnel,
	}

	guacSession.Observer = guacamole.NewObserver(sessionId)
	guacamole.GlobalSessionManager.Add(guacSession)

	session.ConnectionId = tunnel.ConnectionID
	session.Width = intWidth
	session.Height = intHeight
	session.Status = object.Connecting
	session.Recording = configuration.GetParameter(guacamole.RecordingPath)

	if session.Recording == "" {
		// No audit is required when no screen is recorded
		session.Reviewed = true
	}

	_, err = object.UpdateSession(sessionId, session)
	if err != nil {
		guacamole.Disconnect(ws, SessionUpdateError, err.Error())
		return
	}

	guacamoleHandler := NewGuacamoleHandler(ws, tunnel)
	guacamoleHandler.Start()
	defer guacamoleHandler.Stop()

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			logs.Error(fmt.Sprintf("GetNodeTunnel():ws.ReadMessage() error: %s", err.Error()))

			_ = tunnel.Close()
			err2 := object.CloseSession(sessionId, Normal, "Normal user exit")
			if err2 != nil {
				logs.Error(fmt.Sprintf("GetNodeTunnel():object.CloseSession() error: %s", err.Error()))
			}
			return
		}

		_, err = tunnel.WriteAndFlush(message)
		if err != nil {
			logs.Error(fmt.Sprintf("GetNodeTunnel():tunnel.WriteAndFlush() error: %s", err.Error()))

			err2 := object.CloseSession(sessionId, Normal, "Normal user exit")
			if err2 != nil {
				logs.Error(fmt.Sprintf("GetNodeTunnel():object.CloseSession() (2nd) error: %s", err.Error()))
			}
			return
		}
	}
}

func (c *ApiController) TunnelMonitor() {
	ctx := c.Ctx
	ws, err := UpGrader.Upgrade(ctx.ResponseWriter, ctx.Request, nil)
	if err != nil {
		c.ResponseError("WebSocket upgrade failed:", err)
		return
	}
	sessionId := c.Input().Get("sessionId")

	s, err := object.GetConnSession(sessionId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if s.Status != object.Connected {
		guacamole.Disconnect(ws, NodeNotActive, "Session offline")
		return
	}

	connectionId := s.ConnectionId
	configuration := guacamole.NewConfiguration()
	configuration.ConnectionID = connectionId
	configuration.SetParameter("width", strconv.Itoa(s.Width))
	configuration.SetParameter("height", strconv.Itoa(s.Height))
	configuration.SetParameter("dpi", "96")
	configuration.SetReadOnlyMode()

	addr := beego.AppConfig.String("guacamoleEndpoint")
	if addr == "" {
		guacamole.Disconnect(ws, NewTunnelError, "guacamoleEndpoint in app.conf should not be empty")
		return
	}

	tunnel, err := guacamole.NewTunnel(addr, configuration)
	if err != nil {
		guacamole.Disconnect(ws, NewTunnelError, err.Error())
		panic(err)
	}

	guacSession := &guacamole.Session{
		Id:          sessionId,
		Protocol:    s.Protocol,
		WebSocket:   ws,
		GuacdTunnel: tunnel,
	}

	forObsSession := guacamole.GlobalSessionManager.Get(sessionId)
	if forObsSession == nil {
		guacamole.Disconnect(ws, SessionNotFound, "Failed to obtain session")
		return
	}
	guacSession.Id = util.GenerateId()
	forObsSession.Observer.Add(guacSession)

	guacamoleHandler := NewGuacamoleHandler(ws, tunnel)
	guacamoleHandler.Start()
	defer guacamoleHandler.Stop()

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			_ = tunnel.Close()

			observerId := guacSession.Id
			forObsSession.Observer.Delete(observerId)
			return
		}

		_, err = tunnel.WriteAndFlush(message)
		if err != nil {
			err := object.CloseSession(sessionId, Normal, "Normal user exit")
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			return
		}
	}
}

func setConfig(propertyMap map[string]string, node *object.Node, configuration *guacamole.Configuration) {
	switch node.RemoteProtocol {
	case "SSH":
		configuration.Protocol = "ssh"
	case "RDP":
		configuration.Protocol = "rdp"
	case "Telnet":
		configuration.Protocol = "telnet"
	case "VNC":
		configuration.Protocol = "vnc"
	}

	hostname := node.PublicIp
	if hostname == "" {
		hostname = node.PrivateIp
	}
	if hostname == "" {
		hostname = node.Name
	}

	configuration.SetParameter("hostname", hostname)
	configuration.SetParameter("port", strconv.Itoa(node.RemotePort))
	configuration.SetParameter("username", node.RemoteUsername)
	configuration.SetParameter("password", node.RemotePassword)

	switch node.RemoteProtocol {
	case "RDP":
		configuration.SetParameter("security", "any")
		configuration.SetParameter("ignore-cert", "true")
		configuration.SetParameter("create-drive-path", "true")
		configuration.SetParameter("resize-method", "display-update")
		configuration.SetParameter(guacamole.EnableWallpaper, propertyMap[guacamole.EnableWallpaper])
		configuration.SetParameter(guacamole.EnableTheming, propertyMap[guacamole.EnableTheming])
		configuration.SetParameter(guacamole.EnableFontSmoothing, propertyMap[guacamole.EnableFontSmoothing])
		configuration.SetParameter(guacamole.EnableFullWindowDrag, propertyMap[guacamole.EnableFullWindowDrag])
		configuration.SetParameter(guacamole.EnableDesktopComposition, propertyMap[guacamole.EnableDesktopComposition])
		configuration.SetParameter(guacamole.EnableMenuAnimations, propertyMap[guacamole.EnableMenuAnimations])
		configuration.SetParameter(guacamole.DisableBitmapCaching, propertyMap[guacamole.DisableBitmapCaching])
		configuration.SetParameter(guacamole.DisableOffscreenCaching, propertyMap[guacamole.DisableOffscreenCaching])
		configuration.SetParameter(guacamole.ColorDepth, propertyMap[guacamole.ColorDepth])
		configuration.SetParameter(guacamole.ForceLossless, propertyMap[guacamole.ForceLossless])
		configuration.SetParameter(guacamole.PreConnectionId, propertyMap[guacamole.PreConnectionId])
		configuration.SetParameter(guacamole.PreConnectionBlob, propertyMap[guacamole.PreConnectionBlob])

		// if node.EnableRemoteApp {
		//	remoteApp := node.RemoteApps[0]
		//	configuration.SetParameter("remote-app", "||"+remoteApp.RemoteAppName)
		//	configuration.SetParameter("remote-app-dir", remoteApp.RemoteAppDir)
		//	configuration.SetParameter("remote-app-args", remoteApp.RemoteAppArgs)
		// }
	case "SSH":
		configuration.SetParameter(guacamole.FontSize, propertyMap[guacamole.FontSize])
		// configuration.SetParameter(guacamole.FontName, propertyMap[guacamole.FontName])
		configuration.SetParameter(guacamole.ColorScheme, propertyMap[guacamole.ColorScheme])
		configuration.SetParameter(guacamole.Backspace, propertyMap[guacamole.Backspace])
		configuration.SetParameter(guacamole.TerminalType, propertyMap[guacamole.TerminalType])
	case "Telnet":
		configuration.SetParameter(guacamole.FontSize, propertyMap[guacamole.FontSize])
		// configuration.SetParameter(guacamole.FontName, propertyMap[guacamole.FontName])
		configuration.SetParameter(guacamole.ColorScheme, propertyMap[guacamole.ColorScheme])
		configuration.SetParameter(guacamole.Backspace, propertyMap[guacamole.Backspace])
		configuration.SetParameter(guacamole.TerminalType, propertyMap[guacamole.TerminalType])
	default:
	}
}

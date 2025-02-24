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

package guacamole

const (
	EnableRecording     = "enable-recording"
	RecordingPath       = "recording-path"
	CreateRecordingPath = "create-recording-path"

	FontName     = "font-name"
	FontSize     = "font-size"
	ColorScheme  = "color-scheme"
	Backspace    = "backspace"
	TerminalType = "terminal-type"

	PreConnectionId   = "preconnection-id"
	PreConnectionBlob = "preconnection-blob"

	EnableDrive              = "enable-drive"
	DriveName                = "drive-name"
	DrivePath                = "drive-path"
	EnableWallpaper          = "enable-wallpaper"
	EnableTheming            = "enable-theming"
	EnableFontSmoothing      = "enable-font-smoothing"
	EnableFullWindowDrag     = "enable-full-window-drag"
	EnableDesktopComposition = "enable-desktop-composition"
	EnableMenuAnimations     = "enable-menu-animations"
	DisableBitmapCaching     = "disable-bitmap-caching"
	DisableOffscreenCaching  = "disable-offscreen-caching"
	// DisableGlyphCaching Deprecated
	DisableGlyphCaching = "disable-glyph-caching"
	ForceLossless       = "force-lossless"

	Domain        = "domain"
	RemoteApp     = "remote-app"
	RemoteAppDir  = "remote-app-dir"
	RemoteAppArgs = "remote-app-args"

	ColorDepth  = "color-depth"
	Cursor      = "cursor"
	SwapRedBlue = "swap-red-blue"
	DestHost    = "dest-host"
	DestPort    = "dest-port"
	ReadOnly    = "read-only"

	UsernameRegex     = "username-regex"
	PasswordRegex     = "password-regex"
	LoginSuccessRegex = "login-success-regex"
	LoginFailureRegex = "login-failure-regex"

	Namespace  = "namespace"
	Pod        = "pod"
	Container  = "container"
	UesSSL     = "use-ssl"
	ClientCert = "client-cert"
	ClientKey  = "client-key"
	CaCert     = "ca-cert"
	IgnoreCert = "ignore-cert"
)

const Delimiter = ';'

// Config is the data sent to guacd to configure the session during the handshake.
type Configuration struct {
	// ConnectionID is used to reconnect to an existing session, otherwise leave blank for a new session.
	ConnectionID string
	// Protocol is the protocol of the connection from guacd to the remote (rdp, ssh, etc).
	Protocol string
	// Parameters are used to configure protocol specific options like sla for rdp or terminal color schemes.
	Parameters map[string]string
}

// NewConfiguration
func NewConfiguration() *Configuration {
	return &Configuration{
		Parameters: map[string]string{},
	}
}

func (c *Configuration) SetReadOnlyMode() {
	c.Parameters[ReadOnly] = "true"
}

func (c *Configuration) SetParameter(name, value string) {
	c.Parameters[name] = value
}

func (c *Configuration) UnSetParameter(name string) {
	delete(c.Parameters, name)
}

func (c *Configuration) GetParameter(name string) string {
	return c.Parameters[name]
}

func (opt *Configuration) LoadConfig() map[string]string {
	configMap := map[string]string{
		"color-scheme":               "gray-black",
		"cron-log-saved-limit":       "360",
		"disable-bitmap-caching":     "false",
		"disable-offscreen-caching":  "false",
		"enable-desktop-composition": "true",
		"enable-font-smoothing":      "true",
		"enable-full-window-drag":    "true",
		"enable-menu-animations":     "true",
		"enable-recording":           "true",
		"enable-theming":             "true",
		"enable-wallpaper":           "true",
		"font-name":                  "menlo",
		"font-size":                  "12",
		"login-log-saved-limit":      "360",
		"session-saved-limit":        "360",
		"user-default-storage-size":  "5120",
	}

	return configMap
}

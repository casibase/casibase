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

package util

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/beego/beego"
)

// IPProvider defines the type of IP geolocation provider to use
type IPProvider string

const (
	IP17MonProvider IPProvider = "17monip"
	MaxMindProvider IPProvider = "maxmind"
)

// activeProvider stores the currently active IP provider
var activeProvider IPProvider

// InitIpDb initializes the IP database based on configuration
func InitIpDb() {
	isLocalIpDb := beego.AppConfig.DefaultBool("isLocalIpDb", false)

	if isLocalIpDb {
		activeProvider = IP17MonProvider
		err := Init("data/17monipdb.dat")
		if _, ok := err.(*os.PathError); ok {
			err = Init("../data/17monipdb.dat")
		}
		if err != nil {
			panic(err)
		}
	} else {
		activeProvider = MaxMindProvider
		if err := InitMaxmindDb(); err != nil {
			// If MaxMind fails and not currently downloading
			if !MaxmindDownloadInProgress {
				// Try 17monipdb as fallback
				fmt.Printf("Failed to initialize MaxMind database: %v, falling back to local IP database\n", err)
				activeProvider = IP17MonProvider

				err = Init("data/17monipdb.dat")
				if _, ok := err.(*os.PathError); ok {
					err = Init("../data/17monipdb.dat")
				}
				if err != nil {
					panic(err)
				}
			}
		}
	}
}

// GetDescFromIP returns a string description of an IP address
func GetDescFromIP(ip string) string {
	var info *LocationInfo
	var err error

	// Use the active provider to look up IP
	switch activeProvider {
	case IP17MonProvider:
		info, err = Find(ip)
	case MaxMindProvider:
		info, err = FindMaxmind(ip)
	}

	if err != nil {
		return ""
	}

	res := info.Country + ", " + info.Region + ", " + info.City
	if info.Isp != Null {
		res += ", " + info.Isp
	}

	return res
}

func GetIPInfo(clientIP string) string {
	if clientIP == "" {
		return ""
	}

	ips := strings.Split(clientIP, ",")
	res := ""
	for i := range ips {
		ip := strings.TrimSpace(ips[i])
		desc := GetDescFromIP(ip)
		ipstr := fmt.Sprintf("%s: %s", ip, desc)
		if i != len(ips)-1 {
			res += ipstr + " -> "
		} else {
			res += ipstr
		}
	}

	return res
}

func GetIPFromRequest(req *http.Request) string {
	clientIP := req.Header.Get("x-forwarded-for")
	if clientIP == "" {
		ipPort := strings.Split(req.RemoteAddr, ":")
		if len(ipPort) >= 1 && len(ipPort) <= 2 {
			clientIP = ipPort[0]
		} else if len(ipPort) > 2 {
			idx := strings.LastIndex(req.RemoteAddr, ":")
			clientIP = req.RemoteAddr[0:idx]
			clientIP = strings.TrimLeft(clientIP, "[")
			clientIP = strings.TrimRight(clientIP, "]")
		}
	}

	return GetIPInfo(clientIP)
}

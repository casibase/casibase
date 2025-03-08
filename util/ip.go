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
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/beego/beego"
)

var IsMaxmindIpDb bool

// tryInitLocalDb tries to initialize the local IP database from different paths
func tryInitLocalDb() error {
	err := Init("data/17monipdb.dat")
	var pathError *os.PathError
	if errors.As(err, &pathError) {
		err = Init("../data/17monipdb.dat")
	}
	return err
}

// InitIpDb initializes the IP database based on configuration
func InitIpDb() {
	IsMaxmindIpDb = beego.AppConfig.DefaultBool("isLocalIpDb", false)

	if IsMaxmindIpDb {
		// Use local IP database
		err := tryInitLocalDb()
		if err != nil {
			panic(err)
		}
	} else {
		// Try MaxMind first
		if err := InitMaxmindDb(); err != nil {
			if !MaxmindDownloadInProgress {
				// Try 17monipdb as fallback
				err = tryInitLocalDb()
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

	if IsMaxmindIpDb {
		info, err = Find(ip)
	} else {
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
		// desc := GetDescFromIP(ip)
		ipstr := fmt.Sprintf("%s: %s", ip, "")
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

// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"net"

	"github.com/casibase/casibase/conf"
	"github.com/oschwald/geoip2-golang"
)

var (
	maxmindCityDB *geoip2.Reader
	maxmindASNDB  *geoip2.Reader

	MaxmindDownloadInProgress bool
)

// InitMaxmindDb initializes the MaxMind GeoIP2 databases
func InitMaxmindDb() error {
	frontendBaseDir := conf.GetConfigString("frontendBaseDir")

	var cityErr, asnErr error

	// Try to open the City database file
	maxmindCityDB, cityErr = geoip2.Open(frontendBaseDir + "/data/GeoLite2-City.mmdb")
	if cityErr != nil {
		maxmindCityDB, cityErr = geoip2.Open(frontendBaseDir + "/../data/GeoLite2-City.mmdb")
		if cityErr != nil {
			fmt.Printf("InitMaxmindDb() open \"GeoLite2-City.mmdb\" warning: %v\n", cityErr)
		}
	}

	// Try to open the ASN database file
	maxmindASNDB, asnErr = geoip2.Open(frontendBaseDir + "/data/GeoLite2-ASN.mmdb")
	if asnErr != nil {
		maxmindASNDB, asnErr = geoip2.Open(frontendBaseDir + "/../data/GeoLite2-ASN.mmdb")
		if asnErr != nil {
			fmt.Printf("InitMaxmindDb() open \"GeoLite2-ASN.mmdb\" warning: %v\n", asnErr)
		}
	}

	return nil
}

// FindMaxmind looks up IP information using MaxMind GeoIP2
func FindMaxmind(ipstr string) (*LocationInfo, error) {
	if MaxmindDownloadInProgress && (maxmindCityDB == nil || maxmindASNDB == nil) {
		return &LocationInfo{
			Country: Null,
			Region:  Null,
			City:    Null,
			Isp:     Null,
		}, nil
	}

	// Parse the IP address
	ip := net.ParseIP(ipstr)
	if ip == nil {
		return nil, ErrInvalidIp
	}

	// Initialize with default values
	info := &LocationInfo{
		Country: Null,
		Region:  Null,
		City:    Null,
		Isp:     Null,
	}

	if maxmindCityDB != nil {
		// Look up geo information
		record, err := maxmindCityDB.City(ip)
		if err != nil {
			panic("Get location info failed " + err.Error())
		}
		// Get country, region, city in English
		if val, ok := record.Country.Names["en"]; ok && val != "" {
			info.Country = val
		}

		if len(record.Subdivisions) > 0 {
			if val, ok := record.Subdivisions[0].Names["en"]; ok && val != "" {
				info.Region = val
			}
		}

		if val, ok := record.City.Names["en"]; ok && val != "" {
			info.City = val
		}
	}

	if maxmindASNDB != nil {
		// Look up ASN/ISP information
		asnRecord, err := maxmindASNDB.ASN(ip)
		if err != nil {
			panic("Get ASN info failed " + err.Error())
		}
		info.Isp = asnRecord.AutonomousSystemOrganization
	}

	return info, nil
}

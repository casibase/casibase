package util

import (
	"fmt"
	"net"

	"github.com/oschwald/geoip2-golang"
)

var (
	maxmindCityDB *geoip2.Reader
	maxmindASNDB  *geoip2.Reader

	MaxmindDownloadInProgress bool
)

// InitMaxmindDb initializes the MaxMind GeoIP2 databases
func InitMaxmindDb() error {
	var cityErr, asnErr error

	// Try to open the City database file
	maxmindCityDB, cityErr = geoip2.Open("data/GeoLite2-City.mmdb")
	if cityErr != nil {
		maxmindCityDB, cityErr = geoip2.Open("../data/GeoLite2-City.mmdb")
		if cityErr != nil {
			fmt.Println("Init MaxMind City database failed")
		}
	}

	// Try to open the ASN database file
	maxmindASNDB, asnErr = geoip2.Open("data/GeoLite2-ASN.mmdb")
	if asnErr != nil {
		maxmindASNDB, asnErr = geoip2.Open("../data/GeoLite2-ASN.mmdb")
		if asnErr != nil {
			fmt.Println("Init MaxMind ASN database failed")
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

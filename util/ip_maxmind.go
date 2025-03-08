package util

import (
	"fmt"
	"github.com/oschwald/geoip2-golang"
	"net"
)

var (
	// Global database readers
	maxmindCityDB *geoip2.Reader
	maxmindASNDB  *geoip2.Reader

	// Download status flags
	MaxmindDownloadInProgress bool
)

// InitMaxmindDb initializes the MaxMind GeoIP2 databases
func InitMaxmindDb() error {
	var cityErr, asnErr error

	// Try to open the City database file
	maxmindCityDB, cityErr = geoip2.Open("data/GeoLite2-City.mmdb")
	if cityErr != nil {
		// Try parent directory
		maxmindCityDB, cityErr = geoip2.Open("../data/GeoLite2-City.mmdb")
	}

	// Try to open the ASN database file
	maxmindASNDB, asnErr = geoip2.Open("data/GeoLite2-ASN.mmdb")
	if asnErr != nil {
		// Try parent directory
		maxmindASNDB, asnErr = geoip2.Open("../data/GeoLite2-ASN.mmdb")
	}

	// Ensure at least one database is available
	if maxmindCityDB == nil && maxmindASNDB == nil {
		return fmt.Errorf("failed to open any MaxMind database: City: %v, ASN: %v", cityErr, asnErr)
	}

	return nil
}

// FindMaxmind looks up IP information using MaxMind GeoIP2
func FindMaxmind(ipstr string) (*LocationInfo, error) {
	// If download is in progress and databases aren't initialized yet, return empty result
	if MaxmindDownloadInProgress && maxmindCityDB == nil && maxmindASNDB == nil {
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

	// Look up geo information if city database is available
	if maxmindCityDB != nil {
		record, err := maxmindCityDB.City(ip)
		if err == nil {
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
	}

	// Look up ASN/ISP information if ASN database is available
	if maxmindASNDB != nil {
		asnRecord, err := maxmindASNDB.ASN(ip)
		if err == nil && asnRecord.AutonomousSystemOrganization != "" {
			info.Isp = asnRecord.AutonomousSystemOrganization
		}
	}

	return info, nil
}

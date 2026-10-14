// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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

package object

import (
	"fmt"
	"strings"

	"golang.org/x/sync/errgroup"
	"xorm.io/xorm"
)

// getEffectiveHubDbNames returns the HubDbNames for the given site.
// If the site's own HubDbNames is empty and ParentDbName is set, it falls back
// to the HubDbNames of the parent DB's site-built-in.
func getEffectiveHubDbNames(site *Site) string {
	if hubDbNames := strings.TrimSpace(site.HubDbNames); hubDbNames != "" {
		return hubDbNames
	}
	parentDbName := strings.TrimSpace(site.ParentDbName)
	if parentDbName == "" {
		return ""
	}
	parentAdapter := NewAdapterWithDbName(adapter.driverName, adapter.dataSourceName, parentDbName)
	parentSite := &Site{Owner: "admin", Name: "site-built-in"}
	_, err := parentAdapter.engine.Get(parentSite)
	parentAdapter.close()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(parentSite.HubDbNames)
}

// GetPublishedStoresFromAllDbs returns published stores from the local DB plus
// any additional databases listed in site-built-in's HubDbNames field.
// Stores from external DBs carry HubDbName set to their source database name.
func GetPublishedStoresFromAllDbs() ([]*Store, error) {
	stores, err := GetPublishedStores()
	if err != nil {
		return nil, err
	}

	site, err := GetBuiltInSiteWithSecret()
	if err != nil || site == nil {
		return stores, nil
	}

	hubDbNames := getEffectiveHubDbNames(site)
	if hubDbNames == "" {
		return stores, nil
	}

	dbNames := []string{}
	for _, dbName := range strings.Split(hubDbNames, ",") {
		dbName = strings.TrimSpace(dbName)
		if dbName != "" && dbName != adapter.DbName {
			dbNames = append(dbNames, dbName)
		}
	}

	// A hub can list dozens of instances; query them a few at a time instead of one after another.
	results := make([][]*Store, len(dbNames))
	g := errgroup.Group{}
	g.SetLimit(hubQueryConcurrency)
	for i, dbName := range dbNames {
		g.Go(func() error {
			extraStores, err := getPublishedStoresFromHubDb(dbName)
			results[i] = extraStores
			return err
		})
	}
	if err = g.Wait(); err != nil {
		return nil, err
	}
	for _, extraStores := range results {
		stores = append(stores, extraStores...)
	}

	return stores, nil
}

// hubQueryConcurrency is how many hub databases are queried at the same time.
const hubQueryConcurrency = 8

func getPublishedStoresFromHubDb(dbName string) ([]*Store, error) {
	extraAdapter := NewAdapterWithDbName(adapter.driverName, adapter.dataSourceName, dbName)
	defer extraAdapter.close()

	// Fetch site-built-in from this DB to obtain its public Endpoint.
	extraSite := &Site{Owner: "admin", Name: "site-built-in"}
	_, err := extraAdapter.engine.Get(extraSite)
	if err != nil {
		return nil, fmt.Errorf("failed to get site-built-in from hub DB [%s]: %w", dbName, err)
	}
	endpoint := strings.TrimRight(extraSite.Endpoint, "/")

	extraStores := []*Store{}
	err = extraAdapter.engine.Desc("created_time").Where("publish_state = ?", "Published").Find(&extraStores)
	if err != nil {
		return nil, fmt.Errorf("failed to get published stores from hub DB [%s]: %w", dbName, err)
	}
	for _, s := range extraStores {
		s.HubDbName = dbName
		s.Endpoint = endpoint
	}
	return extraStores, nil
}

func isConfiguredHubDbName(hubDbName string) (bool, error) {
	site, err := GetBuiltInSiteWithSecret()
	if err != nil || site == nil {
		return false, err
	}

	for _, dbName := range strings.Split(getEffectiveHubDbNames(site), ",") {
		if strings.TrimSpace(dbName) == hubDbName {
			return true, nil
		}
	}
	return false, nil
}

// withHubEngine runs fn against the engine for hubDbName: the local engine if
// hubDbName is empty or matches the local DB, otherwise a short-lived adapter
// opened against that external hub DB. Stores fetched via
// GetPublishedStoresFromAllDbs carry their source DB name in HubDbName, and
// their star/watch/fork data lives in that same DB, not the local one.
func withHubEngine(hubDbName string, fn func(engine *xorm.Engine) error) error {
	if hubDbName == "" || hubDbName == adapter.DbName {
		return fn(adapter.engine)
	}

	// hubDbName comes from request parameters, so only the hub DBs configured on the site may be
	// opened; anything else would let callers query arbitrary databases on the same server.
	isHubDb, err := isConfiguredHubDbName(hubDbName)
	if err != nil {
		return err
	}
	if !isHubDb {
		return fmt.Errorf("the hub database: %s is not configured", hubDbName)
	}

	extraAdapter := NewAdapterWithDbName(adapter.driverName, adapter.dataSourceName, hubDbName)
	defer extraAdapter.close()
	return fn(extraAdapter.engine)
}

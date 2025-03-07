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

package object

import (
	"flag"
	"fmt"
	"runtime"

	"github.com/beego/beego"
	"github.com/casibase/casibase/conf"
	_ "github.com/denisenkom/go-mssqldb" // mssql
	_ "github.com/go-sql-driver/mysql"   // mysql
	_ "github.com/lib/pq"                // postgres
	_ "modernc.org/sqlite"               // sqlite
	"xorm.io/xorm"
)

var (
	adapter                 *Adapter = nil
	providerAdapter         *Adapter = nil
	isCreateDatabaseDefined          = false
	createDatabase                   = true
)

func InitFlag() {
	if !isCreateDatabaseDefined {
		isCreateDatabaseDefined = true
		createDatabase = getCreateDatabaseFlag()
	}
}

func getCreateDatabaseFlag() bool {
	res := flag.Bool("createDatabase", false, "true if you need to create database")
	flag.Parse()
	return *res
}

func InitConfig() {
	err := beego.LoadAppConfig("ini", "../conf/app.conf")
	if err != nil {
		panic(err)
	}

	InitAdapter()
	CreateTables()
}

func InitAdapter() {
	adapter = NewAdapter(conf.GetConfigString("driverName"), conf.GetConfigDataSourceName())

	providerDbName := conf.GetConfigString("providerDbName")
	if providerDbName != "" {
		providerAdapter = NewAdapterWithDbName(conf.GetConfigString("driverName"), conf.GetConfigDataSourceName(), providerDbName)
	}
}

func CreateTables() {
	if createDatabase {
		err := adapter.CreateDatabase()
		if err != nil {
			panic(err)
		}
	}

	adapter.createTable()
}

// Adapter represents the MySQL adapter for policy storage.
type Adapter struct {
	driverName     string
	dataSourceName string
	DbName         string
	engine         *xorm.Engine
}

// finalizer is the destructor for Adapter.
func finalizer(a *Adapter) {
	err := a.engine.Close()
	if err != nil {
		panic(err)
	}
}

// NewAdapter is the constructor for Adapter.
func NewAdapter(driverName string, dataSourceName string) *Adapter {
	a := &Adapter{}
	a.driverName = driverName
	a.dataSourceName = dataSourceName
	a.DbName = conf.GetConfigString("dbName")

	// Open the DB, create it if not existed.
	a.open()

	// Call the destructor when the object is released.
	runtime.SetFinalizer(a, finalizer)

	return a
}

func NewAdapterWithDbName(driverName string, dataSourceName string, dbName string) *Adapter {
	a := &Adapter{}
	a.driverName = driverName
	a.dataSourceName = dataSourceName
	a.DbName = dbName

	// Open the DB, create it if not existed.
	a.open()

	// Call the destructor when the object is released.
	runtime.SetFinalizer(a, finalizer)

	return a
}

func (a *Adapter) CreateDatabase() error {
	engine, err := xorm.NewEngine(a.driverName, a.dataSourceName)
	if err != nil {
		return err
	}
	defer engine.Close()

	_, err = engine.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s default charset utf8mb4 COLLATE utf8mb4_general_ci", a.DbName))
	if err != nil {
		return err
	}

	return nil
}

func (a *Adapter) open() {
	dataSourceName := a.dataSourceName + a.DbName
	if a.driverName != "mysql" {
		dataSourceName = a.dataSourceName + a.DbName
	}

	engine, err := xorm.NewEngine(a.driverName, dataSourceName)
	if err != nil {
		panic(err)
	}

	a.engine = engine
}

func (a *Adapter) close() {
	a.engine.Close()
	a.engine = nil
}

func (a *Adapter) createTable() {
	err := a.engine.Sync2(new(Video))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Store))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Provider))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Vector))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Chat))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Message))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Node))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Machine))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Image))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Task))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Article))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Session))
	if err != nil {
		panic(err)
	}

	err = a.engine.Sync2(new(Record))
	if err != nil {
		panic(err)
	}
}

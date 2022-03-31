package object

import (
	"fmt"
	"runtime"

	"github.com/astaxie/beego"
	_ "github.com/go-sql-driver/mysql"
	"xorm.io/xorm"
)

var adapter *Adapter

func InitConfig() {
	err := beego.LoadAppConfig("ini", "../conf/app.conf")
	if err != nil {
		panic(err)
	}

	InitAdapter()
}

func InitAdapter() {
	adapter = NewAdapter("mysql", beego.AppConfig.String("dataSourceName"))
}

// Adapter represents the MySQL adapter for policy storage.
type Adapter struct {
	driverName     string
	dataSourceName string
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

	// Open the DB, create it if not existed.
	a.open()

	// Call the destructor when the object is released.
	runtime.SetFinalizer(a, finalizer)

	return a
}

func (a *Adapter) createDatabase() error {
	engine, err := xorm.NewEngine(a.driverName, a.dataSourceName)
	if err != nil {
		return err
	}
	defer engine.Close()

	_, err = engine.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s default charset utf8 COLLATE utf8_general_ci", beego.AppConfig.String("dbName")))
	return err
}

func (a *Adapter) open() {
	if err := a.createDatabase(); err != nil {
		panic(err)
	}

	engine, err := xorm.NewEngine(a.driverName, a.dataSourceName+beego.AppConfig.String("dbName"))
	if err != nil {
		panic(err)
	}

	a.engine = engine
	a.createTable()
}

func (a *Adapter) close() {
	a.engine.Close()
	a.engine = nil
}

func (a *Adapter) createTable() {
	err := a.engine.Sync2(new(Dataset))
	if err != nil {
		panic(err)
	}
}

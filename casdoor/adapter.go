package casdoor

import (
	"runtime"

	"github.com/astaxie/beego"
	_ "github.com/go-sql-driver/mysql"
	"xorm.io/xorm"
)

var adapter *Adapter = nil
var CasdoorOrganization string

type Session struct {
	SessionKey    string  `xorm:"char(64) notnull pk"`
	SessionData   []uint8 `xorm:"blob"`
	SessionExpiry int     `xorm:"notnull"`
}

func InitCasdoorAdapter() {
	casdoorDbName := beego.AppConfig.String("casdoorDbName")
	if casdoorDbName == "" {
		return
	}

	adapter = NewAdapter(beego.AppConfig.String("driverName"), beego.AppConfig.String("dataSourceName"), beego.AppConfig.String("casdoorDbName"))

	CasdoorOrganization = beego.AppConfig.String("casdoorOrganization")
}

// Adapter represents the MySQL adapter for policy storage.
type Adapter struct {
	driverName     string
	dataSourceName string
	dbName         string
	Engine         *xorm.Engine
}

// finalizer is the destructor for Adapter.
func finalizer(a *Adapter) {
	err := a.Engine.Close()
	if err != nil {
		panic(err)
	}
}

// NewAdapter is the constructor for Adapter.
func NewAdapter(driverName string, dataSourceName string, dbName string) *Adapter {
	a := &Adapter{}
	a.driverName = driverName
	a.dataSourceName = dataSourceName
	a.dbName = dbName

	// Open the DB, create it if not existed.
	a.open()

	// Call the destructor when the object is released.
	runtime.SetFinalizer(a, finalizer)

	return a
}

func (a *Adapter) open() {
	Engine, err := xorm.NewEngine(a.driverName, a.dataSourceName+a.dbName)
	if err != nil {
		panic(err)
	}

	a.Engine = Engine
}

func (a *Adapter) close() {
	a.Engine.Close()
	a.Engine = nil
}

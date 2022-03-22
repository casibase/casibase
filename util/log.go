// Copyright 2020 The casbin Authors. All Rights Reserved.
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
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/logs"
	rotatelogs "github.com/lestrrat/go-file-rotatelogs"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"strings"
	"time"
)

func GetIPInfo(clientIP string) string {
	if clientIP == "" {
		return ""
	}

	ips := strings.Split(clientIP, ",")
	res := ""
	for i := range ips {
		ip := strings.TrimSpace(ips[i])
		desc := "" // GetDescFromIP(ip)
		ipstr := fmt.Sprintf("%s: %s", ip, desc)
		if i != len(ips)-1 {
			res += ipstr + " -> "
		} else {
			res += ipstr
		}
	}

	return res
}

func getIPFromRequest(req *http.Request) string {
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

func LogInfo(ctx *context.Context, f string, v ...interface{}) {
	ipString := fmt.Sprintf("(%s) ", getIPFromRequest(ctx.Request))
	logs.Info(ipString+f, v...)
}

func LogWarning(ctx *context.Context, f string, v ...interface{}) {
	ipString := fmt.Sprintf("(%s) ", getIPFromRequest(ctx.Request))
	logs.Warning(ipString+f, v...)
}

func ReadLog() []string {
	f, err := os.Open("logs/casnode.log")
	if err != nil {
		panic(err)
	}

	bytes, err := ioutil.ReadAll(f)
	if err != nil {
		panic(err)
	}

	return strings.Split(string(bytes), "\n")
}

// Logger is a global variable
//  import . "github.com/casbin/casnode/util"
//  Logger.Info("msg")
//  Logger.Debug("msg")
//  Logger.Warn("msg")
//  Logger.Error("msg")
//  Logger.Fatal("msg")
var Logger *zap.SugaredLogger

func init() {
	Logger = getLogger()
	if Logger == nil {
		panic("Logger initialization failed")
	}
	Logger.Info("Logger initialization succeeded!")
}

func getLogger() *zap.SugaredLogger {
	// print log to console
	consoleEncoder := zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())
	consoleWriter := zapcore.Lock(os.Stdout)
	// write log to file
	encoder := getEncoder()
	writeSyncer := getLogWriter()
	// zapcore.DebugLevel set default log level to DEBUG
	var allCore []zapcore.Core

	if beego.AppConfig.String("Debug") == "true" {
		allCore = append(allCore, zapcore.NewCore(consoleEncoder, consoleWriter, zapcore.DebugLevel))
		allCore = append(allCore, zapcore.NewCore(encoder, writeSyncer, zapcore.DebugLevel))
	} else {
		allCore = append(allCore, zapcore.NewCore(encoder, writeSyncer, zapcore.InfoLevel))
	}
	core := zapcore.NewTee(allCore...)

	// zap.AddCaller() add the feature to log calling function information to the log.
	logger := zap.New(core, zap.AddCaller())

	return logger.Sugar()
}

func getEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder // use ISO8601TimeEncoder

	// Use uppercase letters to record log levels in log files
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	// NewJsonEncoder return a zapcore.Encoder that writes key-value pairs in a JSON format.
	return zapcore.NewJSONEncoder(encoderConfig)
}

func getLogWriter() zapcore.WriteSyncer {
	var logPath, logFile string
	if beego.AppConfig.String("logPath") == "" {
		logPath = "./logs"
	} else {
		logPath = beego.AppConfig.String("logPath")
	}
	if beego.AppConfig.String("logFile") == "" {
		logFile = "casnode.log"
	} else {
		logFile = beego.AppConfig.String("logFile")
	}

	baseLogPath := path.Join(logPath, logFile)
	//baseLogPath := "./logs/casnode.log"

	// create log file
	_, err := os.Stat(baseLogPath)
	if err != nil {
		if os.IsNotExist(err) {
			err := os.MkdirAll(logPath, os.ModePerm)
			if err != nil {
				panic(err)
			}
		}
	}
	writer, err := rotatelogs.New(
		baseLogPath+".%Y-%m-%d-%H-%M",
		rotatelogs.WithLinkName(baseLogPath),      // generate a soft link pointing to the latest log file
		rotatelogs.WithMaxAge(30*24*time.Hour),    // maximum file save time, 30 days
		rotatelogs.WithRotationTime(24*time.Hour), // log rotating interval
	)
	if err != nil {
		panic(err)
	}

	return zapcore.AddSync(writer)
}

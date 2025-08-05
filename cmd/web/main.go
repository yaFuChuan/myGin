package main

import (
	"crypto/tls"
	"database/sql"
	"flag"
	_ "github.com/denisenkom/go-mssqldb"
	"github.com/go-playground/form/v4"
	_ "github.com/sijms/go-ora/v2"
	"golang.org/x/crypto/acme/autocert"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"
	"github.com/yaFuChuan/myGin/internal/models"
	//"math"
	"github.com/alexedwards/scs/v2"
	//"github.com/alexedwards/scs/mssqlstore"
	//"fmt"
	//"net"
	//"io"
)

type config struct {
	addr  string
	xtest string
}

type application struct {
	infoLog        *log.Logger
	errLog         *log.Logger
	certs          *tls.Config
	certManager    *autocert.Manager
	xtest          *models.SnippetModel
	jar						 *models.SnippetModel 
	templateCache  map[string]*template.Template
	formDecoder    *form.Decoder
	sessionManager *scs.SessionManager
	users          *models.UserModel
}

func main() {

	f, err := os.OpenFile("./fLog.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0660)
	infoLog := log.New(f, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(f, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
	if err != nil {
		errorLog.Println(err)
	}
	defer f.Close()

	//set Taiwan Zone
	loc, err := time.LoadLocation("Asia/Taipei")
	if err != nil {
		errorLog.Printf("讀取 Asia/Taipei 時區失敗: %v", err)
	}

	var figVar config
	flag.StringVar(&figVar.addr, "addr", ":http", "Listen on 443 for HTTPS")

	flag.StringVar(&figVar.xtest, "xtest", "sqlserver://yafu:yafu@0314@192.168.6.20?database=DB_IWE&connection+timeout=300", "MSSQL")

	flag.Parse()

	var xtest *sql.DB
	xtest, err = openDB(figVar.xtest)
	if err != nil {
		errorLog.Println(err)
		//errorLog.Fatalf("無法連接 MSSQL 資料庫: %v", err)
	}
	defer xtest.Close()

	// 載入 .env 並連接 PostgreSQL
	pgDB, err := loadEnvAndConnectPostgres()
	if err != nil {
		errorLog.Printf("postgreSql conn failure:%v\n",err)
	} else {
		infoLog.Printf("✅ PostgreSQL 連線成功:%v\n",pgDB)
	}
	defer pgDB.Close()



	templateCache, err := newTemplateCache()
	if err != nil {
		errorLog.Fatal(err)
	}

	formDecoder := form.NewDecoder()

	// 初始化 sessionManager 並設置其 Lifetime
	sessionManager := scs.New()
	sessionManager.Lifetime = 4 * time.Hour
	sessionManager.Cookie.Secure = true //只透過 HTTPS 傳送
	sessionManager.Cookie.Persist = true
	sessionManager.Cookie.HttpOnly = true

	tlsConfig := &tls.Config{
		MinVersion:               tls.VersionTLS12,
		PreferServerCipherSuites: true,
		CurvePreferences:         []tls.CurveID{tls.X25519, tls.CurveP256},
		CipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}

	app := &application{
		infoLog:        infoLog,
		errLog:         errorLog,
		certs:          tlsConfig,
		xtest:          &models.SnippetModel{Xtest: xtest},
		templateCache:  templateCache,
		formDecoder:    formDecoder,
		sessionManager: sessionManager,
	}

	app.GetCert()

	// 啟動排程任務-存貨明細清單
		nowTaipei := time.Now().In(loc)
		// 假設我們想每天在早上 07:15 執行任務
		scheduledTime :=time.Date(nowTaipei.Year(),nowTaipei.Month(),nowTaipei.Day(), 7, 20, 0, 0, loc)
		app.scheduleTask(scheduledTime)

	// 創建 worklogs 表格
	//app.createWorklogTable(pgDB)

	infoLog.Printf("Starting server on :%v", figVar.addr)
	svr := &http.Server{
		Addr:           figVar.addr,
		Handler:        app.routes(),
		ErrorLog:       errorLog,
		TLSConfig:      app.certs,
		IdleTimeout:    24 * time.Hour,
		ReadTimeout:    300 * time.Second,
		WriteTimeout:   300 * time.Second,
		MaxHeaderBytes: 10485760,
	}

	//err = svr.ListenAndServeTLS("", "")
	err = svr.ListenAndServe()
	errorLog.Fatal(err)
}

func openDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("mssql", dsn)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}
func oracleDB(dbstr, dsn string) (*sql.DB, error) {
	db, err := sql.Open(dbstr, dsn)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}

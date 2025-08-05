package main

import (
	//"github.com/julienschmidt/httprouter"
	"net/http"
	"yafu/internal/models"
	"yafu/internal/validator"
	"encoding/json"
	"github.com/go-co-op/gocron"
	"database/sql"
	"os"
	"bytes"
	"time"
)

type salesInquiryForm struct {
	Empno               string `form:"empno"`
	Inquiry             string `form:"inquiry"`
	Inquiry2            string `form:"inquiry2"`
	Cusno               string `form:"cusno"`
	Iden                string `form:"iden"`
	Statistic           string `form:"statistic"`
	Delivery            string `form:"delivery"`
	validator.Validator `form:"-"`
}
type userSignupForm struct {
	Name                string `form:"name"`
	Email               string `form:"email"`
	Password            string `form:"password"`
	validator.Validator `form:"-"`
}
type userLoginForm struct {
	Email               string `form:"email"`
	Password            string `form:"password"`
	validator.Validator `form:"-"`
}

type PositionKey struct{
	Product	string
	Column	string
}

// 1) 請求的 JSON 結構
type reconciliationRequest struct {
    Cusnos    []string `json:"cusnos"`
    StartDate string   `json:"startDate"`
    EndDate   string   `json:"endDate"`
}

// 2) 回應的 JSON 結構
type reconciliationItem struct {
    Cusno     string                  `json:"Cusno"`
    Sales     []*models.AccList       `json:"Sales"`
    Inv       []*models.InvList       `json:"Inv"`
    NotRec    []*models.InvNotreceive `json:"NotRec"`
    BeforeAmt []*models.BeforeAmt     `json:"BeforeAmt"`
}

// 3) Handler 本體
func (app *application) home(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello"))
}

func (app *application) reconciliationHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")

    // 解析前端送過來的 JSON
    var req reconciliationRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        app.clientError(w, http.StatusBadRequest)
        return
    }

    // 逐一呼叫資料層的方法 (執行 stored procedures) :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
    var resp []reconciliationItem
    for _, cusno := range req.Cusnos {
        sales, _, err := app.xtest.Sales_List(cusno, req.StartDate, req.EndDate)
        if err != nil {
            app.errLog.Printf("Sales_List %s error: %v", cusno, err)
            continue
        }
        inv, _, err := app.xtest.Inv_List(cusno, req.StartDate, req.EndDate)
        if err != nil {
            app.errLog.Printf("Inv_List %s error: %v", cusno, err)
            continue
        }
        notRec, _, err := app.xtest.InvNotreceive(cusno, req.StartDate, req.EndDate)
        if err != nil {
            app.errLog.Printf("InvNotreceive %s error: %v", cusno, err)
            continue
        }
        beforeAmt, _, err := app.xtest.BeforeAmt(cusno, req.StartDate, req.EndDate)
        if err != nil {
            app.errLog.Printf("BeforeAmt %s error: %v", cusno, err)
            continue
        }

        resp = append(resp, reconciliationItem{
            Cusno:     cusno,
            Sales:     sales,
            Inv:       inv,
            NotRec:    notRec,
            BeforeAmt: beforeAmt,
        })
    }

    // 回傳 JSON
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        app.serverError(w, err)
    }
}

func (app *application) getCust(w http.ResponseWriter, r *http.Request) { 
	acc,d,err :=app.xtest.GetCust()
	if err != nil {
		app.errLog.Printf("handler cust list err:%v\n", err)
	}
	app.infoLog.Printf("fetch cust list: %v筆,time:%v 秒\n", len(acc),int64(d.Seconds()))

	jsonData, err := json.Marshal(acc)
	if err != nil {
		app.serverError(w, err) 
		return
	}

	w.Write(jsonData)
	acc = nil
}


func (app *application) getAcc(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Expires", "0")
	w.Header().Set("Pragma", "no-cache")
	data := app.newTemplateData(r)
	app.render(w, http.StatusOK, "getAcc.tmpl", data)
}


// trimLogFile 保留 fLog.txt 最後 500 筆
func trimLogFile(logFile string) {
	const maxLines = 350

	content, err := os.ReadFile(logFile)
	if err != nil {
		// 若檔案不存在，先建立空檔案
		if os.IsNotExist(err) {
			_ = os.WriteFile(logFile, []byte{}, 0660)
		}
		return
	}

	lines := bytes.Split(content, []byte("\n"))
	if len(lines) > maxLines {
		lines = lines[len(lines)-maxLines:]
	}
	_ = os.WriteFile(logFile, bytes.Join(lines, []byte("\n")), 0660)
}

func (app *application) scheduleTask(startTime time.Time) {
	app.infoLog.Println("app.receipts 存貨資料排程開始")
	// 強制設定台灣時區
	loc, err := time.LoadLocation("Asia/Taipei")
	if err != nil {
		app.errLog.Printf("設定時區失敗：%v\n", err)
		return
	}

	// 將傳入的時間轉換到台灣時區，並取得 HH:MM 格式字串
	startTime = startTime.In(loc)
	jobTime := startTime.Format("15:04")

	scheduler := gocron.NewScheduler(loc)

	// 定義執行任務的函式，失敗時會排程重試
	var task func()
	task = func(){
		app.infoLog.Println("執行 log 裁切任務")
		trimLogFile("fLog.txt")
	}
	/*
	task = func() {
		// 建立模擬的 HTTP 請求（根據實際需求替換）
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/receipts", nil)

		// 執行 receipts handler
		app.receipts(rr, req)
		if rr.Code == http.StatusOK {
			app.infoLog.Printf("app.receipts 執行成功，狀態碼：%v", rr.Code)
		} else {
			app.errLog.Printf("app.receipts 執行失敗，狀態碼：%v。10 分鐘後重試。", rr.Code)
			// 若失敗，排程 10 分鐘後重試一次
			// LimitRunsTo(1) 確保只執行一次重試任務
			_, err := scheduler.Every(10).Minutes().LimitRunsTo(1).Do(task)
			if err != nil {
				app.errLog.Printf("排程重試任務失敗：%v", err)
			}
		}
	}
	*/

	// 若目前時間已超過排程時間，先立即執行一次任務
	if time.Now().In(loc).After(startTime) {
		app.infoLog.Println("目前時間已超過排程時間，立即執行一次任務")
		task()
	}

	// 每日於指定時間執行任務
	//_, err = scheduler.Every(1).Day().At(jobTime).Do(task)
	// 每週一執行一次任務
	_, err = scheduler.Every(1).Week().Monday().At(jobTime).Do(task)
	if err != nil {
		app.errLog.Printf("排程任務設定失敗：%v", err)
		return
	}

	// 非同步啟動排程器
	scheduler.StartAsync()
}


func(app *application) createWorklogTable(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS worklogs (
		id SERIAL PRIMARY KEY,
		phone TEXT NOT NULL,
		name TEXT NOT NULL,
		task TEXT NOT NULL,
		content TEXT,
		log_time TIMESTAMP NOT NULL DEFAULT NOW(),
		latitude DOUBLE PRECISION,
		longitude DOUBLE PRECISION,
		photo1 TEXT,
		photo2 TEXT
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		app.errLog.Println("🚫 worklogs 表格建立失敗")
	}
	app.infoLog.Println("✅ worklogs 表格建立完成")
	return nil
}

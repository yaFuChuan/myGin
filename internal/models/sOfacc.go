package models
import(
	"time"
	"fmt"
	"log"
	"database/sql" 
	"runtime"
	"context"
	"sync"
	"reflect"
)

type SnippetModel struct {
	Xtest   *sql.DB
}

type AccList struct{
	Cusno		string
	Cname		string
	Ardd		time.Time
	Psno		string
	Trem		string
	Qty			float64
	Ut			string
	Up			float64
	Amt_net	float64
	Tax			float64
	Amt			float64
	Mrem		string
}

type InvList struct{
	Cusno		string
	Cname		string
	Invdd		time.Time
	Invno		string
	Rem			string
	Anet		float64
	Tax			float64
	InvAmt	float64
	Rem2		string
}

type InvNotreceive struct{
	Cusno   string
	Invdd   time.Time
	Invno   string
	Amt     float64
	Balance	float64
	Rem    	string
}

type BeforeAmt struct{
	Cusno   string
	Balance float64
}

type GCust struct{
	Cusno	string
	Name	string
}

func (m *SnippetModel) Sales_List(cust,d1,d2 string) ([]*AccList,time.Duration, error){

	start := time.Now()

	query :=`exec sales_list ?,?,?`
	acc,err :=MultiThreaded[AccList](m.Xtest,query,cust,d1,d2)
	if err != nil{
		return nil,0,fmt.Errorf("query acclist err is :%v\n",err)
	}

	duration := time.Now().Sub(start)
	return acc,duration,nil
}


func (m *SnippetModel) Inv_List(cust,d1,d2 string) ([]*InvList,time.Duration, error){

	start := time.Now()

	invQuery :=`exec Inv_list ?,?,?`
	inv,err :=MultiThreaded[InvList](m.Xtest,invQuery,cust,d1,d2)  
	if err !=nil{
		return nil,0,fmt.Errorf("query invlist err is :%v\n",err)
	}
	
	duration := time.Now().Sub(start)
	return inv,duration,nil
}

func (m *SnippetModel) InvNotreceive(cust,d1,d2 string) ([]*InvNotreceive,time.Duration, error){
	
	start := time.Now()

	invQuery :=`exec InvNotreceive ?,?,?`
	inv,err :=MultiThreaded[InvNotreceive](m.Xtest,invQuery,cust,d1,d2)  
	if err !=nil{
		return nil,0,fmt.Errorf("query Notreceive err is :%v\n",err)
	}
	
	duration := time.Now().Sub(start)
	return inv,duration,nil
}


func (m *SnippetModel) BeforeAmt(cust,d1,d2 string) ([]*BeforeAmt,time.Duration, error){
	
	start := time.Now()

	invQuery :=`exec bef_balance ?,?,?`
	inv,err :=MultiThreaded[BeforeAmt](m.Xtest,invQuery,cust,d1,d2)  
	if err !=nil{
		return nil,0,fmt.Errorf("query BeforeAmt err is :%v\n",err)
	}
	
	duration := time.Now().Sub(start)
	return inv,duration,nil
}


func (m *SnippetModel) GetCust() ([]*GCust,time.Duration, error){

	start := time.Now()

	invQuery :=`select isnull(cus_no,''),isnull(name,'') from cust where obj_id in('1','3')`
	inv,err :=MultiThreaded[GCust](m.Xtest,invQuery)  
	if err !=nil{
		log.Printf("❌ GetCust query failed: %v\n", err)
		return nil,0,fmt.Errorf("query Cust list err is :%v\n",err)
	}
	
	duration := time.Now().Sub(start)
	return inv,duration,nil
}


func MultiThreaded[T any](db *sql.DB, query string, args ...interface{}) ([]*T, error) {
	var rows *sql.Rows
	var err error

	// Channel to distribute work
	workerCount := runtime.NumCPU() * 2
	//fmt.Println("CPU workerCount:", workerCount)

	resultsChan := make(chan *T, workerCount*100) // Buffered channel to avoid blocking
	errorChan := make(chan error, 1)              // Error channel to propagate errors
	done := make(chan struct{})                   // Signal when all goroutines are done

	// Add a context with timeout for the query
	ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Second)
	defer cancel()

	if args != nil {
		rows, err = db.QueryContext(ctx, query, args...)
	} else {
		rows, err = db.QueryContext(ctx, query)
	}

	if err != nil {
		return nil, fmt.Errorf("query context error: %v", err)
	}
	defer rows.Close()

	var results []*T  // Slice to store the final results
	var mu sync.Mutex // Mutex to ensure safe access to the results slice

	var wg sync.WaitGroup
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for result := range resultsChan {
				mu.Lock()
				results = append(results, result)
				mu.Unlock()
			}
		}()
	}

	// Read data from rows and send to channel
	go func() {
		defer func() {
			close(resultsChan) // Ensure only one Goroutine closes the channel
		}()

		//2025/1/1
		if rows == nil {
			errorChan <- fmt.Errorf("rows is nil")
			return
		}

		for rows.Next() {
			dest := new(T) // Properly initialize the struct
			destValue := reflect.ValueOf(dest).Elem()

			fields := make([]interface{}, destValue.NumField())
			for i := 0; i < destValue.NumField(); i++ {
				field := destValue.Field(i)
				if !field.CanAddr() {
					errorChan <- fmt.Errorf("cannot address field %d", i)
					return
				}
				fields[i] = field.Addr().Interface()
			}

			if err := rows.Scan(fields...); err != nil {
				errorChan <- fmt.Errorf("scan error: %v", err)
				return
			}
			resultsChan <- dest
		}
		if err = rows.Err(); err != nil {
			errorChan <- fmt.Errorf("rows error: %v", err)
			return
		}
	}()

	// Wait for all workers to finish
	go func() {
		wg.Wait()
		close(done)
	}()

	// Wait for completion or error
	select {
	case <-done: // All work completed successfully
	case err := <-errorChan: // Handle any errors from workers
		return nil, err
	}
	return results, nil

}

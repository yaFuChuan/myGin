package main
import(
	"html/template"
	"path/filepath"
	"time"
  "github.com/leekchan/accounting"
)
type templateData struct{
	CurrentYear	int
	Form				any
	Timestamp string
	IsAuthenticated bool
	UserRole        string
}
func humanDate(t time.Time) string {
	return t.Format("01-02")
}
func currentDate() string{
  curr :=time.Now()
  return curr.Format("2006-01-02T15:04:05")
}
func countRecei(para ...float64) float64{
  var sum float64
  for _,v := range para {
    sum += v 
  }
  return sum
}
func secondPositive(para ...float64) float64{
  var sum float64 
  for k,v := range para {  
    if k== 1{
      v = v*-1
    }
    sum += v 
  }
  return sum
}

func formatPercent(v float64,iden int,symbol ...string) string{
  a :=accounting.Accounting{Precision:iden}
  if v==0.0{
    return ""
  }else{
    return a.FormatMoney(v*100)
  }
}

func formatZero(v float64,iden int,symbol ...string) string{
  a :=accounting.Accounting{Precision:iden}
  if v==0.0{
    return ""
  }else if(len(symbol)>0){
   return a.FormatMoney(v*-1.0)
  }else{
    return a.FormatMoney(v)
  }
}
func receivableAcc(para ...float64) string{
  var sum float64
  for _,v := range para {
    sum += v
  }
  return formatZero(sum,0)
}
var functions=template.FuncMap{
	"humanDate" : humanDate,
  "formatZero": formatZero,
  "receivaAcc": receivableAcc,
  "countRecei":countRecei,
  "currentDate":currentDate,
  "secondPositive":secondPositive,
  "formatPercent":formatPercent,
}

func newTemplateCache()(map[string]*template.Template,error){
	cache :=map[string]*template.Template{}
	pages,err:=filepath.Glob("./ui/html/pages/*.tmpl")
	if err!=nil{
		return nil,err
	}
	for _,page :=range pages{
		name :=filepath.Base(page)

		ts,err := template.New(name).Funcs(functions).ParseFiles("./ui/html/base.tmpl")
		if err != nil {
			return nil,err
		}
		ts,err =ts.ParseGlob("./ui/html/partials/*.tmpl")
		if err != nil {
			return nil,err
		}
		ts,err =ts.ParseFiles(page)
		if err!=nil{
			return nil,err
		}
		cache[name]=ts
	}
	return cache,nil
}

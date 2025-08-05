package main
import(
	"io"
	"encoding/json"
)
type cust struct{
}
func(c *cust)writeJson(w io.Writer) error{
	js,err :=json.Marshal(c)
	if err !=nil{
		return err
	}
	_,err =w.Write(js)
	return err
}

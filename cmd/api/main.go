package main
import (
	"fmt"
	"net/http"
)


func main(){
	mux :=http.NewServeMux()
	mux.HandleFunc("/{$}",home)
	err :=http.ListenAndServe(":http",mux)
	if err !=nil{
		fmt.Println(err)
	}
}

func home(w http.ResponseWriter, r *http.Request){
	fmt.Fprintf(w,"Hello, you've requested: %s\n", r.URL.Path)
}

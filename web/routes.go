package main
import(
	"net/http"
	"path/filepath"
	"crypto/tls"
	"golang.org/x/crypto/acme/autocert"
	"github.com/justinas/alice"
	"github.com/julienschmidt/httprouter"
	"context"
	"fmt"
	"os"
)

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 驗證邏輯
		token := r.Header.Get("passCode")
		if token == "" || token != "Xim@2023"{
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// 驗證通過，繼續執行下一個中間件或最終處理函數
		next.ServeHTTP(w, r)
	}
}

func (app *application) routes() http.Handler {
	router := httprouter.New()
	router.NotFound=http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
		app.notFound(w)
	})
	//mux := http.NewServeMux()
	fileServer := http.FileServer(http.Dir("./ui/static/"))
	router.Handler(http.MethodGet,"/static/*filepath",http.StripPrefix("/static",fileServer))
	//mux.Handle("/static/", http.StripPrefix("/static", fileServer))
	dynamic := alice.New(app.sessionManager.LoadAndSave)
  //dynamic := alice.New()
	//chain := alice.New(authMiddleware)

	router.Handler(http.MethodGet,"/",dynamic.ThenFunc(app.getAcc))
	router.Handler(http.MethodGet,"/getAcc/",dynamic.ThenFunc(app.getAcc))
	router.Handler(http.MethodGet,"/getCust/",dynamic.ThenFunc(app.getCust))
	router.Handler(http.MethodPost,"/api/reconciliation",dynamic.ThenFunc(app.reconciliationHandler))

	standard := alice.New(app.recoverPanic, app.logRequest, secureHeaders)
	//return app.recoverPanic(app.logRequest(secureHeaders(mux)))
	return standard.Then(router)
}


type neuteredFileSystem struct {
	fs http.FileSystem
}
func (nfs neuteredFileSystem) Open(path string) (http.File, error) {
	f, err := nfs.fs.Open(path)
	if err != nil {
		 return nil, err
	}
	s, err := f.Stat()
	if s.IsDir() {
		index := filepath.Join(path, "index.html")
		if _, err := nfs.fs.Open(index); err != nil {
			closeErr := f.Close()
			if closeErr != nil {
				return nil, closeErr
			}
			return nil, err
		}
	}
	return f, nil
}




func (app *application) GetCert() {
	var certManager = &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		HostPolicy:func(ctx context.Context, host string) error {
			if host == "jarlgene.duckdns.org" || host == "localhost" {
				return nil
			}
			return fmt.Errorf("acme/autocert: only specific hostnames are allowed")
		},
		Cache:      autocert.DirCache("certs"),
		Email:      "yafu0314@gmail.com",
	}

	app.certManager = certManager
	tlsCfg := certManager.TLSConfig()
	tlsCfg.GetCertificate = getAutocertOrSelfSignedCert(certManager)
	app.certs = tlsCfg
}


// 1. 先嘗試 Let's Encrypt
// 2. 再嘗試自簽（certs/cert.pem + certs/key.pem）
// 3. 都失敗就回傳錯誤
func getAutocertOrSelfSignedCert(certManager *autocert.Manager) func(*tls.ClientHelloInfo) (*tls.Certificate, error) {
    return func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
        // 1) Let's Encrypt
        if cert, err := certManager.GetCertificate(hello); err == nil && cert != nil {
            return cert, nil
        }
        // 2) 自簽憑證
        dirCache, ok := certManager.Cache.(autocert.DirCache)
        if !ok {
            dirCache = "certs"
        }
        crt := filepath.Join(string(dirCache), "cert.pem")
        key := filepath.Join(string(dirCache), "key.pem")
        if _, err1 := os.Stat(crt); err1 == nil {
            if _, err2 := os.Stat(key); err2 == nil {
                cert, err := tls.LoadX509KeyPair(crt, key)
                if err != nil {
                    return nil, fmt.Errorf("load self-signed cert failed: %w", err)
                }
                // 注意這裡要回傳 pointer
                return &cert, nil
            }
        }
        // 3) 都失敗，回傳最初的錯誤
        return nil, fmt.Errorf("no certificate available for %s", hello.ServerName)
    }
}

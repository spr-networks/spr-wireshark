package main

import (
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
)

var UNIX_PLUGIN_LISTENER = "/state/plugins/spr-wireshark/socket"

func httpInternalError(msg string, err error, w http.ResponseWriter) {
	fmt.Println(msg, err)
	http.Error(w, err.Error(), 500)
}

func handleGetStatus(w http.ResponseWriter, r *http.Request) {
}

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path, err := filepath.Abs(r.URL.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	path = filepath.Join(h.staticPath, path)
	_, err = os.Stat(path)
	if os.IsNotExist(err) {
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}

func logRequest(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
		handler.ServeHTTP(w, r)
	})
}

func handleChunkedTransfer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Transfer-Encoding", "chunked")

	// Generate or retrieve new data
	data, err := ioutil.ReadFile("/tmp/test.pcap")
	if err != nil {
		data = []byte("New data chunk")
	} else {
	}

	for {
		// Write the chunk size and data to the response
		fmt.Fprintf(w, "%x\r\n", len(data))
		w.Write(data)
		fmt.Fprint(w, "\r\n")

		// Flush the response to send the chunk immediately
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}

		// Delay before sending the next chunk
		time.Sleep(1 * time.Second)
	}
}

func main() {
	//	loadConfig()

	unix_plugin_router := mux.NewRouter().StrictSlash(true)

	unix_plugin_router.HandleFunc("/status", handleGetStatus).Methods("GET")
	unix_plugin_router.HandleFunc("/chunktest", handleChunkedTransfer).Methods("GET")

	// map /ui to /ui on fs
	spa := spaHandler{staticPath: "/ui", indexPath: "index.html"}
	unix_plugin_router.PathPrefix("/").Handler(spa)

	os.Remove(UNIX_PLUGIN_LISTENER)
	unixPluginListener, err := net.Listen("unix", UNIX_PLUGIN_LISTENER)
	if err != nil {
		panic(err)
	}

	pluginServer := http.Server{Handler: logRequest(unix_plugin_router)}

	pluginServer.Serve(unixPluginListener)
}
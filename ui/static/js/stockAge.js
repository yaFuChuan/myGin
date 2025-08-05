
//window.sUrl = 'http://localhost:4001/stockAge/';
//window.sUrl = 'http://192.168.0.190:5001/stockAge/';
window.sUrl ='http://survey.bgdrug.com.tw:40011/stockAge/'; 



document.addEventListener("DOMContentLoaded", () => {
    const tableContainer = document.getElementById("tableContainer");
    const table = document.getElementById("stockTable");
    let tableBody = table.querySelector("tbody");
    const tableHead = table.querySelector("thead");
    let allData = [];
    let pageSize = 50;
    let currentPage = 0;
    let isLoading = false;
    let sortColumn = null;
    let sortDirection = 1;
    let filters = {};
    let filteredData = [];

    if (!tableBody) {
        console.warn("⚠️ 警告: 找不到 <tbody>，系統將自動建立！");
        tableBody = document.createElement("tbody");
        table.appendChild(tableBody);
    }


function sortTable(colIndex) {
    // 定義欄位對應的 key
    const keys = ["品號", "倉庫", "單據", "批號", "效期", "儲位", "累計順序", "數量", "原入庫日"];

    // 切換排序方向：同一欄位則反轉排序，否則預設遞增排序
    if (sortColumn === colIndex) {
        sortDirection *= -1;
    } else {
        sortColumn = colIndex;
        sortDirection = 1;
    }

    // 進行排序：根據不同資料型別做轉換（日期、數字等）
    filteredData.sort((a, b) => {
        let key = keys[colIndex];
        let valA = a[key] || "";
        let valB = b[key] || "";

        // 如果是日期欄位
        if (key === "效期" || key === "原入庫日") {
            valA = new Date(valA).getTime() || 0;
            valB = new Date(valB).getTime() || 0;
        }
        // 如果是數值欄位
        else if (key === "累計順序" || key === "數量") {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }
        // 其他預設以字串比對

        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;
        return 0;
    });

    // 重新渲染資料：清空表身，重置頁碼，載入排序後的第一頁
    tableBody.innerHTML = "";
    currentPage = 0;
    loadMoreData();
}

    async function fetchStockData() {
        try {
            const response = await fetch(window.sUrl, {
                method: 'GET',
                headers: { 'source': window.location.pathname.split('/').filter(Boolean)[0] || '' }
            });

            if (!response.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);

            allData = await response.json();
            console.log('📌 取得庫存數據:', allData);

            
            // **新增篩選條件，console.log 出品號為 "05113238" 的數據**
          /*
            allData.forEach(row => {
                if (row.品號 === "05113238") {
                    console.log("🔍 發現品號 05113238 的數據:", row);
                }
            });
            */
            
            filteredData = allData; // 初始化篩選數據
            tableBody.innerHTML = "";
            currentPage = 0;
            loadMoreData();
        } catch (error) {
            console.error('取得數據時發生錯誤:', error);
            alert("無法取得庫存數據，請稍後再試！");
        }
    }
    
    function loadMoreData() {
        if (isLoading) return;
        isLoading = true;

        const dataToLoad = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
        
        if (dataToLoad.length === 0) {
            isLoading = false;
            return;
        }

        renderTableRows(dataToLoad);
        currentPage++;
        isLoading = false;
    }

                
    function formatDate(dateStr) {
        if (!dateStr || dateStr.trim() === "") return ""; // 避免空值錯誤

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return ""; // 無效日期則回傳空白

        const formattedDate = date.toISOString().split('T')[0]; // 轉換成 YYYY-MM-DD 格式

        return formattedDate === "1900-01-01" ? "" : formattedDate; // 1900-01-01 顯示空白，否則回傳日期
    }

    function renderTableRows(data) {
        const fragment = document.createDocumentFragment();

        data.forEach(item => {
            const row = document.createElement("tr");
            row.dataset.rowValues = JSON.stringify(item);

            
        // 建立每個 <td> 並設定樣式
        const cellValues = [
            item.品號 || '-',
            item.倉庫 || '-',
            item.單據 === "UNKNOWN" ? '' : (item.單據 || '-'),
            item.批號 === "UNKNOWN" ? '' : (item.批號 || '-'),
            formatDate(item.效期),
            item.儲位 || '-',
            item.累計順序 || '-',
            item.數量 || '-',
            formatDate(item.原入庫日),
            calculateStockAge(item.原入庫日)
        ];
        
            
            cellValues.forEach((text, index) => {
                const td = document.createElement("td");
                td.textContent = text;
                td.style.padding = "10px";
                td.style.border = "1px solid #ddd";
                // 若是數量或庫齡天數欄則靠右對齊 (數量：index 7, 庫齡天數：index 9)
                if (index === 7 || index === 9) {
                    td.style.textAlign = "right";
                }
                row.appendChild(td);
            });
        
            fragment.appendChild(row);
        });
        

        tableBody.appendChild(fragment);
    }

    function filterTable() {
      const keys = ["品號", "倉庫", "單據", "批號", "效期", "儲位", "累計順序", "數量", "原入庫日"];
        filteredData = allData.filter(rowData => {
            return Object.keys(filters).every(colIndex => {
                let searchTerm = filters[colIndex]?.trim();
                if (!searchTerm) return true;

                // 使用 keys 陣列正確取得欄位值
                let key = keys[colIndex];
                let cellValue = (rowData[key] || "").toString().trim();
                //let cellValue = (Object.values(rowData)[colIndex] || "").toString().trim();
                return cellValue.startsWith(searchTerm);
            });
        });

        // 確保品號有匹配時不會清空數據
        if (filters[0] && filteredData.length === 0) {
            filteredData = allData.filter(rowData => rowData.品號?.startsWith(filters[0]));
        }

        tableBody.innerHTML = "";
        currentPage = 0;
        isLoading = false;
        loadMoreData();
    }

    function addTableFeatures() {
        if (!tableHead) return;
        const headers = tableHead.querySelectorAll("th");

        let filterRow = document.createElement("tr");
        let filterInputs = {};

        headers.forEach((th, index) => {
            th.style.cursor = "pointer";
            th.addEventListener("click", () => sortTable(index));

            let filterTh = document.createElement("th");
            let filterInput = document.createElement("input");
            filterInput.type = "text";
            filterInput.placeholder = `過濾 ${th.textContent}`;
            filterInput.style.width = "90%";
            filterInput.style.padding = "4px";
            filterInput.dataset.columnIndex = index;

            filterInputs[index] = filterInput;
            filterTh.appendChild(filterInput);
            filterRow.appendChild(filterTh);

            filterInput.addEventListener("input", function () {
                filters[index] = filterInput.value.trim();
                filterTable();
            });
        });

        tableHead.appendChild(filterRow);
    }
    
    function observeScroll() {
        const loadMoreTrigger = document.createElement("div");
        loadMoreTrigger.id = "loadMoreTrigger";
        loadMoreTrigger.style.height = "1px";
        loadMoreTrigger.style.width = "100%";
        loadMoreTrigger.style.marginTop = "10px";
        tableContainer.appendChild(loadMoreTrigger);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMoreData();
                }
            });
        }, { 
            // 若 tableContainer 為捲動容器，可設定 root 為 tableContainer
            // 若採用全頁滾動，則保持 root: null
            root: null,
            rootMargin: "0px 0px 150px 0px", // 下方預留 150px 的觸發空間
            threshold: 0
        });

        observer.observe(loadMoreTrigger);
    }

    fetchStockData();
    addTableFeatures();
    observeScroll();
    
});


function calculateStockAge(stockDate) {
    if (!stockDate) return '-';
    let originalDate = new Date(stockDate);
    if (isNaN(originalDate.getTime())) return '-';
    let today = new Date();
    // 取得兩個日期相差的毫秒數，再轉換成天數
    let diffTime = today - originalDate;
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

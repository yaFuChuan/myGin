//const BASE_URL = 'http://192.168.0.190:5001';
//const BASE_URL = 'http://localhost:4001';
const BASE_URL = 'http://survey.bgdrug.com.tw:40011';
//window.sUrl = 'https://survey.bgdrug.com.tw:40011/receipts/?page=1&pageSize=5000';
//window.sUrl = 'https://localhost:4001/receipts/?page=1&pageSize=5000';


// 建立單據代號選項清單
const psidOptions = [
  { code: "SP", text: "23年開帳單" },
  { code: "PC", text: "進貨單" },
  { code: "+icIC", text: "調入增單" },
  { code: "IZ", text: "到貨確認" },
  { code: "SB", text: "銷退單" },
  { code: "SD", text: "銷折單" },
  { code: "mfmb-MB", text: "組合增加" },
  { code: "tfmb-MD", text: "拆裝入" },
  { code: "BN", text: "借入單" },
  { code: "rLN", text: "借出還回單" },
  { code: "+IJ", text: "調整增" },
  { code: "+IQ", text: "月末成本增" },
  { code: "+XE", text: "非生產退料增" },
  { code: "SA", text: "銷貨單" },
  { code: "IC", text: "調出減" },
  { code: "PB", text: "進退單" },
  { code: "PD", text: "進折單" },
  { code: "mfmb-MD", text: "拆裝減" },
  { code: "tfmb-MB", text: "組合減" },
  { code: "-IJ", text: "調整減" },
  { code: "-IQ", text: "月末成本減" },
  { code: "-XB", text: "非生產領料減" },
  { code: "-XJ", text: "報廢減" },
  { code: "rBN", text: "借入還回減" },
  { code: "cwdb_", text: "儲位調減" },
  { code: "cwdb", text: "儲位調增" }
];

function getStock(url){
  fetch(url, {
    method: 'GET',
    headers: {
      'source': '',  
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('存貨清單已取得：', data);

    // 建立表格欄位與欄寬設定
    let head = ['累計順序','日期','單據','項次','據項','識別','品號','品名','倉庫','儲位','批號','效期',
      '數量','符號','前期+本期數量累計','前期+本期成本累計','說明','未稅','成本','稅金','含稅','外幣','外金'];
    let columnWidths = ['20px','40px','40px','5px','5px', '5px','50px','90px','15px','10px', '20px',
      '30px', '10px','5px','30px','30px','40px', '10px','10px','10px','10px','10px','10px'];

    let table = document.createElement("table");
    let theadElem = document.createElement("thead");
    let tbodyElem = document.createElement("tbody");
    table.id = 'myTable';
    table.style.width = '100%';
    table.style.tableLayout = 'auto';
    table.style.fontSize = '12px';

    // 建立表頭
    let headerRow = document.createElement("tr");
    head.forEach(function(item, index) {
      let th = document.createElement("th");
      th.style.padding = '15px';
      th.style.width = columnWidths[index] || '40px'; 
      th.textContent = item;
      headerRow.appendChild(th);
    });
    theadElem.appendChild(headerRow);
    table.appendChild(theadElem);
    table.appendChild(tbodyElem);

    // 產生資料列
    data.forEach(function(record) {
      let tr = document.createElement("tr");
      head.forEach(function(key) {
        let td = document.createElement("td");
        let value = record[key] || '';

        // 處理日期與效期欄位
        if ((key === '日期' || key === '效期') && value) {
          if(value === "1900-01-01T00:00:00Z" || value === "1899-12-30T00:00:00Z") {
            value = ''; // 預設日期則顯示空白
          } else {
            value = formatDate(value);
          }
        }

        // 當欄位為「識別」時，檢查其值是否符合 psOptions 中的 code，若是則顯示對應中文名稱
        if (key === '識別' && value) {
          const matched = psidOptions.find(opt => opt.code === value);
          if (matched) {
            value = matched.text;
          }
        }

        td.textContent = value;
        tr.appendChild(td);
      });
      tbodyElem.appendChild(tr);
    });
    
    // 將表格加入指定容器中
    let myMain = document.getElementById("myMain2");
    myMain.innerHTML = ''; // 清空原有內容
    myMain.appendChild(table);

    setupDraggableColumns();

    // -----------------------------
    // 新增過濾列 (篩選功能)
    let filterRow = document.createElement('tr');
    head.forEach(function (item, index) {
      let filterTh = document.createElement('th');
      filterTh.style.padding = '10px';
      filterTh.style.width = columnWidths[index] || '50px';
      
      let filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = `過濾${item}`;
      filterInput.style.width = '90%'; 
      filterInput.style.padding = '4px';
      filterInput.dataset.columnIndex = index; 
      filterTh.appendChild(filterInput);
      
      filterInput.addEventListener('input', function () {
        let filterValues = [];
        let inputs = filterRow.querySelectorAll('input');
        inputs.forEach(input => {
          filterValues[input.dataset.columnIndex] = input.value.toLowerCase();
        });
        
        Array.from(tbodyElem.rows).forEach(row => {
          let shouldDisplay = true;
          Array.from(row.cells).forEach((cell, colIndex) => {
            if (filterValues[colIndex] && !cell.textContent.toLowerCase().includes(filterValues[colIndex])) {
              shouldDisplay = false;
            }
          });
          row.style.display = shouldDisplay ? '' : 'none';
        });
      });
      filterRow.appendChild(filterTh);
    });
    theadElem.appendChild(filterRow);

    // 綁定表頭排序事件
    setupSortEvents();
  })
  .catch(error => {
    console.error('取得清單時發生錯誤:', error);
  });
}

// 表頭排序事件綁定
function setupSortEvents() {
  document.querySelectorAll("#myTable thead tr:first-child th").forEach(th => {
    th.dataset.order = 'asc';
    th.addEventListener("click", function (event) {
      const columnIndex = event.currentTarget.cellIndex;
      let currentOrder = this.dataset.order;
      let newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      this.dataset.order = newOrder;
      
      sortTable(columnIndex, newOrder);
    });
  });
}

// 定義排序函式
function sortTable(columnIndex, order) {
  const table = document.getElementById("myTable");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);

  rows.sort((a, b) => {
    let aText = a.cells[columnIndex].textContent.trim().toLowerCase();
    let bText = b.cells[columnIndex].textContent.trim().toLowerCase();
    if(aText === bText) return 0;
    return order === 'asc'
      ? (aText > bText ? 1 : -1)
      : (aText < bText ? 1 : -1);
  });

  rows.forEach(row => tbody.appendChild(row));
}


// 檢查並轉換輸入的日期格式
function formatInputDate(value) {
  // 若輸入為 8 位數字，例如 20230307，則轉換為 2023-03-07
  if (/^\d{8}$/.test(value)) {
    return value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
  }
  return value;
}

// 分頁及篩選控制元件建立
document.addEventListener('DOMContentLoaded', function(){
  let paginationContainer = document.createElement('div');
  paginationContainer.id = 'paginationControls';

  // 建立「頁碼」下拉選單 (預設 1~500 頁)
  let pageSelect = document.createElement('select');
  pageSelect.id = 'pageSelect';
  for(let i = 1; i <= 500; i++){
    let opt = document.createElement('option');
    opt.value = i;
    opt.text = '第 ' + i + ' 頁';
    if(i === 1) opt.selected = true;
    pageSelect.appendChild(opt);
  }
  
  // 輸入開始日期、結束日期、貨品代號、倉庫代號、單據代號
  let startDateInput = document.createElement('input');
  startDateInput.id = 'startDate';
  startDateInput.placeholder = '開始日期 (YYYY-MM-DD)';
  startDateInput.style.marginRight = '10px';

  let endDateInput = document.createElement('input');
  endDateInput.id = 'endDate';
  endDateInput.placeholder = '結束日期 (YYYY-MM-DD)';
  endDateInput.style.marginRight = '10px';

  // 加入日期格式轉換事件
  startDateInput.addEventListener('blur', function(e) {
    e.target.value = formatInputDate(e.target.value);
  });
  endDateInput.addEventListener('blur', function(e) {
    e.target.value = formatInputDate(e.target.value);
  });

  // 接下來將輸入框加入容器
  paginationContainer.appendChild(startDateInput);
  paginationContainer.appendChild(endDateInput);

  let prdnoInput = document.createElement('input');
  prdnoInput.id = 'prdno';
  prdnoInput.placeholder = '貨品代號';
  prdnoInput.style.marginRight = '10px';

  let whInput = document.createElement('input');
  whInput.id = 'wh';
  whInput.placeholder = '倉庫代號';
  whInput.style.marginRight = '10px';


  /*
  let psInput = document.createElement('input');
  psInput.id = 'psid';
  psInput.placeholder = '單據代號';
  psInput.style.marginRight = '10px';
  */

let psSelect = document.createElement('select');
psSelect.id = 'psid';
psSelect.style.marginRight = '10px';


// 新增一個預設空白選項
let emptyOption = document.createElement('option');
emptyOption.value = '';
emptyOption.text = '請選擇單據代號';
emptyOption.selected = true;
psSelect.appendChild(emptyOption);

const psOptions = [
  { code: "SP", name: "23年開帳單" },
  { code: "PC", name: "進貨單" },
  { code: "+icIC", name: "調入增單" },
  { code: "IZ", name: "到貨確認" },
  { code: "SB", name: "銷退單" },
  { code: "SD", name: "銷折單" },
  { code: "mfmb-MB", name: "組合增加" },
  { code: "tfmb-MD", name: "拆裝入" },
  { code: "BN", name: "借入單" },
  { code: "rLN", name: "借出還回單" },
  { code: "+IJ", name: "調整增" },
  { code: "+IQ", name: "月末成本增" },
  { code: "+XE", name: "非生產退料增" },
  { code: "SA", name: "銷貨單" },
  { code: "IC", name: "調出減" },
  { code: "PB", name: "進退單" },
  { code: "PD", name: "進折單" },
  { code: "mfmb-MD", name: "拆裝減" },
  { code: "tfmb-MB", name: "組合減" },
  { code: "-IJ", name: "調整減" },
  { code: "-IQ", name: "月末成本減" },
  { code: "-XB", name: "非生產領料減" },
  { code: "-XJ", name: "報廢減" },
  { code: "rBN", name: "借入還回減" }
];

psOptions.forEach(item => {
  let option = document.createElement('option');
  option.value = item.code;
  option.text = item.name;
  psSelect.appendChild(option);
});

  paginationContainer.appendChild(pageSelect);
  paginationContainer.appendChild(startDateInput);
  paginationContainer.appendChild(endDateInput);
  paginationContainer.appendChild(prdnoInput);
  paginationContainer.appendChild(whInput);                                                      
  //paginationContainer.appendChild(psInput);                                                       
  paginationContainer.appendChild(psSelect);

  // 建立「每頁筆數」下拉選單
  let pageSizeSelect = document.createElement('select');
  pageSizeSelect.id = 'pageSizeSelect';
  [5000, 10000, 15000, 20000, 30000, 40000].forEach(function(size){
    let opt = document.createElement('option');
    opt.value = size;
    opt.text = size + ' 筆';
    // 可根據需求設定預設值
    pageSizeSelect.appendChild(opt);
  });
  paginationContainer.appendChild(pageSizeSelect);

  // 建立「取得存貨清單」按鈕
  let fetchButton = document.createElement('button');
  fetchButton.textContent = '取得存貨清單';
  fetchButton.addEventListener('click', function(){
    let page = document.getElementById('pageSelect').value;
    let pageSize = document.getElementById('pageSizeSelect').value;
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    let prdno = document.getElementById('prdno').value;
    let wh = document.getElementById('wh').value;  
    let psid = document.getElementById('psid').value;  

    // 組合 URL，僅當參數有值時加入
    let url = BASE_URL + '/receipts/?page=' + page + '&pageSize=' + pageSize;
    
    if(startDate) {
      url += '&startDate=' + encodeURIComponent(startDate);
    }
    if(endDate) {
      url += '&endDate=' + encodeURIComponent(endDate);
    }
    if(prdno) {
      url += '&prdno=' + encodeURIComponent(prdno);
    }
    if(wh) {
      url += '&wh=' + encodeURIComponent(wh);
    }
    if(psid) {
      url += '&psid=' + encodeURIComponent(psid);
    }
    //window.sUrl = url;
    console.log('選擇的分頁條件：', url);
    getStock(url);
  });
  paginationContainer.appendChild(fetchButton);

  // 將分頁控制元件加入指定容器中
  document.getElementById('something').appendChild(paginationContainer);
});

// 格式化日期函式，輸出 "YYYY-MM-DD" 格式
function formatDate(dateString) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  return `${year}-${month}-${day}`;
}



//export csv

// =====================
// 新增「轉出資料」按鈕
// =====================


// 假設已有一個容器，例如 id 為 "something" 的元素，將按鈕加入此容器中
let exportButton = document.createElement('button');
exportButton.textContent = '轉出資料';
exportButton.style.marginLeft = '10px';
// 綁定點擊事件，先驗證密碼再觸發 exportData 函式
exportButton.addEventListener('click', function() {
  // 詢問密碼
  const password = prompt("請輸入密碼以轉出 CSV 檔案：");
  // 預設正確密碼為 "yourPassword"，可依需求修改
  if (password !== "yourPassword") {
    alert("密碼錯誤，無法轉出資料！");
    return; // 密碼錯誤則中止
  }
  // 密碼正確，執行轉出資料流程
  exportData();
});
document.getElementById('something').appendChild(exportButton);

// =====================
// 新增進度顯示區塊
// =====================
let progressDiv = document.createElement('div');
progressDiv.id = 'progressStatus';
progressDiv.style.marginTop = '10px';
progressDiv.textContent = '尚未開始轉出資料';
document.getElementById('something').appendChild(progressDiv);


// =====================
// 定義下載 CSV 的輔助函式（避免使用 join()）
// =====================

function downloadCSVFromRows(csvRows, filename) {
  // 為第一筆資料加上 BOM
  if (csvRows.length > 0) {
    csvRows[0] = "\ufeff" + csvRows[0];
  }
  const blob = new Blob(csvRows, { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // for IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// =====================
// 修改 exportData 函式
// =====================

function exportData() {
  let batch = 1;
  const pageSize = 200000; // 每批 20 萬筆資料
  let totalRecords = 0;      // 全部處理的資料筆數
  let fileRecordCount = 0;   // 當前檔案內已累積的資料筆數
  let csvRows = [];          // 儲存當前 CSV 檔內容
  const MAX_RECORDS_PER_FILE = 1000000; // 每檔最大筆數（不含表頭）
  let fileIndex = 1;         // CSV 檔案編號
  
  // 根據條件決定表頭內容

  const headers = Array.from(document.querySelectorAll("#myTable thead tr:first-child th")).map(th => th.textContent.trim());

  const psid = document.getElementById('psid').value;
  if (psid) {
    headers = headers.filter(header => header !== '累計順序' && header !== '前期+本期數量累計' && header !== '前期+本期成本累計');
  }
  
  // 初始化 CSV 陣列，先加入表頭（含換行）
  csvRows.push(headers.join(",") + "\n");
  
  // 取得使用者輸入的篩選條件
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const prdno = document.getElementById('prdno').value;
  const wh = document.getElementById('wh').value;
  
  updateProgress(batch, totalRecords);
  
  function fetchBatch() {
    let url = BASE_URL + '/receipts/?page=' + batch + '&pageSize=' + pageSize;
    if (startDate) {
      url += '&startDate=' + encodeURIComponent(startDate);
    }
    if (endDate) {
      url += '&endDate=' + encodeURIComponent(endDate);
    }
    if (prdno) {
      url += '&prdno=' + encodeURIComponent(prdno);
    }
    if (wh) {
      url += '&wh=' + encodeURIComponent(wh);
    }
    if (psid) {
      url += '&psid=' + encodeURIComponent(psid);
    }
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
  
          data.forEach(record => {
            // 依照 headers 順序建立資料列
            let row = headers.map(header => {

              let value = record[header] || "";

              if ((header === '日期' || header === '效期') && value) {
                if (value === "1900-01-01T00:00:00Z" || value === "1899-12-30T00:00:00Z") {
                  value = '';
                } else {
                  value = formatDate(value);
                }
              }

              // 強制將品號欄位轉成文字格式，避免 Excel 自動格式化
              if ((header === '品號' || header === '識別') && value) {
                value = '="' + value + '"';
              }


              // 當欄位為「識別」時，檢查其值是否符合 psOptions 中的 code，若是則顯示對應中文名稱
              if (header === '識別' && value) {
                const matched = psidOptions.find(opt => opt.code === value);
                if (matched) {
                  value = matched.text;
                }
              }
              
            // 當欄位值內有逗號、換行或雙引號時，進行轉義處理
              if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
              // 將欄位中的雙引號替換成兩個雙引號，並以雙引號包起來
                value = '"' + value.replace(/"/g, '""') + '"';
              }
              return value;
            });
  
            csvRows.push(row.join(",") + "\n");
            totalRecords++;
            fileRecordCount++;
  
            // 若當前檔案已達上限，則下載此檔並重置 csvRows 與計數器
            if (fileRecordCount >= MAX_RECORDS_PER_FILE) {
              downloadCSVFromRows(csvRows, `exported_data_part_${fileIndex}.csv`);
              fileIndex++;
              fileRecordCount = 0;
              csvRows = [];
              // 每個新檔案需重新加上表頭
              csvRows.push(headers.join(",") + "\n");
            }
          });
  
          batch++;
          updateProgress(batch, totalRecords);
          setTimeout(fetchBatch, 0);
        } else {
          // 若還有剩餘資料（未達上限但非空），則下載最後一個 CSV 檔案
          if (csvRows.length > 1) {
            downloadCSVFromRows(csvRows, `exported_data_part_${fileIndex}.csv`);
          }
          progressDiv.textContent = "全部資料已轉出，共 " + totalRecords + " 筆資料。";
        }
      })
      .catch(error => {
        console.error("讀取資料時發生錯誤:", error);
        alert("讀取資料時發生錯誤，請檢查 console 以了解詳細訊息。");
      });
  }
  
  fetchBatch();
}

// =====================
// 更新進度訊息的函式
// =====================
function updateProgress(currentBatch, totalRecords) {
  let progressDiv = document.getElementById('progressStatus');
  progressDiv.textContent = "正在轉出資料，已處理批次：" + (currentBatch - 1) + "，累計筆數：" + totalRecords;
}

// =====================
// 定義下載 CSV 的輔助函式
// =====================

// 將 BOM 加入 CSV 內容，確保 Excel 正確讀取編碼

function downloadCSV(csvContent, filename) {
  // 在 CSV 內容前加上 BOM，確保 Excel 正常顯示 UTF-8 字元
  const csvDataWithBom = "\ufeff" + csvContent;
  // 利用 data URI 方式處理 CSV 內容，並利用 encodeURIComponent 轉換字串
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvDataWithBom);
  link.download = filename;
  link.click();
}



// 變數紀錄目前拖曳的來源欄位索引
let draggedColumnIndex = null;

// 在建立表頭時，對每個 th 元素加入 draggable 屬性和拖曳事件
function setupDraggableColumns() {
  const headerCells = document.querySelectorAll("#myTable thead tr:first-child th");
  headerCells.forEach(th => {
    th.setAttribute("draggable", true);

    th.addEventListener("dragstart", function (e) {
      draggedColumnIndex = this.cellIndex;
      // 可加入一些視覺效果，例如設定透明度
      e.dataTransfer.effectAllowed = "move";
    });

    th.addEventListener("dragover", function (e) {
      // 必須取消預設行為才允許 drop
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    th.addEventListener("drop", function (e) {
      e.preventDefault();
      const targetIndex = this.cellIndex;
      if (draggedColumnIndex !== null && draggedColumnIndex !== targetIndex) {
        moveTableColumn(draggedColumnIndex, targetIndex);
      }
      draggedColumnIndex = null;
    });
  });
}

// 根據來源與目標索引，重新排列整個表格的欄位順序
function moveTableColumn(fromIndex, toIndex) {
  const table = document.getElementById("myTable");
  // 逐列處理，包括表頭和 tbody 的每一列
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    // 取得要移動的 cell
    const cell = row.cells[fromIndex];
    // 如果目標索引大於現有數量，就直接 append
    if (toIndex >= row.cells.length) {
      row.appendChild(cell);
    } else {
      // 若來源欄位在目標之前，注意移除 cell 後目標索引會改變
      if (fromIndex < toIndex) {
        row.insertBefore(cell, row.cells[toIndex + 1]);
      } else {
        row.insertBefore(cell, row.cells[toIndex]);
      }
    }
  }
}

// 在表格建立完畢後，呼叫 setupDraggableColumns() 綁定拖曳事件
// 例如在 getStock() 裡面 append 表格到 DOM 之後呼叫
// myMain.appendChild(table);
// setupDraggableColumns();

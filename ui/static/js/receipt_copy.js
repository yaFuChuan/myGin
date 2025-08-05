//window.sUrl = 'https://survey.bgdrug.com.tw:40011/receipts/?page=1&pageSize=5000';
window.sUrl = 'https://localhost:4001/receipts/?page=1&pageSize=5000';

function getStock(){
  fetch(sUrl, {
    method: 'GET',
    headers: {
      'source': '',  
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('存貨清單已取得：', data);

  // 新的排序邏輯：先依「品號」、「倉庫」、「儲位」、「批號」群組，再依「累計順序」遞增排序

  data.sort((a, b) => {
    // 先依「品號」、「倉庫」、「儲位」、「批號」群組排序
    const groupFields = ["品號", "倉庫", "儲位", "批號"];
    for (let field of groupFields) {
      if (a[field] < b[field]) return -1;
      if (a[field] > b[field]) return 1;
    }
    // 若群組欄位相同，則依日期遞增排序
    let dateA = new Date(a["日期"]);
    let dateB = new Date(b["日期"]);
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    
    // 若日期也相同，再依「累計順序」遞增排序
    return parseFloat(a["累計順序"]) - parseFloat(b["累計順序"]);
  });


    // 這裡可以依據取得的資料做進一步處理，例如產生表格內容
    let head = ['累計順序','日期','單據','項次','據項','識別','品號','品名','倉庫','儲位','批號','效期',
      '數量','數量累計','成本累計','說明','未稅','成本','稅金','含稅','外幣','外金'];
    let columnWidths = ['20px','40px','40px','5px','5px', '5px','50px','90px','15px','10px', '20px',
      '30px', '10px','30px','30px','60px', '10px','10px','10px','10px','10px','10px'];

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

    // 假設 data 為陣列，每筆資料為物件
    data.forEach(function(record) {
      let tr = document.createElement("tr");
      head.forEach(function(key) {
        let td = document.createElement("td");
        let value = record[key] || '';

        // 處理日期和效期欄位
        if ((key === '日期' || key === '效期') && value) {
          if(value === "1900-01-01T00:00:00Z" || value === "1899-12-30T00:00:00Z") {
            value = ''; // 當日期為預設日期時，呈現空白
          } else {
            value = formatDate(value);
          }
        }

        td.textContent = value;
        tr.appendChild(td);
      });
      tbodyElem.appendChild(tr);
    });
    
    // 將表格加入指定容器中
    let myMain = document.getElementById("myMain2");
    myMain.innerHTML = ''; // 先清空原有內容
    myMain.appendChild(table);

    // -----------------------------
    // 新增過濾列
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
    // 加入 filterRow 到 theadElem
    theadElem.appendChild(filterRow);

    // 綁定表頭排序事件
    setupSortEvents();
  })
  .catch(error => {
    console.error('取得清單時發生錯誤:', error);
  });
}

// "myTable" thead sort
function setupSortEvents() {
  document.querySelectorAll("#myTable thead tr:first-child th").forEach(th => {
    // 預設排序為升冪 (asc)
    th.dataset.order = 'asc';
    th.addEventListener("click", function (event) {
      const columnIndex = event.currentTarget.cellIndex;
      // 取得目前的排序狀態，並切換
      let currentOrder = this.dataset.order;
      let newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      this.dataset.order = newOrder;
      
      sortTable(columnIndex, newOrder);
    });
  });
}

// 這裡請自行定義 sortTable 函式
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

// 當網頁載入完成後建立分頁控制元件及按鈕
document.addEventListener('DOMContentLoaded', function(){
  // 建立分頁控制區塊
  let paginationContainer = document.createElement('div');
  paginationContainer.id = 'paginationControls';

  // 建立「頁碼」選單 (預設 1~500 頁)
  let pageSelect = document.createElement('select');
  pageSelect.id = 'pageSelect';
  for(let i = 1; i <= 500; i++){
    let opt = document.createElement('option');
    opt.value = i;
    opt.text = '第 ' + i + ' 頁';
    if(i === 1) opt.selected = true;
    pageSelect.appendChild(opt);
  }


  // 在分頁控制區塊中增加輸入欄位
  let startDateInput = document.createElement('input');
  startDateInput.id = 'startDate';
  startDateInput.placeholder = '開始日期 (YYYY-MM-DD)';
  startDateInput.style.marginRight = '10px';

  let endDateInput = document.createElement('input');
  endDateInput.id = 'endDate';
  endDateInput.placeholder = '結束日期 (YYYY-MM-DD)';
  endDateInput.style.marginRight = '10px';

  let prdnoInput = document.createElement('input');
  prdnoInput.id = 'prdno';
  prdnoInput.placeholder = '貨品代號';
  prdnoInput.style.marginRight = '10px';


  let whInput = document.createElement('input');
  whInput.id = 'wh';
  whInput.placeholder = '倉庫代號';
  whInput.style.marginRight = '10px';


  let psInput = document.createElement('input');
  psInput.id = 'psid';
  psInput.placeholder = '單據代號';
  psInput.style.marginRight = '10px';

  paginationContainer.appendChild(pageSelect);
  paginationContainer.appendChild(startDateInput);
  paginationContainer.appendChild(endDateInput);
  paginationContainer.appendChild(prdnoInput);
  paginationContainer.appendChild(whInput);                                                      
  paginationContainer.appendChild(psInput);                                                         

  // 建立「每頁筆數」選單
  let pageSizeSelect = document.createElement('select');
  pageSizeSelect.id = 'pageSizeSelect';
  [5000, 10000, 15000, 20000, 30000,40000].forEach(function(size){
    let opt = document.createElement('option');
    opt.value = size;
    opt.text = size + ' 筆';
    // 若需要預設值，可在此設定，例如若 size 為 6000 則設為預設
    if(size === 6000) opt.selected = true;
    pageSizeSelect.appendChild(opt);
  });
  paginationContainer.appendChild(pageSizeSelect);

  // 建立「取得存貨清單」按鈕
  let fetchButton = document.createElement('button');
  fetchButton.textContent = '取得存貨清單';
  fetchButton.addEventListener('click', function(){
    // 取得使用者選擇的頁碼與每頁筆數，並更新 sUrl
    let page = document.getElementById('pageSelect').value;
    let pageSize = document.getElementById('pageSizeSelect').value;
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    let prdno = document.getElementById('prdno').value;

    let wh = document.getElementById('wh').value;  
    let psid = document.getElementById('psid').value;  


    // 組合 URL，只有有值時才加入對應參數
    let url = 'https://localhost:4001/receipts/?page=' + page + '&pageSize=' + pageSize;
    //let url ='https://survey.bgdrug.com.tw:40011/receipts/?page=' + page + '&pageSize=' + pageSize; 
    
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
    window.sUrl = url;
    console.log('選擇的分頁條件：', window.sUrl);
    getStock();
  });
  paginationContainer.appendChild(fetchButton);

  // 將分頁控制元件加入到指定容器中
  document.getElementById('something').appendChild(paginationContainer);
});


// 格式化日期函式，輸出 "YYYY-MM-DD" 格式
function formatDate(dateString) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  // 補零至兩位數
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  return `${year}-${month}-${day}`;
}

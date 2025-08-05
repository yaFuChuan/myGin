//window.sUrl='http://192.168.0.190:4000/currStock/';
/*
window.sUrl='http://localhost:4001/currStock/';
window.dUrl='http://localhost:4001/delcurrStock/';
window.binUrl='http://localhost:4001/binlist/';
window.pUrl='http://localhost:4001/products/';
*/


window.sUrl='http://survey.bgdrug.com.tw:40011/currStock/';
window.dUrl='http://survey.bgdrug.com.tw:40011/delcurrStock/';
window.binUrl='http://survey.bgdrug.com.tw:40011/binlist/';
window.pUrl='http://survey.bgdrug.com.tw:40011/products/';


setInterval(() => {
  adstoERP();
}, 50 * 60 * 1000); // 每30分鐘觸發一次


const currentURL = window.location.href;
const urlObj = new URL(currentURL);
// 分割路徑，並過濾空字串（排除因開頭斜線產生的空值）
const pathSegments = urlObj.pathname.split('/').filter(segment => segment !== '');
//console.log("所有路徑段落:", pathSegments);
// 假設 IP 或網域後的第一個路徑為 pathSegments[0]，第二個為 pathSegments[1]
const secondPathSegment = pathSegments[0] || '';
console.log("IP 後面第0個的路徑:", secondPathSegment);


let groupName = '';
if (secondPathSegment === 'currStockView') {
  groupName = '聯橋';
} else if (secondPathSegment === 'currStockView_brid') {
  groupName = '天幕';
} else if (secondPathSegment === 'currStockView_lmtp') {
  groupName = '行善';
}

let headData = Array.from(
  document.querySelectorAll('#myTable thead tr:first-child th')
).map(th => th.textContent.trim());

// 在輸入框前面顯示目前處理的集團
const groupLabel = document.createElement('span');
groupLabel.textContent = `目前處理集團為：${groupName}`;
groupLabel.style.marginRight = '10px'; // 可依需求調整間距


// 全域變數儲存儲位清單
let storageList = [];

// 請根據實際 API 位址修改 URL
  fetch(binUrl,{
    method:'GET',
    headers: {
      'source': secondPathSegment,  
    }
  })
  .then(response => response.json())
  .then(data => {
    storageList = data;
    console.log('儲位清單已取得：', storageList);
  })
  .catch(error => {
    console.error('取得儲位清單時發生錯誤:', error);
  });

//products data
let prodList = [];  
  fetch(pUrl,{
    method:'GET',
    headers: {
      'source': secondPathSegment,  
    }
  })
  .then(response => response.json())
  .then(data => {
    prodList = data;
    console.log('products清單已取得：', prodList);
  })
  .catch(error => {
    console.error('取得products清單時發生錯誤:', error);
  });

const targetDiv = document.getElementById('something');
const textBox = document.createElement('input');
textBox.type = 'text';
textBox.id = 'newTextBox';
textBox.placeholder = '請輸入部門代號';
targetDiv.appendChild(textBox);

// 將標籤加入到 targetDiv (輸入框的父容器) 
targetDiv.appendChild(groupLabel);         

const button = document.createElement("button"); 
button.id="get_retail";
button.textContent ="取門店庫存";

button.onclick = function(){
  const now = new Date();
  const currentHour = now.getHours();
  // 如果時間在中午12點到1點之間
  /*
  if (currentHour >= 12 && currentHour < 14) {
    button.textContent = "中午暫停至2點";
    button.disabled = true;
    return;
  }
  */

  localStorage.setItem("reloadAndStock", "true"); // 設置標記
  localStorage.setItem("textBoxValue", textBox.value); // 儲存 textBox 的值
  location.reload(); // 重新整理頁面
}
// 檢查 LocalStorage 標記
window.addEventListener("load", function () {
  const savedValue = localStorage.getItem("textBoxValue");
  if (savedValue) {
    textBox.value = savedValue; // 恢復 textBox 的值
  }else {
    textBox.value = "";  // 預設空白
  }

  if (localStorage.getItem("reloadAndStock") === "true") {
    localStorage.removeItem("reloadAndStock"); // 移除標記
    getStock();
  }
});

textBox.parentNode.insertBefore(button, textBox.nextSibling);


function addQuantityHoverEffect() {
  const table = document.getElementById("myTable");
  const headers = table.querySelectorAll('thead th');

  // Find the "數量" header index
  let qtyColumnIndex = -1;
  headers.forEach((header, index) => {
    if (header.textContent === "數量") {
      qtyColumnIndex = index;
    }
  });

  if (qtyColumnIndex === -1) return; // Exit if no "數量" header found
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const qtyCell = row.cells[qtyColumnIndex];
    if (!qtyCell) return;

    let timer;
    qtyCell.addEventListener('mouseover', () => {
      timer = setTimeout(() => {
        // 動態找出「實盤量」欄位索引
        const actualIndex = headData.indexOf('實盤量');
        let actualCell = row.cells[actualIndex];
        const qtyValue = parseFloat(qtyCell.textContent) || 0;
        actualCell.textContent = qtyValue < 0 ? 0 : qtyValue;
        row.style.backgroundColor = 'pink';  // Change row background to pink
      }, 2000); 
    });

    qtyCell.addEventListener('mouseout', () => {
      clearTimeout(timer); 
    });
  });
}

function insertAfter(newNode, referenceNode) {                                 
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling); 
}                                                                              

function getStock(){

  const textBoxValue = document.getElementById('newTextBox').value;
  const firstChar = textBoxValue[0];

  let head=['品號','品名','單位','條碼','倉庫代號','儲位','位置','批號','有效日','在途','數量','實盤量','備註說明','預設','del'];
  let columnWidths = ['80px', '120px','5px','50px', '40px', '40px','40px','50px','90px', '50px','50px', '60px', '100px','10px','10px'];

  let allowedKeys = ['prdno','prd_name','UT','barCode','wh','bin','putbin', 'batch', 'valid','onWay', 'qty','Actual','Comment','wh2',''];

  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let tbody = document.createElement("tbody");
  let row = document.createElement("tr");
  table.id = 'myTable';
  table.style.width = '100%';
  table.style.tableLayout = 'auto';
  let deleteButtonWidth = '60px';

  head.forEach(function(item,index) {
    let th = document.createElement("th");
    th.style.padding = '15px';
    th.style.width = columnWidths[index] || '70px'; // 設定欄位寬度，預設100px 
    th.textContent = item;
    row.appendChild(th);
  });

  thead.appendChild(row);
  table.appendChild(thead);
  table.appendChild(tbody);
  document.getElementById("myMain").appendChild(table);


  // 新增：重新抓一次表頭欄位名稱
  headData = Array.from(
    document.querySelectorAll('#myTable thead tr:first-child th')
  ).map(th => th.textContent.trim());

  // 加入新增按鈕
  let addButton = document.createElement('button');
  addButton.textContent = '自行新增項目';
  addButton.style.marginBottom = '10px';
  //document.getElementById("get_retail").appendChild(addButton); //prepend(addButton);
  insertAfter(addButton,newButton);

  addButton.style.display = 'none';

  // 新增輸入欄位區域
  let inputRow = document.createElement('div');
  inputRow.id = 'inputRow';
  inputRow.style.display = 'none'; // 初始隱藏

  head.forEach((item, index) => {
    let input = document.createElement('input');
    input.placeholder = item;
    input.style.width = columnWidths[index];
    input.style.marginRight = '3px';

    if (item === "有效日") {
      input.type = "date"; // 設定為日期選擇器
    }
    
    if (item === "數量" || item === "品名" || item ==="倉庫代號") {
      input.disabled = true;
      input.style.backgroundColor = '#f0f0f0';
    }

    if (item === "數量" || item ==="實盤量"){
      //input.value = 0;
    }

    if (item === "倉庫代號") {
      input.value = (firstChar === 'S' || firstChar === 'D') ? textBoxValue + "_c" : textBoxValue;
    }

    inputRow.appendChild(input);
  });

  // 確認按鈕
  let confirmButton = document.createElement('button');
  confirmButton.textContent = '新增';
  inputRow.appendChild(confirmButton);

  // 添加到主區域
  document.getElementById("myMain").prepend(inputRow);

  // 按鈕點擊事件
  addButton.addEventListener('click', () => {
    inputRow.style.display = inputRow.style.display === 'none' ? 'block' : 'none';

    // 更新倉庫代號的輸入框
    let warehouseInput = inputRow.querySelector('input[placeholder="倉庫代號"]');
    if (warehouseInput) {
      warehouseInput.value = (textBox.value[0] === 'S' || textBox.value[0] === 'D')
      ? textBox.value + "_c"
      : textBox.value;
    }
  });

  // 確認按鈕事件
  confirmButton.addEventListener('click', () => {
    let inputs = inputRow.querySelectorAll('input');
    let newRow = document.createElement('tr');
    let validDate = true;

    // 檢查「有效日」是否為空
    let validDateInput = [...inputs].find(input => input.placeholder === '有效日');
    if (!validDateInput || validDateInput.value.trim() === '') {
      alert('有效日為必填欄位，請輸入有效日！');
      return;
    }

    inputs.forEach((input, index) => {
      let td = document.createElement('td');
      td.textContent = input.value;

      if (head[index] ==="數量" && input.value === "") {
        td.textContent = 0;
      }
      if (head[index] ==="實盤量" && input.value === "") {  
        td.textContent = 0;
      }

      // Ensure column widths are consistently applied
      //td.style.width = columnWidths[index];

      // 日期格式化處理
      if (head[index] === '有效日' && input.value) {
        let date = new Date(input.value);
        if (isNaN(date)) {
          alert('請輸入正確的日期格式');
          validDate = false;
          return;
        }
        //date.setDate(date.getDate() + 1); 
        //let rfc3339Date = date.toISOString(); // 轉換為 RFC3339 格式
        //td.textContent = rfc3339Date
        let yyyy = date.getFullYear();
        let mm = String(date.getMonth() + 1).padStart(2, '0');
        let dd = String(date.getDate()).padStart(2, '0');
        //td.textContent = date.toISOString().split('T')[0];
        td.textContent = `${yyyy}-${mm}-${dd}`;
      }

      newRow.appendChild(td);
      input.value = ''; // 清空輸入欄位
    });

    if (validDate) {
      // 新增刪除按鈕
      let deleteTd = document.createElement('td');
      deleteTd.style.width = deleteButtonWidth;  // Set width to 20px

      let deleteButton = document.createElement('button');
      deleteButton.textContent = '刪除';
      deleteButton.style.color = 'red'; // 按鈕樣式
      deleteButton.style.cursor = 'pointer';

      deleteButton.addEventListener('click', () => {
        tbody.removeChild(newRow); // 刪除該列
      });
      deleteTd.appendChild(deleteButton);
      newRow.appendChild(deleteTd);

      // 設定新增列的預設背景色為粉紅色
      newRow.style.backgroundColor = 'pink';

      /*
      newRow.addEventListener('dblclick', () => {
        if (newRow.style.backgroundColor === 'pink') {
          newRow.style.backgroundColor = ''; // 如果背景色為粉色，清空背景色
        } else {
          newRow.style.backgroundColor = 'pink'; // 否則設為粉色（可移除這行）
        }
      });
      */

      // 修改後：將 dblclick 事件綁定在 newRow 的第一個儲存格上
      if (newRow.cells.length > 0) {
        const pnoIndex = headData.indexOf('品號');
        newRow.cells[pnoIndex].addEventListener('dblclick', () => {
          newRow.style.backgroundColor =
            newRow.style.backgroundColor === 'pink' ? '' : 'pink';
        });
      }

      tbody.prepend(newRow); // 加入到表格最上方
      inputRow.style.display = 'none'; // 隱藏輸入欄位
    }
  });

  fetch(sUrl,{
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'Accept': 'application/json',
      'depValue':textBoxValue,
      'source': secondPathSegment,
    }
  })
  .then(response => response.json())
  .then((data)=>{
    console.log("data",typeof data,data);

    data.forEach(item=>{
      const tr = document.createElement('tr');  

      allowedKeys.forEach((key) => {
    
        /*
        if (item.prdno === "03010437") {
          console.log("03010437 batch,havePJ info:",item.batch,item.HavePJ)
        }
        */

        if (item.hasOwnProperty(key)) {
          const td = document.createElement('td');
          td.textContent = item[key];

          // 調整「倉庫代號」與「批號」欄位的距離
          if (key === 'Wh') {
            //td.style.marginRight = '50px'; // 可調整距離
            //td.style.paddingRight = '50px'; // 增加右邊距
          }

          if (key==='Valid') { 
            td.style.whiteSpace = 'nowrap'; // Prevent text from wrapping 
            //td.style.paddingRight = '80px'; 
            td.style.fontSize = '12px';
            //td.style.textAlign = 'left';
            td.style.color = 'blue';
          }

          if (key==='Qty') { 
            td.style.whiteSpace = 'nowrap';
            //td.style.textAlign = 'right';
          }

          if (key === 'valid' && item[key]) {
            let dateStr = item[key]; // 例: "2029-05-31T00:00:00Z"
            if (dateStr === '0001-01-01T00:00:00Z' || dateStr === '1900-01-01T00:00:00Z')  {
              td.textContent = ''; // Or set it to a placeholder if you prefer
            } else {
              let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                let yyyy = match[1];
                let mm = match[2];
                let dd = match[3];
                td.textContent = `${yyyy}-${mm}-${dd}`; // Correct format
              } else {
                td.textContent = '-'; // If it can't be parsed, show a dash
              }
            }
          }

          if (key ==='Actual' || key ==='Comment'){
            //td.style.textAlign = 'right';
            td.style.fontSize = '15px';
            td.classList.add('canAlter');
          }

          tr.appendChild(td);
        }
      });


      if (item.HavePJ === "1" || item.Actual > 0) {
        tr.style.backgroundColor = 'pink';
      }
      

      // 監聽雙擊事件
      //copy above data
      attachPinkToggleEvent(tr);
      // 新增：品名欄 dblclick 複製列
      attachDuplicationEvent(tr);
      
      // 為該列新增刪除按鈕
      attachRowDeleteButton(tr);

      tbody.appendChild(tr);   
    });

    //addQuantityHoverEffect();
    //setTimeout(alterFunc,1500);   
      
    // 在資料列生成完畢後，延遲 1500 毫秒再呼叫其他設定
    setTimeout(() => {
      alterFunc();
      applyEffectiveDateValidationToTable();  // 將有效日驗證功能附加到所有該欄位
    }, 1500);

  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

  let filterRow = document.createElement('tr'); // 新增過濾
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

      Array.from(tbody.rows).forEach(row => {
        let shouldDisplay = true;
        Array.from(row.cells).forEach((cell, colIndex) => {
          if (filterValues[colIndex] && !cell.textContent.toLowerCase().includes(filterValues[colIndex])) {
            shouldDisplay = false;
          }
        });
          row.style.display = shouldDisplay ? '' : 'none'; //
      });
    });
    filterRow.appendChild(filterTh);
  });
  thead.appendChild(filterRow);
  // 綁定表頭排序事件
  setupSortEvents();
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


function sortTable(columnIndex, order) {
  const table = document.getElementById('myTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  rows.sort((a, b) => {
    let cellA = a.cells[columnIndex].textContent.trim();
    let cellB = b.cells[columnIndex].textContent.trim();

    // 忽略空白：將空白值排到最後
    if (cellA === '' && cellB !== '') return 1;
    if (cellA !== '' && cellB === '') return -1;
    if (cellA === '' && cellB === '') return 0;

    // 使用 localeCompare 並開啟 numeric 選項，以自然排序
    return order === 'asc'
      ? cellA.localeCompare(cellB, undefined, { numeric: true })
      : cellB.localeCompare(cellA, undefined, { numeric: true });
  });

  // 更新 tbody
  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
}


function alterFunc(){
  // 取得「備註說明」欄位在表頭的索引
  const table = document.getElementById("myTable");
  const headers = Array.from(table.querySelectorAll("thead th"));
  const commentColIndex = headers.findIndex(th => th.textContent.trim() === "備註說明");

  const alterCells = document.querySelectorAll('.canAlter');
  
  alterCells.forEach(cell => {
    cell.style.color = 'blue';
    
    // 點擊後啟用 inline 編輯
    cell.addEventListener('click', function(){
      if (!cell.isContentEditable) {
        cell.contentEditable = true;
        cell.style.backgroundColor = '#ffffe0'; // 淺黃色提示可編輯
        cell.focus();
      }
    });
    
    // 防止使用者在輸入時換行
    cell.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        cell.blur();
      }
    });
    
    // 失焦後取消編輯，若內容為空則預設為 0，並將所在列設為粉紅底色
    cell.addEventListener('blur', function(){
      // 取得該儲存格在該列中的索引
      const cellIndex = Array.from(cell.parentElement.children).indexOf(cell);
      // 若非「備註說明」欄位且內容為空，則填入 0
      if(cell.textContent.trim() === ''){
        if(cellIndex !== commentColIndex){
          cell.textContent = '0';
        }
      }
      cell.parentElement.style.backgroundColor = 'pink';
      cell.style.backgroundColor = '';
      cell.contentEditable = false;
      // 自動捲動至該列顯示在視窗中
      cell.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // 雙擊可取消儲存格底色（保留原有功能）
    cell.addEventListener('dblclick', function(){
      cell.style.backgroundColor = '';
    });
  });
}


// 輔助函式：設定品號欄（第一欄）雙擊切換粉紅底色
function attachPinkToggleEvent(row) {
  // 現場重新抓一下最新的表頭文字（確保 headData 不會是舊的或空的）
  const headers = Array.from(
    document.querySelectorAll('#myTable thead tr:first-child th')
  );
  const currentHeadData = headers.map(th => th.textContent.trim());
  const pnoIndex = currentHeadData.indexOf('品號');
  // 必須同時檢查欄位存在且找到索引才綁定
  if (pnoIndex >= 0 && row.cells[pnoIndex]) {
    
    row.cells[pnoIndex].addEventListener('dblclick', () => {
      row.style.backgroundColor =
        row.style.backgroundColor === 'pink' ? '' : 'pink';
    });
  }
}

// 輔助函式：設定品名欄（第二欄）雙擊複製該列
function attachDuplicationEvent(row) {
  if (row.cells.length > 1) {
    const nameIndex = headData.indexOf('品名');
    row.cells[nameIndex].addEventListener('dblclick', () => {
      duplicateRow(row);
    });
  }
}


// 複製列的函式
function duplicateRow(originalRow) {
  // 需清空的欄位索引（依照您的欄位順序：批號、有效日、在途、數量、實盤量、備註說明）
  //const clearIndices = [ 7, 8, 9, 10, 11, 12];
  // 需設定為可編輯的欄位索引（依照要求：批號、有效日、實盤量、備註說明）
  //const editableIndices = [0,5, 7, 8, 11, 12];

  // 用欄位名稱動態產生索引陣列
  const clearCols    = ['批號','有效日','在途','數量','實盤量','備註說明'];
  const editableCols = ['品號','儲位','批號','有效日','實盤量','備註說明'];
  const clearIndices    = clearCols.map(name => headData.indexOf(name));
  const editableIndices = editableCols.map(name => headData.indexOf(name));
  
  const newRow = document.createElement('tr');
  const colCount = originalRow.cells.length; // 假設與表頭欄數一致

  for (let i = 0; i < colCount; i++) {
    if (i === colCount - 1) continue;

    const newCell = document.createElement('td');
    // 如果該欄位需清空，則不複製原本內容
    if (clearIndices.includes(i)) {
      newCell.textContent = '';
    } else {
      newCell.textContent = originalRow.cells[i].textContent;
    }
    // 若該欄位需允許修改，則設為可編輯
    if (editableIndices.includes(i)) {
      newCell.contentEditable = true;
      newCell.style.backgroundColor = '#ffffe0'; // 淺黃色提示可編輯

      // 防止使用者在輸入時換行：攔截 Enter 鍵
      newCell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });


      // 新增：若此儲存格是「品號」欄（假設索引 0 為品號）
      const pNameIndex = headData.indexOf('品名');
      
      //if (i === 0) {
      const pnoIndex = headData.indexOf('品號');
      if (i === pnoIndex) {
        newCell.addEventListener('blur', function() {
          let pno = newCell.textContent.trim();
          // 當品號為空時，恢復該列背景，不要有底色
          if (pno === "") {
            newRow.style.backgroundColor = '';
          }else{
            newRow.style.backgroundColor = 'pink';
          }
          // 從 prodList 中比對是否有對應的 Pno
          let found = prodList.find(item => item.Pno === pno);
          if (!found) {
            alert(`找不到品號 "${pno}" 的資料，請重新輸入！`);
            newCell.textContent = '';  // 清空錯誤輸入

            newRow.style.backgroundColor = '';

            // 跳到下一個可編輯的欄位（例如：品名欄，假設索引 1）
            if (newRow.cells[pNameIndex] && newRow.cells[pNameIndex].isContentEditable){
              newRow.cells[pNameIndex].focus();
            }
          } else {
            // 若找到對應的資料，更新「品名」與「條碼」欄位
            if (newRow.cells[pNameIndex]) {
              newRow.cells[pNameIndex].textContent = found.PName;
            }

            const barIndex = headData.indexOf('條碼');
            if (newRow.cells[barIndex]) {
              newRow.cells[barIndex].textContent = found.BAR_CODE;
            }

            // **新增：更新「單位」欄位**
            const unitIndex = headData.indexOf('單位');
            if (unitIndex >= 0 && newRow.cells[unitIndex]) {
              newRow.cells[unitIndex].textContent = found.UT;
            }
            // **新增：更新「位置」欄位**
            const locIndex = headData.indexOf('位置');
            if (locIndex >= 0 && newRow.cells[locIndex]) {
              newRow.cells[locIndex].textContent = found.putbin; 
            }
          }
        });
      }

    // 新增：若此儲存格是「儲位」欄（假設索引 4 為儲位）

      if (i === 5) {
        newCell.addEventListener('blur', function() {
          const inputValue = newCell.textContent.trim();
          // 取得該列的「倉庫代號」，假設倉庫代號在索引 4
          const whIndex = headData.indexOf('倉庫代號');  // 或實際的表頭文字
          const whValue = newRow.cells[whIndex].textContent.trim();
          // 從全域儲位清單中找出對應的記錄（比對倉庫代號 Wh）
          const chuwList = storageList
            .filter(item => item.Wh === whValue)
            .flatMap(item => item.Chuw);

          //console.log("record list:",chuwList);

        // 若使用者輸入值不在 chuwList 清單內
          if (!chuwList.includes(inputValue)) {
            alert(`輸入的儲位 "${inputValue}" 不在倉庫 ${whValue} 的有效儲位清單內，請重新輸入！`);
            newCell.textContent = '';

            // 跳到下一個可編輯欄位（假設 newRow 內其他欄位已設定 contentEditable）
            for (let j = i + 1; j < newRow.cells.length; j++) {
              if (newRow.cells[j].isContentEditable) {
                newRow.cells[j].focus();
                break;
              }
            }
          }
        });
      }

      // 如果此儲存格是「有效日」欄（假設索引 7 為有效日）
      if (i === 8) {
        // 當使用者離開儲存格時進行格式檢查
        newCell.addEventListener('blur', () => {
          const value = newCell.textContent.trim();
          if (value !== "") {

            // 若輸入為 8 位數字，自動插入 - 
            if (/^\d{8}$/.test(value)) {
              let yyyy = value.slice(0, 4);
              let mm = value.slice(4, 6);
              let dd = value.slice(6, 8);
              newCell.textContent = `${yyyy}-${mm}-${dd}`;
              return;
            }

            // 驗證格式是否為 YYYY-MM-DD
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(value)) {
              alert("請輸入正確格式的有效日，例如：2026-01-04");
              newCell.textContent = ''; // 清空錯誤輸入
              newCell.focus(); // 重新聚焦此儲存格
            } else {
              // 進一步檢查是否為合法日期
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                alert("請輸入正確格式的有效日，例如：2026-01-04");
                newCell.textContent = '';
                newCell.focus();
              }
            }
          }
        });
      }
    }
    newRow.appendChild(newCell);
  }
  

  // 在複製列後，檢查品號欄是否有內容，若無則不設置底色
  const pnoIdx    = headData.indexOf('品號');
  const pnoValue = newRow.cells[pnoIdx] ? newRow.cells[pnoIdx].textContent.trim() : '';

  if (pnoValue === "") {
    newRow.style.backgroundColor = '';
  } else {
    newRow.style.backgroundColor = 'pink';
  }

  // 將新列插入原列下方（假設 originalRow.parentNode 為 tbody）
  originalRow.parentNode.insertBefore(newRow, originalRow.nextSibling);

  // 為新列添加原有功能事件：品號欄 dblclick 切換背景、品名欄 dblclick 複製列
  attachPinkToggleEvent(newRow);
  attachDuplicationEvent(newRow);
  attachRowDeleteButton(newRow);  
}

const exportXls = document.createElement('button');      
exportXls.id='expXls';                                   
exportXls.textContent = "轉出Excel";                     
exportXls.addEventListener('click',()=>{                 
    exportToExcel('myTable');                              
});                                                      
button.insertAdjacentElement('afterend', exportXls);


function exportToExcel(tableId) {
  const table = document.getElementById(tableId);
  let csv = '';

  // 處理表頭（假設表頭不會是空白）
  const headerCells = table.rows[0].cells;
  for (let i = 0; i < headerCells.length; i++) {
    csv += headerCells[i].textContent.trim() + ',';
  }
  csv = csv.slice(0, -1) + '\n';

  // 處理資料列
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];

    // 若整列內容完全空白，則跳過
    if (row.textContent.trim() === '') continue;

    for (let j = 0; j < row.cells.length; j++) {
      let cellText = row.cells[j].textContent.trim();
      // 若是品號（第 0 欄）或條碼（第 2 欄），且內容不為空才包裝
      const pnoIdx    = headData.indexOf('品號');
      const barIdx    = headData.indexOf('條碼');
      const otherIdx  = headData.indexOf('批號');
      if ([pnoIdx, barIdx, otherIdx].includes(j) && cellText !== '') {
        cellText = '="' + cellText + '"';
      }


      // 假設最後一欄是 del 欄位，檢查該列是否有粉紅色背景
      if (j === row.cells.length - 1) {
        if (row.style.backgroundColor.trim() === 'pink') {
          cellText = '已轉出';
        }
      }

      csv += cellText + ',';
    }
    csv = csv.slice(0, -1) + '\n';
  }

  // 加上 BOM 以防止中文亂碼
  const csvDataWithBom = "\ufeff" + csv;
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvDataWithBom);
  link.download = 'PO_auto.csv';
  link.click();
}

const copyButton = document.createElement("button");
copyButton.textContent = "複製數量至實盤量";
copyButton.style.margin = "10px";
insertAfter(copyButton , exportXls);
copyButton.addEventListener("click", function () {
  const table = document.getElementById("myTable");
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  let qtyIndex = -1;
  let actualIndex = -1;

  const headers = table.querySelectorAll("thead th");
  headers.forEach((header,index) =>{
    if (header.textContent.trim() === "數量") {
      qtyIndex = index;
    }
    if (header.textContent.trim() === "實盤量") {
      actualIndex = index;
    }
  });

  if (qtyIndex === -1 || actualIndex === -1) {
    alert("找不到 數量 或 實盤量 欄位");
    return;
  }

  rows.forEach((row) => {
    const qtyCell = row.cells[qtyIndex];
    const actualCell = row.cells[actualIndex];

    if (qtyCell && actualCell) {
      const qtyValue = parseFloat(qtyCell.textContent) || 0;
      actualCell.textContent = qtyValue > 0 ? qtyValue : 0;
      row.style.backgroundColor = "pink"; // 設置背景顏色
    }
  });
  alert("已更新實盤量！");
});

//建立數字輸入框：用來填入天數偏移量
const validDateFilterInput = document.createElement('input');
validDateFilterInput.type = 'number';
validDateFilterInput.placeholder = '篩選有效天數';
validDateFilterInput.style.margin = '10px';

// 將數字輸入框插入在 "複製數量至實盤量" 按鈕後面
insertAfter(validDateFilterInput, copyButton);

// 新增事件：當輸入框的數值改變時進行篩選
validDateFilterInput.addEventListener('input', function() {
  const offsetDays = parseInt(validDateFilterInput.value, 10);
  const today = new Date();
  const tbody = document.querySelector('#myTable tbody');
  
  // 若輸入值非正數則恢復原狀（未篩選）
  if (isNaN(offsetDays) || offsetDays <= 0) {
    Array.from(tbody.rows).forEach(row => {
      row.style.display = '';
    });
    return;
  }
  
  // 依據每一列的「有效日」進行計算與比對
  Array.from(tbody.rows).forEach(row => {
    const validDateIdx  = headData.indexOf('有效日');
    const validDateCell = row.cells[validDateIdx];
    if (validDateCell) {
      const dateStr = validDateCell.textContent.trim();
      if (dateStr) {
        // 解析有效日（格式例如 "2026-01-04"）
        const validDate = new Date(dateStr);
        // 減去輸入的天數
        validDate.setDate(validDate.getDate() - offsetDays);
        // 若調整後的日期小於今天，顯示該列，否則隱藏
        if (validDate < today) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    }
  });
});

//建立數字輸入框：用來填入天數偏移量end

const allpink = document.createElement("button");
allpink.textContent = "ZZ調盤損";
allpink.style.margin = "10px";
insertAfter(allpink,exportXls);
allpink.addEventListener("click", function () {
  const table = document.getElementById("myTable"); 
  if (!table) return;                               
  const rows = table.querySelectorAll("tbody tr"); 

  let qtyIndex = -1;
  let actualIndex = -1;
  let batchIndex = -1;

  const headers = table.querySelectorAll("thead th");
  headers.forEach((header,index) =>{
    const text = header.textContent.trim();
    if (text === "數量") {
      qtyIndex = index;
    }
    if (text === "實盤量") {
      actualIndex = index;
    }
    if (text === "批號") {
      batchIndex = index;
    }
  });

  if (qtyIndex === -1 || actualIndex === -1) {
    alert("找不到 數量 或 實盤量 欄位");
    return;
  }

  if (batchIndex === -1) {
    alert("找不到 批號 欄位");
    return;
  }


  // 檢查是否有任何符合條件的列尚未設為粉紅色
  let anyNotPink = Array.from(rows).some(row => {
    const batchValue = row.cells[batchIndex].textContent.trim();
    // 僅針對批號正確的列進行判斷
    return batchValue === "20250101ZZZZ" && row.style.backgroundColor !== "pink";
  });

  rows.forEach((row) => {
    const qtyCell = row.cells[qtyIndex];
    const actualCell = row.cells[actualIndex];
    const batchValue = row.cells[batchIndex].textContent.trim();

    // 僅處理批號等於 "20250101ZZZZ" 的列
    if (batchValue === "20250101ZZZZ") {
      const qtyValue = parseFloat(qtyCell.textContent) || 0;
      actualCell.textContent = qtyValue > 0 ? 0 : 0;
      row.style.backgroundColor = anyNotPink ? "pink" : "";
    }
  });
});

allpink.disabled = true; 
// 建立 newButton
const newButton = document.createElement('button');
newButton.textContent = '送至盤點單';
newButton.id = 'listToERP';
newButton.style.fontFamily = 'Arial, sans-serif';
newButton.style.backgroundColor = '#4CAF50';  // 修改為綠色背景
newButton.style.color = '#fff';               // 白色文字
newButton.style.padding = '1px 2px';
newButton.style.border = 'none';
newButton.style.borderRadius = '5px';
newButton.style.cursor = 'pointer';
newButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
newButton.style.transition = 'all 0.3s ease';

insertAfter(newButton, copyButton); 

// 滑鼠移入移出效果
newButton.addEventListener('mouseover', function() {
  newButton.style.backgroundColor = '#45a049'; // 略深的綠色
  newButton.style.transform = 'scale(1.05)';
});

newButton.addEventListener('mouseout', function() {
  newButton.style.backgroundColor = '#4CAF50';
  newButton.style.transform = 'scale(1)';
});


function adstoERP(){
  const depValue = document.getElementById('newTextBox').value;   
  console.log("depValue:",depValue);                               

  const headerCells = document.querySelectorAll('#myTable thead tr:first-child th');
  let headData = Array.from(headerCells).map(th => th.textContent.trim());
  
  // —— 新增：找到「品名」欄位的索引 —— 
  const productNameIndex = headData.indexOf('品名');
  if (productNameIndex === -1) {
    console.error('找不到「品名」欄位');
    return;  // 欄位不存在就中斷
  }
  
  console.log('headData', headData )

  let tableObject = [];
  for (let trNode of document.querySelectorAll('tbody > tr')) {
    // 先拿到這列所有 td
    const tdList = trNode.querySelectorAll('td');
    // 再定位到「品名」那格
    const productNameCell = tdList[productNameIndex];
    // 檢查「品名」儲存格的背景色


    // 先取得 <td> 和 <tr> 的背景色
    const tdBg = window.getComputedStyle(productNameCell).backgroundColor;
    const trBg = window.getComputedStyle(trNode).backgroundColor;
    // 只要 <td> 或其父列 <tr> 其中一個不是透明，就納入
    if (
      (tdBg !== 'rgba(0, 0, 0, 0)' && tdBg !== 'transparent') ||
      (trBg !== 'rgba(0, 0, 0, 0)' && trBg !== 'transparent')
    ) {
      let data = {};
      Array.from(tdList).forEach((td, index) => {
        data[headData[index]] = td.innerText;
      });
      // …其餘 operatorName 邏輯不變…
      tableObject.push(data);
    }
  }

  console.log('🔥 即將送出至 背景色 的資料 (tableObject)：', tableObject);

  // 確認是否送出資料
  if (tableObject.length === 0) {
    alert("目前沒有底色為粉色的品號資料！");
    return;
  }


  // 反覆詢問打單人姓名，直到不為空
  let operatorName = "";
  do {
    operatorName = prompt("請輸入打單人名字:");
    if (operatorName === null) { // 按下取消則退出
      alert("送出已取消！");
      return;
    }
    operatorName = operatorName.trim();
  } while(operatorName === "");

  // 將姓名加入每筆資料的備註說明後方
  tableObject.forEach(item => {
    if (item["備註說明"]) {
      item["備註說明"] += " " + operatorName;
    } else {
      item["備註說明"] = operatorName;
    }
  });

  let result = confirm("您本次資料<將>送資料庫更改盤點數量,確定送ERP盤點單嗎?")
  if (result) {
    fetch(sUrl,{
      method: 'POST',
      body: JSON.stringify(tableObject),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        'depValue':depValue,
        'source': secondPathSegment,
      },
    })
    .then(response => response.json())
    .then(function(data){
      console.log("回傳訊息：", data);
      if (data.status === "success") {
        alert("資料傳送成功：" + data.message);
      } else {
        alert("資料傳送失敗：" + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert("資料傳送過程中發生錯誤");
    }).finally(() => {
     // ★ 無論成功或失敗，都印出最終送出的資料
     console.log('🔥 最後送出的 tableObject：', tableObject);
     //console.log('🔥 最後送出 JSON：', JSON.stringify(tableObject));
   });

    //tableObject=null;

  }else{
    alert("您點擊了取消,您本次資料不送出資料庫喔！");
  }
}

document.getElementById("listToERP").addEventListener("click", adstoERP);  


// 取得 newButton 的畫面位置，以便計算氣泡的起始位置
const buttonRect = newButton.getBoundingClientRect();
const gap = 10; // 與按鈕間隔
// 起始水平位置：newButton 右側再加間隔
const startLeft = buttonRect.left + buttonRect.width + gap;
// 起始垂直位置：與 newButton 同一水平線（可依需求調整）
const startTop = buttonRect.top;

// 建立氣泡圖片
const bubbleImage = document.createElement('img');
bubbleImage.src ="/static/img/ximbrand.jpg"
bubbleImage.alt = '氣泡';
bubbleImage.style.width = '100px';
bubbleImage.style.height = '100px';

// 使用絕對定位，將氣泡放在 newButton 右側
bubbleImage.style.position = 'absolute';
bubbleImage.style.left = startLeft + 'px';
bubbleImage.style.top = startTop + 'px';

// 調整為泡泡形狀：利用 border-radius 產生圓形
bubbleImage.style.borderRadius = '50%';
// 加上柔和的陰影與透明度，模擬泡泡效果
bubbleImage.style.boxShadow = '0 0 10px rgba(0, 0, 255, 0.5)';
bubbleImage.style.opacity = '0.8';

// 將起始水平位置存為 CSS 變數，方便動畫計算
bubbleImage.style.setProperty('--start-left', startLeft + 'px');

// 設定動畫：6秒循環，左右移動到螢幕最右邊並伴隨上下 2cm 的位移
bubbleImage.style.animation = 'bubbleMotion 40s infinite ease-in-out';

// 將氣泡圖片插入到 newButton 後面
insertAfter(bubbleImage, newButton);

// 新增動畫 CSS
const style = document.createElement('style');
style.innerHTML = `
@keyframes bubbleMotion {

0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0.5;
  }
  10% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  25% {
    transform: translate(calc((100vw - 50px) - var(--start-left)), -2cm) scale(1.1);
    opacity: 1;
  }
  50% {
    transform: translate(calc((100vw - 50px) - var(--start-left)), 0) scale(1);
    opacity: 0.8;
  }
  75% {
    transform: translate(calc((100vw - 50px) - var(--start-left)), 2cm) scale(1.1);
    opacity: 1;
  }
  90% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0.5;
  }
}
`;
document.head.appendChild(style);


// 當使用者點擊泡泡圖片時，停止原本動畫並回到起點，接著啟動僅上下浮動的動畫
bubbleImage.addEventListener('click', function() {
  // 停止目前的動畫
  bubbleImage.style.animation = 'none';
  
  // 強制重置位置回到起點
  bubbleImage.style.left = startLeft + 'px';
  bubbleImage.style.top = startTop + 'px';
  
  // 觸發 reflow 以確保動畫重新應用
  void bubbleImage.offsetWidth;
  
  // 設定新的動畫：僅垂直方向浮動 (回原點後前後浮動)
  bubbleImage.style.animation = 'bubbleFloat 3s infinite ease-in-out';
});

// 此函式用來在每一列新增刪除按鈕
function attachRowDeleteButton(row) {
  // 建立一個新的 td 與按鈕
  const deleteCell = document.createElement('td');
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '刪除';
  deleteBtn.style.backgroundColor = '#f44336';
  deleteBtn.style.color = '#fffi';
  deleteBtn.style.border = 'none';
  deleteBtn.style.padding = '3px 3px';
  deleteBtn.style.cursor = 'pointer';
  
  // 當按下刪除按鈕時
  deleteBtn.addEventListener('click', function() {
    // 取得表頭，作為欄位名稱（假設表頭位於 <thead> 中）
    const headers = Array.from(document.querySelectorAll('#myTable thead th')).map(th => th.textContent.trim());
    let rowData = {};
    // 逐一讀取該列的每個儲存格
    Array.from(row.cells).forEach((cell, index) => {
      // 如果此列有新增刪除鍵的那一個 cell，可能表頭沒有對應的文字，
      // 因此只針對有標題的 cell 儲存資料
      if (headers[index]) {
        rowData[headers[index]] = cell.textContent;
      }
    });
    
    console.log("ready delete row data:",rowData)

    // 將 rowData 傳送回伺服器
    fetch(dUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'source': secondPathSegment,
      },
      body: JSON.stringify(rowData)
    })
    .then(response => response.json())
    .then(function(data){
      console.log("回傳訊息：", data);
        if (data.status === "success") {
          alert("資料傳送成功：" + data.message);
          // 清除底色 (例如把 pink 底色恢復)
          row.style.backgroundColor = '';
          row.remove();
        } else {
          alert("資料傳送失敗：" + data.message);
        }
    })
    .catch(err => {
      console.error('送出資料時發生錯誤:', err);
    });
  });
  
  // 將按鈕加入到刪除儲存格，再將儲存格加入列中
  deleteCell.appendChild(deleteBtn);
  row.appendChild(deleteCell);
}

// 在 service-worker.js 中
const CACHE_NAME = 'my-app-cache-v20250218';

self.addEventListener('install', event => {
  // 清除所有舊快取
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});



//2025/3/19 add

/*
 * 將有效日欄位的驗證功能附加到指定儲存格上
 * @param {HTMLElement} cell - 要驗證的儲存格
*/
function attachValidDateHandler(cell) {
  // 設定儲存格可編輯並提示使用者（淺黃色背景）
  cell.contentEditable = true;
  cell.style.backgroundColor = '#ffffe0';

  // 防止使用者在輸入時按 Enter 換行
  cell.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  // 當儲存格失焦時進行有效日格式檢查
  cell.addEventListener('blur', () => {
    const value = cell.textContent.trim();
    if (value !== "") {
      // 如果輸入為 8 位數字，則自動格式化為 YYYY-MM-DD
      if (/^\d{8}$/.test(value)) {
        let yyyy = value.slice(0, 4);
        let mm = value.slice(4, 6);
        let dd = value.slice(6, 8);
        cell.textContent = `${yyyy}-${mm}-${dd}`;
        return;
      }

      // 驗證格式是否為 YYYY-MM-DD
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(value)) {
        alert("請輸入正確格式的有效日，例如：2026-01-04");
        cell.textContent = ''; // 清空錯誤輸入
        cell.focus(); // 重新聚焦此儲存格
      } else {
        // 進一步檢查是否為合法日期
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          alert("請輸入正確格式的有效日，例如：2026-01-04");
          cell.textContent = '';
          cell.focus();
        }
      }
    }
  });
}


/**
 * 將表格中所有「有效日」欄位的儲存格套用 attachValidDateHandler 驗證功能
 */
function applyEffectiveDateValidationToTable() {
  const table = document.getElementById('myTable');
  if (!table) return;
  // 假設表頭中「有效日」的文字即代表此欄位
  const headerCells = table.querySelectorAll('thead th');
  let effectiveDateIndex = -1;
  headerCells.forEach((th, index) => {
    if (th.textContent.trim() === '有效日') {
      effectiveDateIndex = index;
    }
  });
  if (effectiveDateIndex === -1) return; // 找不到有效日欄位，則中斷

  // 對 tbody 中每一列的有效日儲存格套用驗證功能
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cell = row.cells[effectiveDateIndex];
    if (cell) {
      attachValidDateHandler(cell);
    }
  });
}



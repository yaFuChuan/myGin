//window.sUrl='http://192.168.0.190:4000/stocktaking/';
window.sUrl='http://localhost:4000/stocktaking/';

const targetDiv = document.getElementById('something');
const textBox = document.createElement('input');
textBox.type = 'text';
textBox.id = 'newTextBox';
textBox.placeholder = '請輸入部門代號';
targetDiv.appendChild(textBox);

const button = document.createElement("button"); 
button.id="get_retail";
button.textContent ="取門店庫存";

button.onclick = function(){
  localStorage.setItem("reloadAndStock", "true"); // 設置標記
  localStorage.setItem("textBoxValue", textBox.value); // 儲存 textBox 的值
  location.reload(); // 重新整理頁面
}
// 檢查 LocalStorage 標記
window.addEventListener("load", function () {
  const savedValue = localStorage.getItem("textBoxValue");
  if (savedValue) {
    textBox.value = savedValue; // 恢復 textBox 的值
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
        let actualCell = row.querySelector('td:nth-child(7)'); // Assuming '實盤量' is the 7th 
        actualCell.textContent = qtyCell.textContent || 0;  // Set to 0 if no quantity
        row.style.backgroundColor = 'pink';  // Change row background to pink
      }, 2000); 
    });

    qtyCell.addEventListener('mouseout', () => {
      clearTimeout(timer); 
    });
  });
}

function getStock(){

  const textBoxValue = document.getElementById('newTextBox').value;
  const firstChar = textBoxValue[0];

  let head=['品號','品名','倉庫代號','批號','有效日','數量','實盤量','備註說明'];
  let columnWidths = ['80px', '150px', '60px', '90px', '80px', '50px', '60px', '100px'];

  let allowedKeys = ['ProdNum', 'ProdName', 'Wh', 'Batch', 'Valid', 'Qty','Actual','Comment'];

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
    th.style.padding = '18px';
    th.style.width = columnWidths[index] || '50px'; // 設定欄位寬度，預設100px 
    th.textContent = item;
    row.appendChild(th);
  });

  thead.appendChild(row);
  table.appendChild(thead);
  table.appendChild(tbody);
  document.getElementById("myMain").appendChild(table);

  // 加入新增按鈕
  let addButton = document.createElement('button');
  addButton.textContent = '自行新增項目';
  addButton.style.marginBottom = '10px';
  //document.getElementById("get_retail").appendChild(addButton); //prepend(addButton);
  insertAfter(addButton,newButton);

  function insertAfter(newNode, referenceNode) {                                 
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);   
  }                                                                              

  // 新增輸入欄位區域
  let inputRow = document.createElement('div');
  inputRow.id = 'inputRow';
  inputRow.style.display = 'none'; // 初始隱藏

  head.forEach((item, index) => {
    let input = document.createElement('input');
    input.placeholder = item;
    input.style.width = columnWidths[index];
    input.style.marginRight = '5px';
    
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
  });

  // 確認按鈕事件
  confirmButton.addEventListener('click', () => {
    let inputs = inputRow.querySelectorAll('input');
    let newRow = document.createElement('tr');
    let validDate = true;

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
      td.style.width = columnWidths[index];

      // 日期格式化處理
      if (head[index] === '有效日' && input.value) {
        let date = new Date(input.value);
        if (isNaN(date)) {
          alert('請輸入正確的日期格式');
          validDate = false;
          return;
        }
        date.setDate(date.getDate() + 1); 
        td.textContent = date.toISOString().split('T')[0];
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

      newRow.addEventListener('dblclick', () => {
        if (newRow.style.backgroundColor === 'pink') {
          newRow.style.backgroundColor = ''; // 如果背景色為粉色，清空背景色
        } else {
          newRow.style.backgroundColor = 'pink'; // 否則設為粉色（可移除這行）
        }
      });


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
    }
  })
  .then(response => response.json())
  .then((data)=>{
    console.log("data",typeof data,data);

    data.forEach(item=>{
      const tr = document.createElement('tr');  

      allowedKeys.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          const td = document.createElement('td');
          td.textContent = item[key];

          // 調整「倉庫代號」與「批號」欄位的距離
          if (key === 'Wh') {
            td.style.marginRight = '50px'; // 可調整距離
            td.style.paddingRight = '50px'; // 增加右邊距
          }

          if (key==='Valid') { 
            td.style.whiteSpace = 'nowrap'; // Prevent text from wrapping 
            td.style.paddingRight = '80px'; 
            td.style.fontSize = '12px';
            //td.style.textAlign = 'left';
            td.style.color = 'blue';
          }

          if (key==='Qty') { 
            td.style.whiteSpace = 'nowrap';
            //td.style.textAlign = 'right';
          }

          if (key === 'Valid' && item[key]) {
            let date = new Date(item[key]);
            let formattedDate = date.toISOString().split('T')[0];
            td.textContent = formattedDate;
          }else{
            td.textContent = item[key];
          }

          if (key ==='Actual' || key ==='Comment'){
            //td.style.textAlign = 'right';
            td.style.fontSize = '15px';
            td.classList.add('canAlter');
          }
          
          tr.appendChild(td);
        }
      });
  /*
      // Add default value for "實盤量"
      const qtyTd = document.createElement('td');
      qtyTd.textContent = item.Qty;  // Set "實盤量" to be the same as the "Qty"
      qtyTd.style.textAlign = 'right';
      qtyTd.style.fontSize = '15px';
      //qtyTd.style.color = 'red';
      qtyTd.classList.add('canAlter'); 

      tr.appendChild(qtyTd);

      const notesTd = document.createElement('td'); 
      notesTd.classList.add('canAlter');  
      notesTd.style.textAlign = 'right'; 
      tr.appendChild(notesTd);
  */

  /*
      // 新增刪除按鈕
      const deleteTd = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '刪除';
      deleteButton.style.color = 'red';
      deleteButton.style.cursor = 'pointer';

      deleteButton.addEventListener('click', () => {
        tbody.removeChild(tr); // 刪除該行
      });

      deleteTd.appendChild(deleteButton);
      tr.appendChild(deleteTd);
  */

      if (item.HavePJ === 1) {
        tr.style.backgroundColor = 'pink';
      }
      // 監聽雙擊事件
      tr.addEventListener('dblclick', () => {
        if (tr.style.backgroundColor === 'pink') {
          tr.style.backgroundColor = ''; // 如果背景色為粉色，清空背景色
        } else {
          tr.style.backgroundColor = 'pink'; // 否則設為粉色（可移除這行）
        }
      });

      tbody.appendChild(tr);   
    });

    addQuantityHoverEffect();
    setTimeout(alterFunc,1500);   
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

  document.querySelectorAll("#myTable thead th").forEach(th => {
    th.addEventListener("click", function(event) {
      let fi = event.target.cellIndex;
      sortTable(fi); });
  });

  function sortTable(columnIndex) {
    const table = document.getElementById('myTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.children);
    // 虛擬 DOM
    const newRows = rows.slice().sort((a, b) => {
      const cellA = a.cells[columnIndex].textContent;
      const cellB = b.cells[columnIndex].textContent;
      return cellA.localeCompare(cellB); // 依照 Unicode 順序排序
    });

    const fragment = document.createDocumentFragment();
    newRows.forEach(row => fragment.appendChild(row));
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
  }


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
}


function alterFunc(){
  const Alter = document.querySelectorAll('.canAlter');
  //console.log(Alter);
  
  Alter.forEach(item => {
    item.style.color = 'blue';
    item.addEventListener('click', (e) => {
      let alter =prompt("請修改數字_接受0～萬數字",item.textContent);
      if (alter == null || alter == ''){
        item.textContent=0;
      }else{
        item.textContent=alter;
      }

      // 獲取當前行（tr）
      const row = item.parentElement;
      // 設置該行為粉紅色
      row.style.backgroundColor = 'pink';
      // 滾動到該行
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 修改後設置背景顏色為粉紅色
      //item.style.backgroundColor = 'pink';
    });

    // 雙擊取消背景顏色
    item.addEventListener('dblclick', () => {
      item.style.backgroundColor = ''; // 恢復原本背景
    });

  });
  
}


const newButton = document.createElement('button');
newButton.textContent = '送至盤點單';
newButton.id = 'myButton';
newButton.style.fontFamily = 'Arial, sans-serif'; 
newButton.style.backgroundColor = '#f5f5dc';
newButton.style.color = 'blue';
newButton.style.padding = '10px 20px';
newButton.style.width = '120px'; 
newButton.style.height = '50px';
newButton.style.fontSize = '13px';
newButton.style.borderRadius = '50px';
//document.getElementById("myMain").appendChild(newButton); 
const targetElement = document.getElementById("myMain");
targetElement.insertBefore(newButton, targetDiv);


newButton.addEventListener('mouseover', function() {
  newButton.style.backgroundColor = '#e0e0e0'; // hover 時改變背景色
  newButton.style.transform = 'scale(1.1)';  // hover 時放大
});

newButton.addEventListener('mouseout', function() {
  newButton.style.backgroundColor = '#f5f5dc'; // 恢復原來背景色
  newButton.style.transform = 'scale(1)'; // 恢復大小
});

document.getElementById("myButton").addEventListener("click", adstoERP);

function adstoERP(){
  const depValue = document.getElementById('newTextBox').value;   
  console.log("depValue:",depValue);                               

  let headData = Array.from(document.querySelectorAll('thead > tr > th')).map(n=>n.innerText)
  
  console.log('headData', headData )

  let tableObject = [];
  for(let trNode of document.querySelectorAll('tbody > tr') ){
    // 確認背景色是否為粉色 (以 `getComputedStyle` 判斷)
    let bgColor = window.getComputedStyle(trNode).backgroundColor;
    if (bgColor === 'rgb(255, 192, 203)') { // 粉色的 RGB 值為 (255, 192, 203)
      let data = {};
      Array.from(trNode.querySelectorAll('td')).forEach((n , index)=>{
        data[ headData[index] ] = n.innerText
      });
      tableObject.push(data);
    }
  }

  console.log( 'Filtered  tableObject ',tableObject );

  // 確認是否送出資料
  if (tableObject.length === 0) {
    alert("目前沒有底色為粉色的品號資料！");
    return;
  }

  let result = confirm("您本次資料<將>送資料庫更改盤點數量,確定送ERP盤點單嗎?")
  if (result) {
    fetch(sUrl,{
      method: 'POST',
      body: JSON.stringify(tableObject),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        'depValue':depValue,
      },
    })
    .then(function(data){
      alert("回傳值data已成功創建:",data);
    })
    .catch(error => console.error('Error:', error));
    tableObject=null;
  }else{
    alert("您點擊了取消,您本次資料不送出資料庫喔！");
  }
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
    for (let i = 0; i < table.rows[0].cells.length; i++) {                               
          csv += table.rows[0].cells[i].textContent + ',';                                   
        }                                                                                    
    csv = csv.slice(0, -1) + '\n';                                                       
    for (let i = 1; i < table.rows.length; i++) {                                        
          for (let j = 0; j < table.rows[i].cells.length; j++) {                             
                  csv += table.rows[i].cells[j].textContent + ',';                                 
                }                                                                                  
          csv = csv.slice(0, -1) + '\n';                                                     
        }                                                                                    
    const csvDataWithBom = "\ufeff" + csv;                                               
    const link = document.createElement('a');                                            
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvDataWithBom);     
    link.download = 'PO_auto.csv';                                                       
    link.click();                                                                        
}                                                                                      

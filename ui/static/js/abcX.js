//window.adsUrl='http://192.168.0.190:4000/conf/';
window.adsUrl='http://survey.bgdrug.com.tw:40011/conf/';

let head=['順序','銷售條件','額數值1','額數值2','量條件','量數值1','量數值2','層級','安全基準量','最大訂貨量'];

let table = document.createElement("table");
let thead = document.createElement("thead");
let tbody = document.createElement("tbody");
let row = document.createElement("tr");
head.forEach(function(item) {
  let th = document.createElement("th");
  th.style.padding = '18px';
  th.textContent = item;
  row.appendChild(th);
});
thead.appendChild(row);
table.appendChild(thead);
table.appendChild(tbody);
document.getElementById("myMain").appendChild(table);

fetch(adsUrl,{
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_token',
    'Accept': 'application/json',
  }
})
.then(response => response.json())
.then((data)=>{
  console.log("data",typeof data,data);

  data.forEach(item=>{
    const tr = document.createElement('tr');  

    for (const key in item) {
      const td = document.createElement('td');
      td.style.padding = '0px 20px 8px 20px'; 
      if (key=='Csp1'||key=='Csp2'||key=='Csq1'||key=='Csq2'||key=='Level'||key=='Max_Ode'||key=='Safe_Q'){
         td.style.color='red';
         td.classList.add("canAlter");
      }
      td.textContent = item[key];
      
      //修復科學符號
      if (key=='Csp1'){
        let number = parseFloat(td.textContent);
        let formattedNumber = number.toFixed(8);
        td.textContent = formattedNumber;
      }
      //console.log(item.Csp1.toFixed(8));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);   
  });

  //let td = document.querySelectorAll('td');
  //console.log(td);
})
.catch(error => {
  console.error('Error fetching data:', error);
});

setTimeout(alterFunc,1500);
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
    });
  });
  
}

const newButton = document.createElement('button');
newButton.textContent = '送出修改';
newButton.id = 'myButton';
newButton.style.fontFamily = 'Arial, sans-serif';
newButton.style.backgroundColor = '#f5f5dc';
newButton.style.color = 'blue';
newButton.style.padding = '10px 20px';
newButton.style.borderRadius = '50%';
document.getElementById("myMain").appendChild(newButton); 

document.getElementById("myButton").addEventListener("click", adstoERP);

function adstoERP(){
  let headData = Array.from(document.querySelectorAll('thead > tr > th')).map(n=>n.innerText)
  //console.log('headData', headData )
  let tableObject = [];
  for(let trNode of document.querySelectorAll('tbody > tr') ){
    let data = {};
    Array.from(trNode.querySelectorAll('td')).forEach((n , index)=>{
      data[ headData[index] ] = n.innerText
    })
    tableObject.push(data)
  }
  console.log( 'tableObject ',tableObject );
  let result = confirm("您本次資料<將>送資料庫更改參數,確定要執行此操作嗎？")
  if (result) {
    fetch(adsUrl,{
      method: 'POST',
      body: JSON.stringify(tableObject),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      }
    })
    .then(function(data){
      alert("回傳值data已成功創建:",data);
    })
    .catch(error => console.error('Error:', error));
    tableObject=null;
  }else{
    alert("您點擊了取消,您本次資料不送資料庫修改喔！");
  }
}


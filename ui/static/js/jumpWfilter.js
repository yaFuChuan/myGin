"use strict"

let myPop=document.getElementById("myPopup");
myPop.style.display = "none"; 

let btn = document.getElementById("popW");
btn.addEventListener("click",disPop);
//myPop.style.display='none';
function disPop(){

  myPop.style.display = "block"; 
  myPop.style.position='fixed';
  myPop.style.left='10%';
  myPop.style.top='10%';
  myPop.style.width='80%';
  myPop.style.height='80%';
  myPop.style.overflow='auto';
  myPop.style.backgroundColor='rgba(234,242,169,0.39)';
  myPop.style.border='1px solid #ccc'; 

  let PopClose=document.querySelectorAll(".close"); 
  for (let i = 0; i < PopClose.length; i++) {
    PopClose[i].style.color='#aaa';
    PopClose[i].style.float='right';
    PopClose[i].style.fontSize='40px';
    PopClose[i].style.fontWeight='bold';

    PopClose[i].addEventListener("mouseover", function() {
      this.style.color = "black";
      this.style.textDecoration = "none";
      this.style.cursor = "pointer";
    });

    PopClose[i].addEventListener("mouseout", function() {
      this.style.color = "#aaa";
      this.style.textDecoration = "underline";
      this.style.cursor = "default";
    });
  }
  
  const searchInput = document.getElementById('searchInput');
  const selectElement = document.getElementById('mySelect');
  const selectedItemsElement = document.getElementById('selectedItems');
  searchInput.style.display = "block";
  searchInput.style.width = '30%';
  searchInput.style.padding='10px';
  searchInput.style.border='1px solid #ccc';
  searchInput.style.borderRadius='4px';

  selectElement.style.fontSize = '20px';
  selectElement.style.width = '40%';
  selectElement.style.height = '60%';
  selectElement.style.border='1px solid #ccc';
  selectElement.style.borderRadius='4px';

  selectedItemsElement.style.padding='10px';
  selectedItemsElement.style.marginTop='5px';
  selectedItemsElement.style.borderRadius='4px';
  selectedItemsElement.style.border='1px solid #ccc';  
  selectedItemsElement.style.backgroundColor = "#FFFFFF";

  selectElement.options.length = 0;
  // 儲存已選項目的陣列
  let selectedItems = [];

  let conf={};
  let curl='http://localhost:4000/conf/';  
  fetch_Data(conf,curl) 
    .then(data => {
      console.log("conf data", data); 
      data.forEach(item =>{
        let option = document.createElement("option");
        option.value = item.Ordnum;
        option.text = `Ordnum: ${item.Ordnum}, Csp1: ${item.Csp1},Level: ${item.Level}`;
        //option.text = `Level: ${item.Level}`;
        selectElement.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error:", error);
    });
    
  // 模糊查詢的函數
  function filterOptions() {
    const keyword = searchInput.value.toLowerCase();
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      option.hidden = !option.text.toLowerCase().includes(keyword);
    }
  }

  // 更新已選項目列表的函數
  function updateSelectedItems() {
    //selectedItemsElement.textContent = selectedItems.join(', ');
    selectedItems.forEach(item=>{
      convertToButton(item);
    });
  }

  // 監聽選擇變化事件
  selectElement.addEventListener('change', () => {
    // 更新 selectedItems 陣列
    selectedItems.length = 0;
    for (let i = 0; i < selectElement.selectedOptions.length; i++) {
      if (selectedItems.includes(selectElement.selectedOptions[i].value)) {
        //const valueToRemove =selectElement.selectedOptions[i].value;
        //selectedItems = selectedItems.filter(num => num !== valueToRemove);
      }else{
        //selectedItems.push(selectElement.selectedOptions[i].value);
        convertToButton(selectElement.selectedOptions[i]);
      }
    }
    // 更新已選項目顯示
    //updateSelectedItems();
  });

  let selectedBox=[]; 
  let selectedContent = document.getElementById("clear8"); 
  let divD2 = document.getElementById("divDiv"); 
  selectedContent.onclick = function() { 
    selectedItems.length = 0;
    selectedBox.length=0;
    divD2.innerHTML = "";
    console.log(selectedBox," selectedBox result");
    //console.log(selectedItems,"result");
    selectedItemsElement.textContent='';

  };

  // 將選項轉換為按鈕
  function convertToButton(seletedOption) {
    const newButton = document.createElement('button');
    newButton.textContent = seletedOption.text;
    newButton.myValue=seletedOption.value;
    selectedBox.push(seletedOption.value);
    console.log("selectedBox value",selectedBox);

    newButton.addEventListener('click', () => {
      newButton.remove(); // 點擊按鈕時移除自己

      let index = selectedBox.indexOf(newButton.myValue);
        if (index !== -1) {
           // 刪除該元素
           selectedBox.splice(index, 1);
        }
      console.log("remove selectedBox", selectedBox);
    });
    selectedItemsElement.appendChild(newButton);
    newButton.style.border='1px solid blue';
    newButton.style.marginTop='5px'; 
    newButton.style.marginLeft = '10px';
    newButton.style.height='30px';
    newButton.style.width='50px';
    newButton.style.borderRadius='8px'; 
  }

  // 監聽輸入事件，進行模糊查詢
  searchInput.addEventListener('input', filterOptions);

  //闗閉跳窗
  let span = document.getElementsByClassName("close")[0];  
  span.onclick = function() {
    myPop.style.display = "none"; 
    let disDiv =document.createElement('div');
    disDiv.id='divDiv';
    disDiv.appendChild(selectedItemsElement);
    insertAfter(disDiv,btn);
    console.log("div content",selectedItemsElement);
  };
}

function insertAfter(newElement, targetElement) {
  var parent = targetElement.parentNode;
  if (parent.lastChild === targetElement) {
    parent.appendChild(newElement);
  }else{
    parent.insertBefore(newElement, targetElement.nextSibling);
  }
}

/*
window.onclick = function(event) {
  if (event.target == myPop) {
    myPop.style.display = "none";
  }
};
*/

function fetch_Data(obj,url){
  return fetch(url,{
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'Accept': 'application/json', 
    }
  })
  .then(response => response.json())  
  .then((data)=>{
    //console.log("data type is :",typeof data,data);
    obj = data;
    return obj;
  })
  .catch(error => {  
    console.error('Error fetching data:', error); 
    throw error;
  });
}

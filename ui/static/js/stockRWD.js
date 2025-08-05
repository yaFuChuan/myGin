window.mUrl='https://survey.bgdrug.com.tw:40011/';
//window.mUrl='https://192.168.6.175:4001';


// 全域變數：暫存尚未送出的盤點資料，每筆代表一筆記錄
let tempInventoryData = [];

// 全域變數：儲存從後端取得的貨品清單資料
let productList = [];

// 全域變數：掃描器實例，用於控制掃描功能
let html5QrCode = null;

// 全域變數：記錄掃描器是否正在運作
let isScanning = false;

document.addEventListener("DOMContentLoaded", function() {
  // 取得並隱藏掃描容器（浮動於欄位下方，自適應寬度）
  const readerDiv = document.getElementById("reader");
  if (readerDiv) {
    readerDiv.style.display = "none"; // 初始隱藏
    readerDiv.style.width = "100%";   // 自適應父容器寬度
    // 高度由內容自動決定（可透過 CSS 調整外觀）
  }

  // 從後端取得貨品清單資料
  fetch(mUrl+'/products/')
    .then(response => response.json())
    .then(data => { 
      productList = data; 
      console.log("取得貨品清單：", productList);
    })
    .catch(error => console.error('Error fetching products:', error));

  
  // 取得「手動輸入」核取方塊（若勾選則不啟動掃描）
  const manualInputToggle = document.getElementById("manualInputToggle");

  // 當使用者點選「國際條碼」欄位時：
  // 若未勾選手動輸入則啟動掃描，否則保留欄位供使用者手動輸入
  const barcodeField = document.getElementById("barcode");
  barcodeField.addEventListener("click", function(e) {
    e.stopPropagation();
    // 若啟用手動輸入，僅清除欄位內容
    if (manualInputToggle && manualInputToggle.checked) {
      barcodeField.value = "";
      return;
    }
    // 否則清除原有內容並啟動掃描
    barcodeField.value = "";
    startScanning();
  });

  // 若頁面中有啟動掃描按鈕 (id="startScanBtn")，點擊後啟動掃描（若非手動輸入模式）
  const startScanBtn = document.getElementById("startScanBtn");
  if (startScanBtn) {
    startScanBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (manualInputToggle && manualInputToggle.checked) {
        // 若手動輸入啟用，則不啟動掃描
        return;
      }
      startScanning();
    });
  }

  // 當「國際條碼」欄位內容變動時（手動輸入或掃描填入）自動比對貨品清單，更新對應欄位

  barcodeField.addEventListener("change", function() {
    const code = barcodeField.value.trim();
    if (code === "") return;
    const product = productList.find(item => item.Pno === code);
    if (product) {
      document.getElementById("productName").value = product.PName;
      document.getElementById("storageCode").value = product.storageCode;
    } else {
      // 可依需求清除或保留先前資料
      document.getElementById("productName").value = "";
      document.getElementById("storageCode").value = "";
    }
  });

  // 點選其他區域 (非 barcode 與啟動掃描按鈕) 時，停止掃描
  document.addEventListener("click", function(e) {
    if (e.target.id !== "barcode" && e.target.id !== "startScanBtn") {
      stopScanning();
    }
  });

  // 為各表單欄位設定按下 Enter 鍵時自動跳轉至下一個欄位
  const fields = ["barcode", "productName", "storeCode", "batchNumber", "expiration", "storageCode", "count"];
  fields.forEach((field, index) => {
    document.getElementById(field).addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (index < fields.length - 1) {
          document.getElementById(fields[index + 1]).focus();
        }
      }
    });
  });

  // 「暫存未送出」按鈕事件：將表單資料暫存到清單中
  document.getElementById("tempSaveBtn").addEventListener("click", function() {
    const inventoryRecord = readFormData();
    tempInventoryData.push(inventoryRecord);
    updateInventoryList();
    resetForm();
  });

  // 「送出至 ERP」按鈕事件：將所有暫存資料傳送到後端
  document.getElementById("submitBtn").addEventListener("click", function() {
    fetch(mUrl+'/records/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempInventoryData)
    })
    .then(response => {
      if (response.ok) {
        alert("盤點資料已成功送出至ERP！");
        console.log("送出至ERP data:",tempInventoryData)
        tempInventoryData = [];
        updateInventoryList();

      } else {
        alert("送出失敗，請稍後再試！");
      }
    })
    .catch(error => {
      console.error('Error submitting inventory data:', error);
      alert("送出失敗，請檢查網路連線！");
    });
  });
});

/**
 * 停止掃描功能：若正在掃描則停止並清除掃描器，同時隱藏掃描容器  
 * 回傳 Promise 以便後續連鎖操作
 */
function stopScanning() {
  if (!isScanning || !html5QrCode) {
    const readerDiv = document.getElementById("reader");
    if (readerDiv) {
      readerDiv.style.display = "none";
    }
    return Promise.resolve();
  }
  return html5QrCode.stop()
    .then(() => {
      console.log("掃描已停止。");
      html5QrCode.clear();
      isScanning = false;
      const readerDiv = document.getElementById("reader");
      if (readerDiv) {
        readerDiv.style.display = "none";
      }
    })
    .catch(err => {
      console.error("停止掃描時發生錯誤：", err);
      isScanning = false;
      const readerDiv = document.getElementById("reader");
      if (readerDiv) {
        readerDiv.style.display = "none";
      }
      return Promise.resolve();
    });
}

/**
 * 啟動掃描功能：先停止舊的掃描器，再建立新的掃描器並啟動  
 */
function startScanning() {
  stopScanning().finally(() => {
    // 顯示掃描容器（浮動於欄位下），不強制固定高度，讓畫面自動調整
    const readerDiv = document.getElementById("reader");
    if (readerDiv) {
      readerDiv.style.display = "block";
    }
    html5QrCode = new Html5Qrcode("reader");
    startScanningWithCamera();
  });
}

/**
 * 嘗試使用後置鏡頭啟動掃描，若失敗則改用前置鏡頭  
 * 調整參數以便對較不清楚的條碼也能快速敏捷掃描，並請求自動對焦
 */
function startScanningWithCamera() {
  const configBack = {
    fps: 160, // 提高 fps
    qrbox: { width: 300, height: 300 },
    videoConstraints: { 
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      advanced: [
        { focusMode: "continuous" },
        { exposureMode: "continuous" },     // 嘗試連續曝光補償
        { whiteBalanceMode: "continuous" }    // 嘗試自動白平衡
        /*{ torch: true }*/ // 嘗試開啟閃光燈/紅外線
      ] // 請求連續自動對焦
    },
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };

  html5QrCode.start(configBack.videoConstraints, configBack, onScanSuccess, onScanError)
    .then(() => {
      isScanning = true;
      console.log("使用後置鏡頭啟動掃描 (高 fps、自動對焦設定)。");
    })
    .catch(err => {
      console.warn("後置鏡頭啟動失敗，改用前置鏡頭。錯誤：", err);
      const configFront = {
        fps: 30,
        qrbox: { width: 300, height: 300 },
        videoConstraints: { 
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }]
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };
      html5QrCode.start(configFront.videoConstraints, configFront, onScanSuccess, onScanError)
        .then(() => {
          isScanning = true;
          console.log("使用前置鏡頭啟動掃描 (高 fps、自動對焦設定)。");
        })
        .catch(err => {
          console.error("前置鏡頭啟動也失敗：", err);
        });
    });
}

/**
 * 掃描成功回調：  
 * 1. 將掃描到的條碼填入「國際條碼」欄位  
 * 2. 根據條碼自動填入其他相關欄位（若資料庫有對應資料）  
 * 3. 成功後立即停止掃描
 */
function onScanSuccess(decodedText, decodedResult) {
  const trimmedText = decodedText.trim();
  document.getElementById("barcode").value = trimmedText;//decodedText;
  const product = productList.find(item => item.Pno === trimmedText);//decodedText);
  if (product) {
    document.getElementById("productName").value = product.PName;
    document.getElementById("storageCode").value = product.storageCode;
  }
  //2025/2/24新增

// 嘗試從 decodedResult 取得條碼幾何資訊（例如條碼的寬度）
  if (decodedResult && decodedResult.resultPoints && decodedResult.resultPoints.length >= 2) {
    // 假設第一、二點代表條碼的左右兩端，計算兩點距離作為寬度（像素值）
    const pt1 = decodedResult.resultPoints[0];
    const pt2 = decodedResult.resultPoints[1];
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    const barcodeWidth = Math.sqrt(dx * dx + dy * dy);
    console.log("偵測到的條碼寬度（像素）：", barcodeWidth);
    
    // 如有需要，可將此數值顯示在頁面上或進一步處理
    // 例如：document.getElementById("barcodeSizeDisplay").textContent = barcodeWidth;
  } else {
    console.warn("無法取得條碼幾何資訊，請確認瀏覽器及掃描器是否支援。");
  }

  stopScanning();
}

/**
 * 掃描錯誤回調：  
 * 若錯誤訊息包含常見提示則忽略，避免重複印出錯誤訊息
 */
function onScanError(errorMessage) {
  if (
    errorMessage.indexOf("No barcode or QR code detected") !== -1 ||
    errorMessage.indexOf("No MultiFormat Readers were able to detect the code") !== -1
  ) {
    return;
  }
  console.warn("掃描錯誤：", errorMessage);
}

/**
 * 讀取表單欄位值，回傳一個盤點記錄物件
 */
function readFormData() {
  return {
    barcode: document.getElementById("barcode").value,
    productName: document.getElementById("productName").value,
    storeCode: document.getElementById("storeCode").value,
    batchNumber: document.getElementById("batchNumber").value,
    expiration: document.getElementById("expiration").value,
    storageCode: document.getElementById("storageCode").value,
    count: parseInt(document.getElementById("count").value) || 0,
    // 新增存入時間
    timestamp: new Date().toISOString()
  };
}

/**
 * 更新暫存清單的顯示，每筆記錄以列表呈現
 */
function updateInventoryList() {
  const listElement = document.getElementById("inventoryList");
  listElement.innerHTML = "";
  tempInventoryData.forEach((record, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `記錄 ${index + 1}: 條碼: ${record.barcode}, 名稱: ${record.productName}, 門店: ${record.storeCode}, 批號: ${record.batchNumber}, 有效日: ${record.expiration}, 儲位: ${record.storageCode}, 數量: ${record.count}`;
    listElement.appendChild(listItem);
  });
}

/**
 * 重置表單，但保留「門店代號」與「儲位代號」，並將焦點設回「國際條碼」欄位
 */
function resetForm() {
  const storeCode = document.getElementById("storeCode").value;
  const storageCode = document.getElementById("storageCode").value;
  document.getElementById("inventoryForm").reset();
  document.getElementById("storeCode").value = storeCode;
  document.getElementById("storageCode").value = storageCode;
  document.getElementById("barcode").focus();
}


// 當使用者關閉或離開頁面時，若有暫存資料，則送回後端
window.addEventListener("beforeunload", function(event) {
  // 如果暫存資料陣列非空，送出資料
  if (tempInventoryData && tempInventoryData.length > 0) {
    const url = mUrl+'/records/'; // 請依實際後端 API 調整 URL
    const data = JSON.stringify(tempInventoryData);
    const blob = new Blob([data], { type: 'application/json' });
    
    // 使用 sendBeacon 發送資料（非同步且不阻塞頁面卸載）
    navigator.sendBeacon(url, blob);
  }

  // 清除 sessionStorage 中的所有資料
  sessionStorage.clear();
});


/*
// 當「國際條碼」欄位失去焦點時檢查
document.getElementById("barcode").addEventListener("blur", function() {
  if (this.value.trim() === "") {
    alert("國際條碼不能為空！");
    this.focus(); // 提示後重新聚焦
  }
});

// 當「門店代號」欄位失去焦點時檢查
document.getElementById("storeCode").addEventListener("blur", function() {
  if (this.value.trim() === "") {
    alert("門店代號不能為空！");
    this.focus();
  }
});
*/
